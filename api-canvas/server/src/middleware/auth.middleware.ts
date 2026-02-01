/**
 * Authentication Middleware - JWT token verification
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware.js';

export interface AuthRequest extends Request {
    userId?: string;
}

interface JWTPayload {
    userId: string;
}

/**
 * Middleware to authenticate JWT tokens
 */
export function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No authentication token provided', 401);
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        // Verify token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET not configured');
        }

        try {
            const decoded = jwt.verify(token, secret) as JWTPayload;

            // Attach userId to request
            req.userId = decoded.userId;

            next();
        } catch (jwtError: any) {
            if (jwtError.name === 'TokenExpiredError') {
                throw new AppError('Token has expired, please login again', 401);
            } else if (jwtError.name === 'JsonWebTokenError') {
                throw new AppError('Invalid token', 401);
            } else {
                throw new AppError('Token verification failed', 401);
            }
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Optional authentication - doesn't fail if no token
 * Useful for public endpoints that have optional user features
 */
export function optionalAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const secret = process.env.JWT_SECRET;

            if (secret) {
                try {
                    const decoded = jwt.verify(token, secret) as JWTPayload;
                    req.userId = decoded.userId;
                } catch {
                    // Ignore errors for optional auth
                }
            }
        }

        next();
    } catch (error) {
        next(error);
    }
}

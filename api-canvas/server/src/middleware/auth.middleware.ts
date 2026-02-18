/**
 * Authentication Middleware - Firebase token verification
 */

import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase.js';
import { AppError } from './error.middleware.js';

export interface AuthRequest extends Request {
    userId?: string;       // MongoDB user _id
    firebaseUid?: string;  // Firebase UID
    firebaseUser?: {
        uid: string;
        email?: string;
        name?: string;
        picture?: string;
        provider?: string;
    };
}

/**
 * Middleware to authenticate Firebase ID tokens
 * Extracts and verifies the Bearer token from the Authorization header
 */
export async function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No authentication token provided', 401);
        }

        // Extract token (remove 'Bearer ' prefix)
        const idToken = authHeader.substring(7);

        try {
            // Verify the Firebase ID token
            const decodedToken = await getFirebaseAuth().verifyIdToken(idToken);

            // Attach Firebase user info to request
            req.firebaseUid = decodedToken.uid;
            req.firebaseUser = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name,
                picture: decodedToken.picture,
                provider: decodedToken.firebase?.sign_in_provider,
            };

            next();
        } catch (firebaseError: any) {
            if (firebaseError.code === 'auth/id-token-expired') {
                throw new AppError('Token has expired, please sign in again', 401);
            } else if (firebaseError.code === 'auth/id-token-revoked') {
                throw new AppError('Token has been revoked, please sign in again', 401);
            } else if (firebaseError.code === 'auth/argument-error') {
                throw new AppError('Invalid token format', 401);
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
export async function optionalAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const idToken = authHeader.substring(7);

            try {
                const decodedToken = await getFirebaseAuth().verifyIdToken(idToken);
                req.firebaseUid = decodedToken.uid;
                req.firebaseUser = {
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    name: decodedToken.name,
                    picture: decodedToken.picture,
                    provider: decodedToken.firebase?.sign_in_provider,
                };
            } catch {
                // Ignore errors for optional auth
            }
        }

        next();
    } catch (error) {
        next(error);
    }
}

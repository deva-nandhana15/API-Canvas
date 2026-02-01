/**
 * Authentication Controller - User registration and login
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../middleware/error.middleware.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * Generate JWT token
 */
function generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!secret) {
        throw new Error('JWT_SECRET not configured in environment variables');
    }

    return jwt.sign({ userId }, secret, { expiresIn });
}

/**
 * Register new user
 * POST /api/auth/register
 */
export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, password, name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new AppError('User with this email already exists', 400);
        }

        // Create new user (password will be hashed by the model)
        const user = await User.create({
            email: email.toLowerCase(),
            password,
            name
        });

        // Generate JWT token
        const token = generateToken(user._id.toString());

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate JWT token
        const token = generateToken(user._id.toString());

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getMe(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export async function updateProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (name) {
            user.name = name;
            await user.save();
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
}

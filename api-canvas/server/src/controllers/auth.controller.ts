/**
 * Authentication Controller - Firebase Auth + MongoDB user sync
 * 
 * Flow:
 * 1. Frontend authenticates user via Firebase SDK (Google or Email/Password)
 * 2. Frontend sends Firebase ID token in Authorization header
 * 3. Middleware verifies the token and attaches Firebase user info
 * 4. Controller syncs/retrieves the user from MongoDB
 */

import { Response, NextFunction } from 'express';
import User from '../models/User.js';
import { AppError } from '../middleware/error.middleware.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * Sync Firebase user with MongoDB (create or update)
 * Called after first login or when user data needs refreshing
 * POST /api/auth/sync
 */
export async function syncUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { uid, email, name, picture, provider } = req.firebaseUser!;

        if (!uid || !email) {
            throw new AppError('Invalid Firebase token data', 400);
        }

        // Find existing user or create new one
        let user = await User.findOne({ firebaseUid: uid });

        if (user) {
            // Update existing user with latest Firebase data
            user.email = email;
            if (name) user.name = name;
            if (picture) user.photoURL = picture;
            if (provider) user.provider = provider;
            await user.save();
        } else {
            // Create new user in MongoDB
            user = await User.create({
                firebaseUid: uid,
                email: email,
                name: name || email.split('@')[0],
                photoURL: picture || null,
                provider: provider || 'password',
            });
        }

        res.status(200).json({
            success: true,
            message: user.createdAt === user.updatedAt ? 'User created' : 'User synced',
            user: {
                id: user._id,
                firebaseUid: user.firebaseUid,
                email: user.email,
                name: user.name,
                photoURL: user.photoURL,
                provider: user.provider,
                createdAt: user.createdAt,
            },
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
        const user = await User.findOne({ firebaseUid: req.firebaseUid });

        if (!user) {
            throw new AppError('User not found. Please sync your account first.', 404);
        }

        // Attach MongoDB userId for downstream use
        req.userId = user._id.toString();

        res.json({
            success: true,
            user: {
                id: user._id,
                firebaseUid: user.firebaseUid,
                email: user.email,
                name: user.name,
                photoURL: user.photoURL,
                provider: user.provider,
                createdAt: user.createdAt,
            },
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

        const user = await User.findOne({ firebaseUid: req.firebaseUid });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (name && typeof name === 'string' && name.trim()) {
            user.name = name.trim();
            await user.save();
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                firebaseUid: user.firebaseUid,
                email: user.email,
                name: user.name,
                photoURL: user.photoURL,
                provider: user.provider,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete user account
 * DELETE /api/auth/account
 */
export async function deleteAccount(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const user = await User.findOneAndDelete({ firebaseUid: req.firebaseUid });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}

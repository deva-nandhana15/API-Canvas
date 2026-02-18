/**
 * Authentication routes (Firebase-based)
 * 
 * All routes require a valid Firebase ID token in the Authorization header.
 * The frontend handles sign-in via Firebase SDK; this backend only verifies tokens.
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All auth routes require a valid Firebase token
router.use(authenticate);

// Sync Firebase user to MongoDB (call after login/signup on frontend)
router.post('/sync', authController.syncUser);

// Get current user profile
router.get('/me', authController.getMe);

// Update user profile
router.put('/profile', authController.updateProfile);

// Delete user account
router.delete('/account', authController.deleteAccount);

export default router;

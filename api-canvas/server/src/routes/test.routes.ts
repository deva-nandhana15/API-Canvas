/**
 * Test routes
 */

import { Router } from 'express';
import * as testController from '../controllers/test.controller.js';
import { validateTestRequest } from '../middleware/validation.middleware.js';

const router = Router();

// Execute API test
router.post('/', validateTestRequest, testController.executeTest);

// Health check
router.get('/health', testController.getTestHealth);

export default router;

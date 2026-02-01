/**
 * Project routes - All routes require authentication
 */

import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { validateProject } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All project routes require authentication
router.use(authenticate);

// Create new project
router.post('/', validateProject, projectController.createProject);

// Get all projects (user's own projects)
router.get('/', projectController.getAllProjects);

// Get project by ID
router.get('/:id', projectController.getProjectById);

// Update project
router.put('/:id', validateProject, projectController.updateProject);

// Delete project
router.delete('/:id', projectController.deleteProject);

export default router;

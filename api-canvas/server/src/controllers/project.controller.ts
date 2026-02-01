/**
 * Project controller - handles project CRUD operations with MongoDB
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Project from '../models/Project.js';
import { AppError } from '../middleware/error.middleware.js';
import mongoose from 'mongoose';

/**
 * Create a new project
 */
export async function createProject(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, description, endpoints } = req.body;

        const project = await Project.create({
            userId: req.userId,
            name: name.trim(),
            description: description?.trim() || '',
            endpoints: endpoints || []
        });

        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
}

/**
 * Get all projects for the authenticated user
 */
export async function getAllProjects(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Only return projects belonging to authenticated user
        const projects = await Project.find({ userId: req.userId })
            .sort({ updatedAt: -1 });

        res.json(projects);
    } catch (error) {
        next(error);
    }
}

/**
 * Get project by ID (only if it belongs to the user)
 */
export async function getProjectById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid project ID', 400);
        }

        const project = await Project.findOne({
            _id: id,
            userId: req.userId // Ensure user owns this project
        });

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        res.json(project);
    } catch (error) {
        next(error);
    }
}

/**
 * Update project (only if it belongs to the user)
 */
export async function updateProject(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const { name, description, endpoints } = req.body;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid project ID', 400);
        }

        const project = await Project.findOne({
            _id: id,
            userId: req.userId // Ensure user owns this project
        });

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        // Update fields
        if (name !== undefined) project.name = name.trim();
        if (description !== undefined) project.description = description.trim();
        if (endpoints !== undefined) project.endpoints = endpoints;

        await project.save();

        res.json(project);
    } catch (error) {
        next(error);
    }
}

/**
 * Delete project (only if it belongs to the user)
 */
export async function deleteProject(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid project ID', 400);
        }

        const result = await Project.deleteOne({
            _id: id,
            userId: req.userId // Ensure user owns this project
        });

        if (result.deletedCount === 0) {
            throw new AppError('Project not found', 404);
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

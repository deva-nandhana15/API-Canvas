/**
 * Request validation middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware.js';
import { APIProject, TestRequest } from '../types/index.js';

/**
 * Validate project data
 */
export function validateProject(req: Request, res: Response, next: NextFunction): void {
    const { name, endpoints } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Project name is required and must be a non-empty string', 400);
    }

    if (endpoints && !Array.isArray(endpoints)) {
        throw new AppError('Endpoints must be an array', 400);
    }

    if (endpoints) {
        for (const endpoint of endpoints) {
            if (!endpoint.id || !endpoint.method || !endpoint.url) {
                throw new AppError('Each endpoint must have id, method, and url', 400);
            }

            const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
            if (!validMethods.includes(endpoint.method.toUpperCase())) {
                throw new AppError(`Invalid HTTP method: ${endpoint.method}`, 400);
            }
        }
    }

    next();
}

/**
 * Validate test request
 */
export function validateTestRequest(req: Request, res: Response, next: NextFunction): void {
    const { method, url } = req.body as TestRequest;

    if (!method || typeof method !== 'string') {
        throw new AppError('Request method is required', 400);
    }

    if (!url || typeof url !== 'string') {
        throw new AppError('Request URL is required', 400);
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(method.toUpperCase())) {
        throw new AppError(`Invalid HTTP method: ${method}`, 400);
    }

    // Basic URL validation
    try {
        new URL(url);
    } catch {
        throw new AppError('Invalid URL format', 400);
    }

    next();
}

/**
 * Validate user registration
 */
export function validateRegister(req: Request, res: Response, next: NextFunction): void {
    const { email, password, name } = req.body;

    if (!email || typeof email !== 'string') {
        throw new AppError('Email is required', 400);
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new AppError('Please provide a valid email address', 400);
    }

    if (!password || typeof password !== 'string') {
        throw new AppError('Password is required', 400);
    }

    if (password.length < 6) {
        throw new AppError('Password must be at least 6 characters long', 400);
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Name is required', 400);
    }

    next();
}

/**
 * Validate user login
 */
export function validateLogin(req: Request, res: Response, next: NextFunction): void {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string') {
        throw new AppError('Email is required', 400);
    }

    if (!password || typeof password !== 'string') {
        throw new AppError('Password is required', 400);
    }

    next();
}

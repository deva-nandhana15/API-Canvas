/**
 * Global error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/index.js';

export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}

export function errorHandler(
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('Error:', err);

    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = err.message || 'Internal server error';

    const errorResponse: ErrorResponse = {
        error: err.name || 'Error',
        message,
        statusCode
    };

    res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        statusCode: 404
    });
}

/**
 * Test controller - handles API testing/proxy functionality
 */

import { Request, Response, NextFunction } from 'express';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { TestRequest, TestResponse } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * Execute API test request
 */
export async function executeTest(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { method, url, headers, queryParams, body, timeout } = req.body as TestRequest;

        const startTime = Date.now();

        // Build axios config
        const config: AxiosRequestConfig = {
            method: method.toUpperCase(),
            url,
            headers: headers || {},
            params: queryParams || {},
            timeout: timeout || 30000, // 30 second default timeout
            validateStatus: () => true // Accept any status code
        };

        // Add body for methods that support it
        if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
            config.data = body;
        }

        try {
            const response: AxiosResponse = await axios(config);
            const duration = Date.now() - startTime;

            const testResponse: TestResponse = {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers as Record<string, string>,
                data: response.data,
                duration
            };

            res.json(testResponse);
        } catch (axiosError: any) {
            const duration = Date.now() - startTime;

            // Handle axios errors (network errors, timeouts, etc.)
            if (axiosError.response) {
                // Server responded with error status
                const testResponse: TestResponse = {
                    status: axiosError.response.status,
                    statusText: axiosError.response.statusText,
                    headers: axiosError.response.headers as Record<string, string>,
                    data: axiosError.response.data,
                    duration,
                    error: axiosError.message
                };
                res.json(testResponse);
            } else if (axiosError.request) {
                // Request made but no response
                const testResponse: TestResponse = {
                    status: 0,
                    statusText: 'No Response',
                    headers: {},
                    data: null,
                    duration,
                    error: axiosError.message || 'Network error: No response received'
                };
                res.json(testResponse);
            } else {
                // Error setting up request
                throw new AppError(`Request setup error: ${axiosError.message}`, 400);
            }
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Get health status of test service
 */
export async function getTestHealth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        res.json({
            status: 'ok',
            message: 'API testing service is running',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
}

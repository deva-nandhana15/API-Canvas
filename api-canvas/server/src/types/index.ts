/**
 * Type definitions for API Canvas backend
 */

export interface APIEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: any;
    description?: string;
}

export interface APIProject {
    id: string;
    name: string;
    description?: string;
    endpoints: APIEndpoint[];
    createdAt: string;
    updatedAt: string;
}

export interface TestRequest {
    method: string;
    url: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: any;
    timeout?: number;
}

export interface TestResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    duration: number;
    error?: string;
}

export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
}

// Authentication types
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        createdAt: Date;
    };
}


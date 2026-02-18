/**
 * API Canvas Backend Server
 * Main entry point for the Express application
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { initializeFirebase } from './config/firebase.js';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import testRoutes from './routes/test.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'API Canvas server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/test', testRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to API Canvas Backend',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            projects: '/api/projects',
            test: '/api/test'
        }
    });
});

// Error handling - must be last
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Firebase and connect to database, then start server
initializeFirebase();

connectDatabase().then(() => {
    const server = app.listen(PORT, () => {
        console.log('\n' + '='.repeat(50));
        console.log('🚀 API Canvas Backend Server');
        console.log('='.repeat(50));
        console.log(`📡 Server running on: http://localhost:${PORT}`);
        console.log(`🌐 CORS enabled for: ${CORS_ORIGIN}`);
        console.log(`⏰ Started at: ${new Date().toISOString()}`);
        console.log('='.repeat(50) + '\n');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\n📴 SIGTERM received, shutting down gracefully...');
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('\n📴 SIGINT received, shutting down gracefully...');
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });
}).catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

export default app;

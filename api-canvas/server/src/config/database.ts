/**
 * MongoDB Database Configuration
 */

import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/api-canvas';

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        console.error('💡 Make sure MongoDB is running or check your MONGODB_URI in .env');
        process.exit(1);
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
    });
}

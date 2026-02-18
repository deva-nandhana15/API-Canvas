/**
 * Project Model - MongoDB schema for API projects with user association
 */

import mongoose, { Schema, Document } from 'mongoose';
import { APIProject } from '../types/index.js';

export interface IProject extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    endpoints: any[];
    createdAt: Date;
    updatedAt: Date;
}

const endpointSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    headers: {
        type: Schema.Types.Mixed,
        default: {}
    },
    queryParams: {
        type: Schema.Types.Mixed,
        default: {}
    },
    body: {
        type: Schema.Types.Mixed,
        default: null
    },
    description: {
        type: String,
        default: ''
    }
}, { _id: false });

const projectSchema = new Schema<IProject>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true // Index for faster queries
    },
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    endpoints: [endpointSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp on save
// @ts-ignore
projectSchema.pre('save', function (next: (err?: mongoose.CallbackError) => void) {
    this.updatedAt = new Date();
    next();
});

// Create indexes for better query performance
projectSchema.index({ userId: 1, updatedAt: -1 });

// Clean up response
projectSchema.set('toJSON', {
    transform: (doc, ret) => {
        (ret as any).id = ret._id.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project;

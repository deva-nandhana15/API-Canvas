/**
 * User Model - MongoDB schema for Firebase-authenticated users
 * Stores user profile data linked to Firebase Auth UID
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    name: string;
    photoURL?: string;
    provider: string; // 'google.com', 'password', etc.
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    firebaseUid: {
        type: String,
        required: [true, 'Firebase UID is required'],
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    photoURL: {
        type: String,
        default: null
    },
    provider: {
        type: String,
        default: 'password'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp
// @ts-ignore
userSchema.pre('save', function (next: (err?: mongoose.CallbackError) => void) {
    this.updatedAt = new Date();
    next();
});

// Clean JSON output
userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        ret.__v = undefined;
        return ret;
    }
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;

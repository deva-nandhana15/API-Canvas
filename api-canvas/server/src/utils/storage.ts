/**
 * File-based storage utility for API Canvas projects
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { APIProject } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data directory path
const DATA_DIR = path.join(__dirname, '../../data/projects');

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

/**
 * Save a project to file storage
 */
export async function saveProject(project: APIProject): Promise<APIProject> {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, `${project.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');
    return project;
}

/**
 * Get a project by ID
 */
export async function getProject(id: string): Promise<APIProject | null> {
    try {
        const filePath = path.join(DATA_DIR, `${id}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data) as APIProject;
    } catch (error) {
        return null;
    }
}

/**
 * Get all projects
 */
export async function getAllProjects(): Promise<APIProject[]> {
    await ensureDataDir();

    try {
        const files = await fs.readdir(DATA_DIR);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        const projects = await Promise.all(
            jsonFiles.map(async (file) => {
                const filePath = path.join(DATA_DIR, file);
                const data = await fs.readFile(filePath, 'utf-8');
                return JSON.parse(data) as APIProject;
            })
        );

        // Sort by updated date (newest first)
        return projects.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    } catch (error) {
        return [];
    }
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id: string): Promise<boolean> {
    try {
        const filePath = path.join(DATA_DIR, `${id}.json`);
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Check if a project exists
 */
export async function projectExists(id: string): Promise<boolean> {
    try {
        const filePath = path.join(DATA_DIR, `${id}.json`);
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

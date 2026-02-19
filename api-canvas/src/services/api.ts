import axios from 'axios';
import { auth } from '../config/firebase';
import type { APIProject, TestRequest, TestResponse, UserProfile } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API_BASE });

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ────────────────────────────────────── Auth ──────────────────────────────────────

export async function syncUser(): Promise<UserProfile> {
  const { data } = await api.post('/api/auth/sync');
  return data.user as UserProfile;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get('/api/auth/me');
  return data.user as UserProfile;
}

export async function updateProfile(name: string): Promise<UserProfile> {
  const { data } = await api.put('/api/auth/profile', { name });
  return data.user as UserProfile;
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/api/auth/account');
}

// ────────────────────────────────────── Projects ──────────────────────────────────────

export async function getAllProjects(): Promise<APIProject[]> {
  const { data } = await api.get('/api/projects');
  return data as APIProject[];
}

export async function getProjectById(id: string): Promise<APIProject> {
  const { data } = await api.get(`/api/projects/${id}`);
  return data as APIProject;
}

export async function createProject(
  payload: Pick<APIProject, 'name' | 'description' | 'endpoints'>,
): Promise<APIProject> {
  const { data } = await api.post('/api/projects', payload);
  return data as APIProject;
}

export async function updateProject(
  id: string,
  payload: Partial<Pick<APIProject, 'name' | 'description' | 'endpoints'>>,
): Promise<APIProject> {
  const { data } = await api.put(`/api/projects/${id}`, payload);
  return data as APIProject;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/api/projects/${id}`);
}

// ────────────────────────────────────── Test Proxy ──────────────────────────────────────

export async function executeTestRequest(req: TestRequest): Promise<TestResponse> {
  const { data } = await api.post('/api/test', req);
  return data as TestResponse;
}

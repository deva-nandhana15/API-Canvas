export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface APIEndpoint {
  id: string;
  method: HTTPMethod;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
  description?: string;
}

export interface APIProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  endpoints: APIEndpoint[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  photoURL?: string | null;
  provider: string;
  createdAt: string;
}

export interface TestRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface TestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  duration: number;
  error?: string;
}

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export type Tab = 'params' | 'headers' | 'body';
export type ResponseTab = 'body' | 'headers';

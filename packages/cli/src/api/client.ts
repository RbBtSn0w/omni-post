import axios from 'axios';
import type {
  ApiEnvelope,
  BrowserProfile,
  CreateArticleRequest,
  CreateArticleResponse,
  ExploreResult,
  LinkProfileRequest,
  PublishArticleRequest,
  PublishArticleResponse,
  PublishTask,
} from '../types.js';

const API_BASE_URL = process.env.OMNI_API_URL || 'http://localhost:5409';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Simple masking for debug output
apiClient.interceptors.request.use(config => {
  const maskedConfig = { ...config };
  if (maskedConfig.data && typeof maskedConfig.data === 'object') {
    const requestData = maskedConfig.data as Record<string, unknown>;
    if (requestData.cookie) requestData.cookie = '***MASKED***';
    if (requestData.password) requestData.password = '***MASKED***';
  }
  return config;
});

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return typeof obj.code === 'number' && 'data' in obj;
}

function parseTasksResponse(payload: PublishTask[] | ApiEnvelope<PublishTask[]>): PublishTask[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload.data === null) {
    throw new Error('Invalid tasks response: data is null');
  }

  if (!Array.isArray(payload.data)) {
    throw new Error('Invalid tasks response: data is not an array');
  }

  return payload.data;
}

export const api = {
  // Browser Profiles
  getProfiles: () =>
    apiClient.get<BrowserProfile[]>('/api/browser/profiles').then((res) => res.data),
  linkProfile: (data: LinkProfileRequest) =>
    apiClient.post<{ id: string }>('/api/browser/profiles', data).then((res) => res.data),

  // Articles
  createArticle: (data: CreateArticleRequest) =>
    apiClient.post<CreateArticleResponse>('/api/articles', data).then((res) => res.data),
  publishArticle: (data: PublishArticleRequest) =>
    apiClient.post<PublishArticleResponse>('/api/publish/article', data).then((res) => res.data),

  // Explore
  explore: (url: string) =>
    apiClient.get<ExploreResult>('/api/explore', { params: { url } }).then((res) => res.data),

  // Tasks
  getTasks: () =>
    apiClient
      .get<PublishTask[] | ApiEnvelope<PublishTask[]>>('/api/publish/tasks')
      .then((res) => {
        if (!Array.isArray(res.data) && !isApiEnvelope<PublishTask[]>(res.data)) {
          throw new Error('Invalid tasks response: unsupported payload shape');
        }
        return parseTasksResponse(res.data);
      }),
};

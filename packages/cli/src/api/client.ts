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
    apiClient.get<ApiEnvelope<BrowserProfile[]>>('/profiles').then((res) => {
      const payload = res.data;
      return isApiEnvelope<BrowserProfile[]>(payload) ? (payload.data || []) : (payload as unknown as BrowserProfile[]);
    }),
  linkProfile: (data: LinkProfileRequest) =>
    apiClient.post<ApiEnvelope<{ id: string }>>('/profiles', data).then((res) => {
      const payload = res.data;
      return isApiEnvelope<{ id: string }>(payload) ? payload.data! : (payload as unknown as { id: string });
    }),

  // Articles
  createArticle: (data: CreateArticleRequest) =>
    apiClient.post<ApiEnvelope<CreateArticleResponse>>('/articles', data).then((res) => {
      const payload = res.data;
      return isApiEnvelope<CreateArticleResponse>(payload) ? payload.data! : (payload as unknown as CreateArticleResponse);
    }),
  publishArticle: (data: PublishArticleRequest) =>
    apiClient.post<ApiEnvelope<PublishArticleResponse>>('/publish/article', data).then((res) => {
      const payload = res.data;
      return isApiEnvelope<PublishArticleResponse>(payload) ? payload.data! : (payload as unknown as PublishArticleResponse);
    }),

  // Explore
  explore: (url: string) =>
    apiClient.get<ApiEnvelope<ExploreResult>>('/explore', { params: { url } }).then((res) => {
      const payload = res.data;
      return isApiEnvelope<ExploreResult>(payload) ? payload.data! : (payload as unknown as ExploreResult);
    }),

  // Tasks
  getTasks: () =>
    apiClient
      .get<PublishTask[] | ApiEnvelope<PublishTask[]>>('/tasks')
      .then((res) => {
        if (!Array.isArray(res.data) && !isApiEnvelope<PublishTask[]>(res.data)) {
          throw new Error('Invalid tasks response: unsupported payload shape');
        }
        return parseTasksResponse(res.data);
      }),
};

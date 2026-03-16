import axios from 'axios';

const API_BASE_URL = process.env.OMNI_API_URL || 'http://localhost:5409';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Simple masking for debug output
apiClient.interceptors.request.use(config => {
  const maskedConfig = { ...config };
  if (maskedConfig.data && typeof maskedConfig.data === 'object') {
    if (maskedConfig.data.cookie) maskedConfig.data.cookie = '***MASKED***';
    if (maskedConfig.data.password) maskedConfig.data.password = '***MASKED***';
  }
  return config;
});

export const api = {
  // Browser Profiles
  getProfiles: () => apiClient.get('/api/browser/profiles').then(res => res.data),
  linkProfile: (data: any) => apiClient.post('/api/browser/profiles', data).then(res => res.data),
  
  // Articles
  createArticle: (data: any) => apiClient.post('/api/articles', data).then(res => res.data),
  publishArticle: (data: any) => apiClient.post('/api/publish/article', data).then(res => res.data),
  
  // Explore
  explore: (url: string) => apiClient.get('/api/explore', { params: { url } }).then(res => res.data),
  
  // Tasks
  getTasks: () => apiClient.get('/api/publish/tasks').then(res => res.data),
};

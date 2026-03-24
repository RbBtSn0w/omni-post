/**
 * Global configuration for the frontend.
 */

// Maximum upload size in bytes (100GB)
export const MAX_UPLOAD_SIZE = 100 * 1024 * 1024 * 1024;

// Display label for max upload size
export const MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE / (1024 * 1024);

// API base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5409';

// Configuration for Python backend

export const BACKEND_CONFIG = {
  // Python backend URL - use NEXT_PUBLIC_ prefix for client-side access
  BACKEND_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
};

// Helper function to get backend URL
export function getBackendUrl() {
  return BACKEND_CONFIG.BACKEND_URL;
}

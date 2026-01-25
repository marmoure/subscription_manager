import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/index';
import { useAuthStore } from '../stores/authStore';
import { handleApiResponse, NetworkError, logError } from '../utils/api-error-handler';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Custom fetch wrapper to support timeout and retry logic with exponential backoff
 */
const fetchWithRetry = async (
  input: string | URL | Request,
  init?: RequestInit,
  retries = 3,
  backoff = 1000,
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    
    clearTimeout(id);
    
    // Retry on 5xx errors
    if (!response.ok && response.status >= 500 && retries > 0) {
      console.warn(`Server error (${response.status}). Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(input, init, retries - 1, backoff * 2, timeout);
    }
    
    return await handleApiResponse(response);
  } catch (error: any) {
    clearTimeout(id);
    
    // If it's already an ApiError (thrown by handleApiResponse), don't retry unless it's a 5xx
    if (error.name === 'ApiError' || error.name === 'ValidationError' || error.name === 'AuthenticationError' || error.name === 'ForbiddenError' || error.name === 'NotFoundError') {
       if (error.status < 500 && error.status !== 429) {
         throw error;
       }
    }

    if (error.name === 'AbortError') {
      if (retries > 0) {
        console.warn(`Request timed out. Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(input, init, retries - 1, backoff * 2, timeout);
      }
      throw new NetworkError(`Request timed out after ${timeout}ms`);
    }

    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      if (retries > 0) {
        console.warn(`Network error. Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(input, init, retries - 1, backoff * 2, timeout);
      }
      throw new NetworkError('Network error. Please check your internet connection.');
    }
    
    if (retries > 0) {
      console.warn(`Request failed: ${error.message}. Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(input, init, retries - 1, backoff * 2, timeout);
    }
    
    logError(error);
    throw error;
  }
};

const authenticatedFetch = async (
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> => {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(init?.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const newInit = { ...init, headers };

  try {
    return await fetchWithRetry(input, newInit);
  } catch (error: any) {
    if (error.status === 401) {
      // Avoid infinite loops if the refresh token endpoint itself returns 401
      const url = input.toString();
      if (url.includes('refresh-token') || url.includes('login')) {
         throw error;
      }

      try {
        await useAuthStore.getState().refreshAccessToken();
        const newToken = useAuthStore.getState().accessToken;
        
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          const retryInit = { ...newInit, headers };
          return await fetchWithRetry(input, retryInit);
        }
      } catch (refreshError) {
        // Refresh failed, throw original error
        throw error;
      }
    }
    throw error;
  }
};

/**
 * Hono RPC client for type-safe API communication
 */
let clientInstance: ReturnType<typeof hc<AppType>>;

try {
  clientInstance = hc<AppType>(API_URL, {
    fetch: authenticatedFetch,
  });
} catch (error) {
  console.error('Failed to initialize Hono RPC client:', error);
  clientInstance = hc<AppType>(API_URL);
}

export const client = clientInstance;
export type { AppType };

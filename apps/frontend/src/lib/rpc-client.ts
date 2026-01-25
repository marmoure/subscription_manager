import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/index';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Custom fetch wrapper to support timeout and retry logic
 */
const fetchWithRetry = async (
  input: string | URL | Request,
  init?: RequestInit,
  retries = 3,
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
    
    // Retry on 5xx errors or network failures
    if (!response.ok && response.status >= 500 && retries > 0) {
      console.warn(`Retrying request due to server error... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(input, init, retries - 1, timeout);
    }
    
    return response;
  } catch (error: any) {
    clearTimeout(id);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    
    if (retries > 0) {
      console.warn(`Request failed: ${error.message}. Retrying... (${retries} attempts left)`);
      // Exponential backoff could be added here
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(input, init, retries - 1, timeout);
    }
    
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

  let response = await fetchWithRetry(input, newInit);

  if (response.status === 401) {
    // Avoid infinite loops if the refresh token endpoint itself returns 401
    // We can check the URL or some other indicator
    if (input.toString().includes('refresh-token') || input.toString().includes('login')) {
       return response;
    }

    try {
      await useAuthStore.getState().refreshAccessToken();
      const newToken = useAuthStore.getState().accessToken;
      
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        const retryInit = { ...newInit, headers };
        return await fetchWithRetry(input, retryInit);
      }
    } catch (error) {
      // Refresh failed, return original response
      return response;
    }
  }

  return response;
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
  // Fallback or rethrow depending on how you want to handle it
  // For now, we'll let it be initialized, but it might fail during calls
  clientInstance = hc<AppType>(API_URL);
}

export const client = clientInstance;
export type { AppType };

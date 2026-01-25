import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/index';
import { useAuthStore } from '../stores/authStore';
import { handleApiResponse, NetworkError, logError } from '../utils/api-error-handler';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SOFTWARE_API_KEY = import.meta.env.VITE_SOFTWARE_API_KEY || 'dev-software-api-key-12345';
const isDev = import.meta.env.DEV;

/**
 * Utility to transform ISO date strings to Date objects recursively
 */
const transformDates = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(obj)) {
    return new Date(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(transformDates);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = transformDates(obj[key]);
    }
    return newObj;
  }
  
  return obj;
};

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
      if (isDev) console.warn(`Server error (${response.status}). Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(input, init, retries - 1, backoff * 2, timeout);
    }
    
    return await handleApiResponse(response);
  } catch (error: any) {
    clearTimeout(id);
    
    const isApiError = error.status !== undefined;
    
    if (isApiError) {
       if (error.status < 500 && error.status !== 429) {
         throw error;
       }
    }

    if (error.name === 'AbortError') {
      if (retries > 0) {
        if (isDev) console.warn(`Request timed out. Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(input, init, retries - 1, backoff * 2, timeout);
      }
      throw new NetworkError(`Request timed out after ${timeout}ms`);
    }

    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      if (retries > 0) {
        if (isDev) console.warn(`Network error. Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(input, init, retries - 1, backoff * 2, timeout);
      }
      throw new NetworkError('Network error. Please check your internet connection.');
    }
    
    if (retries > 0) {
      if (isDev) console.warn(`Request failed: ${error.message}. Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(input, init, retries - 1, backoff * 2, timeout);
    }
    
    logError(error);
    throw error;
  }
};

/**
 * Applies response interceptors to a Response object
 */
const applyResponseInterceptors = (response: Response, url: string, startTime: number): Response => {
  const duration = Date.now() - startTime;

  if (isDev) {
    console.log(`%c[API Response] %c${response.status} %c${url} %c(${duration}ms)`, 
      'color: #3b82f6; font-weight: bold;', 
      response.ok ? 'color: #10b981;' : 'color: #ef4444;', 
      'color: #6b7280;',
      'color: #9ca3af; font-style: italic;'
    );
  }

  const originalJson = response.json.bind(response);
  response.json = async () => {
    let data = await originalJson();
    
    // Transform date strings to Date objects
    data = transformDates(data);
    
    // Extract data from response wrapper if it's a simple success wrapper
    // We only extract if data is present and success is true, and no other keys like pagination or message
    if (data && typeof data === 'object' && data.success === true && data.data !== undefined) {
      const keys = Object.keys(data);
      // If it only has success and data, we can return data.data
      const otherSignificantKeys = keys.filter(k => !['success', 'data'].includes(k));
      if (otherSignificantKeys.length === 0) {
        return data.data;
      }
    }
    
    return data;
  };

  return response;
};

/**
 * Main interceptor for all RPC requests
 */
const interceptorFetch = async (
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> => {
  const url = input.toString();
  const headers = new Headers(init?.headers);
  const startTime = Date.now();

  // 1. Request Interceptors
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');
  headers.set('X-Request-Timestamp', startTime.toString());

  const token = useAuthStore.getState().accessToken;
  if (token && !url.includes('/api/v1/')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (url.includes('/api/v1/')) {
    headers.set('X-API-Key', SOFTWARE_API_KEY);
  }

  const newInit = { ...init, headers };

  if (isDev) {
    console.log(`%c[API Request] %c${newInit.method || 'GET'} %c${url}`, 
      'color: #3b82f6; font-weight: bold;', 
      'color: #10b981; font-weight: bold;', 
      'color: #6b7280;'
    );
  }

  try {
    const response = await fetchWithRetry(input, newInit);
    return applyResponseInterceptors(response, url, startTime);
  } catch (error: any) {
    if (error.status === 401) {
      if (url.includes('refresh-token') || url.includes('login')) {
         throw error;
      }

      if (isDev) console.log('%c[Auth] %cToken expired, attempting refresh...', 'color: #f59e0b; font-weight: bold;', 'color: #6b7280;');

      try {
        await useAuthStore.getState().refreshAccessToken();
        const newToken = useAuthStore.getState().accessToken;
        
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          if (isDev) console.log('%c[Auth] %cRefresh successful, retrying request', 'color: #10b981; font-weight: bold;', 'color: #6b7280;');
          const response = await fetchWithRetry(input, { ...newInit, headers });
          return applyResponseInterceptors(response, url, startTime);
        }
      } catch (refreshError) {
        if (isDev) console.error('%c[Auth] %cRefresh failed, logging out', 'color: #ef4444; font-weight: bold;', 'color: #6b7280;');
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
    fetch: interceptorFetch,
  });
} catch (error) {
  console.error('Failed to initialize Hono RPC client:', error);
  clientInstance = hc<AppType>(API_URL);
}

export const client = clientInstance;
export type { AppType };
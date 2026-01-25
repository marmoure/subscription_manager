import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/index';

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

/**
 * Hono RPC client for type-safe API communication
 */
let clientInstance: ReturnType<typeof hc<AppType>>;

try {
  clientInstance = hc<AppType>(API_URL, {
    fetch: (input: string | URL | Request, init?: RequestInit) => fetchWithRetry(input, init),
  });
} catch (error) {
  console.error('Failed to initialize Hono RPC client:', error);
  // Fallback or rethrow depending on how you want to handle it
  // For now, we'll let it be initialized, but it might fail during calls
  clientInstance = hc<AppType>(API_URL);
}

export const client = clientInstance;
export type { AppType };

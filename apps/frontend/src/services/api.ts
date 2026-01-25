import axios, { AxiosError } from 'axios';
import { LicenseRequestFormValues } from '@/schemas/licenseRequest.schema';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple retry logic for network errors
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { config } = error;
    
    // Check if config exists and retryCount is below limit
    if (!config || (config.retryCount || 0) >= MAX_RETRIES) {
      return Promise.reject(error);
    }
    
    // Only retry on network errors or 5xx server errors (except 500 which might be application error, but 502/503/504 are usually retryable)
    // Actually, let's retry on all network errors and 5xx.
    if (!error.response || (error.response.status >= 500 && error.response.status < 600)) {
       config.retryCount = (config.retryCount || 0) + 1;
       
       // Create a promise to handle the delay
       await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * config.retryCount!));
       
       return apiClient(config);
    }
    
    return Promise.reject(error);
  }
);

// Add retryCount to AxiosRequestConfig definition for TypeScript
declare module 'axios' {
  export interface AxiosRequestConfig {
    retryCount?: number;
  }
}

export interface LicenseResponse {
  success: boolean;
  message: string;
  data?: {
    licenseKey: string;
    expiresAt: string;
  };
  error?: string;
  errors?: any; // For validation errors
}

export class ApiError extends Error {
  constructor(public message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export const submitLicenseRequest = async (data: LicenseRequestFormValues): Promise<LicenseResponse> => {
  try {
    const response = await apiClient.post<LicenseResponse>('/api/public/submit-license-request', data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
             throw new Error('Request timed out. Please try again.');
        }
        
        // Handle API specific error responses
        const errorData = error.response?.data;
        if (errorData) {
             const message = errorData.message || errorData.error || 'An unexpected error occurred';
             throw new ApiError(message, errorData);
        }
    }
    throw error;
  }
};

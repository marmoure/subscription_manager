import { useCallback } from 'react';
import { ApiError, ValidationError, AuthenticationError, ForbiddenError, NotFoundError, NetworkError } from '../utils/api-error-handler';
import { useAuthStore } from '../stores/authStore';

export interface HandledError {
  message: string;
  fieldErrors?: Record<string, string[]>;
  type: string;
}

export const useApiError = () => {
  const logout = useAuthStore((state) => state.logout);

  const handleError = useCallback((error: any): HandledError => {
    let message = 'An unexpected error occurred. Please try again.';
    let fieldErrors: Record<string, string[]> | undefined;
    let type = 'UnknownError';

    if (error instanceof ValidationError) {
      message = error.message;
      fieldErrors = error.details?.fieldErrors;
      type = 'ValidationError';
    } else if (error instanceof AuthenticationError) {
      message = 'Your session has expired. Please log in again.';
      type = 'AuthenticationError';
      logout();
    } else if (error instanceof ForbiddenError) {
      message = 'You do not have permission to perform this action.';
      type = 'ForbiddenError';
    } else if (error instanceof NotFoundError) {
      message = error.message || 'The requested resource was not found.';
      type = 'NotFoundError';
    } else if (error instanceof NetworkError) {
      message = 'Network connection issue. Please check your internet and try again.';
      type = 'NetworkError';
    } else if (error instanceof ApiError) {
      message = error.message;
      type = 'ApiError';
      if (error.status === 429) {
        message = 'Too many requests. Please slow down.';
        type = 'RateLimitError';
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    return { message, fieldErrors, type };
  }, [logout]);

  return { handleError };
};

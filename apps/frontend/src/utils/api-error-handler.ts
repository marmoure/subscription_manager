/**
 * Custom error classes for API requests
 */

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN_ERROR');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error or timeout') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Parses the backend error response and returns the appropriate ApiError instance
 */
export async function handleApiResponse(response: Response): Promise<Response> {
  if (response.ok) {
    return response;
  }

  let errorData: any;
  try {
    errorData = await response.json();
  } catch (e) {
    // Fallback if response is not JSON
    throw new ApiError(response.statusText || 'Unknown error', response.status);
  }

  const message = errorData.message || response.statusText || 'An error occurred';

  switch (response.status) {
    case 400:
      if (message === 'Validation failed' || errorData.errors) {
        throw new ValidationError(message, errorData.errors);
      }
      throw new ApiError(message, 400, errorData.code, errorData);
    case 401:
      throw new AuthenticationError(message);
    case 403:
      throw new ForbiddenError(message);
    case 404:
      throw new NotFoundError(message);
    case 429:
      throw new ApiError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_ERROR');
    default:
      if (response.status >= 500) {
        throw new ApiError('Server error. Please try again later.', response.status, 'SERVER_ERROR', errorData);
      }
      throw new ApiError(message, response.status, errorData.code, errorData);
  }
}

/**
 * Logs errors to console or error tracking service
 */
export function logError(error: any): void {
  // In a real app, this could send to Sentry, LogRocket, etc.
  if (import.meta.env.DEV) {
    console.error('[API Error]:', {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
      stack: error.stack,
    });
  } else {
    // Production logging
    console.error(`[API Error]: ${error.message} (${error.status || 'unknown'})`);
  }
}

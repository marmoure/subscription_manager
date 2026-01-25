import { apiClient } from './api';
import { LoginFormValues } from '../schemas/auth.schema';

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    admin: {
      id: number;
      username: string;
      email: string;
      role?: 'admin' | 'super-admin';
    };
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export const login = async (credentials: LoginFormValues): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/admin/login', credentials);
  return response.data;
};

export const refreshAccessToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  const response = await apiClient.post<RefreshTokenResponse>('/api/admin/refresh-token', { refreshToken });
  return response.data;
};

export const logout = async (refreshToken: string): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>('/api/admin/logout', { refreshToken });
  return response.data;
};

export const logoutAll = async (): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>('/api/admin/logout-all');
  return response.data;
};
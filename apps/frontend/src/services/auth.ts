import { ApiError } from './api';
import { client } from '../lib/rpc-client';
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

  const response = await client.api.admin.login.$post({

    json: credentials

  });



  if (!response.ok) {

    const errorData = await response.json() as any;

    throw new ApiError(errorData.message || 'Login failed', errorData);

  }



  const result = await response.json();

  return result as unknown as AuthResponse;

};



export const refreshAccessToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {

  const response = await client.api.admin['refresh-token'].$post({

    json: { refreshToken }

  });



  if (!response.ok) {

    const errorData = await response.json() as any;

    throw new ApiError(errorData.message || 'Token refresh failed', errorData);

  }



  const result = await response.json();

  return result as unknown as RefreshTokenResponse;

};



export const logout = async (refreshToken: string): Promise<{ success: boolean }> => {

  const response = await client.api.admin.logout.$post();



  if (!response.ok) {

    const errorData = await response.json() as any;

    throw new ApiError(errorData.message || 'Logout failed', errorData);

  }



  const result = await response.json();

  return result as unknown as { success: boolean };

};



export const logoutAll = async (): Promise<{ success: boolean }> => {

  const response = await client.api.admin['logout-all'].$post();



  if (!response.ok) {

    const errorData = await response.json() as any;

    throw new ApiError(errorData.message || 'Logout all failed', errorData);

  }



  const result = await response.json();

  return result as unknown as { success: boolean };

};

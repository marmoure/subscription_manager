import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const refreshAccessTokenApi = async (refreshToken: string) => {
  const response = await fetch(`${API_URL}/api/admin/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
     throw new Error('Failed to refresh token');
  }
  return await response.json();
};

export interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  setUser: (user: User) => void;
  checkTokenExpiration: () => boolean; // Returns true if valid, false if expired
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,

      login: (accessToken, refreshToken, user) => {
        set({ isAuthenticated: true, user, accessToken, refreshToken });
      },

      logout: () => {
        set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token available');

        try {
          // We don't want to use the intercepted client here to avoid infinite loops,
          // but refreshAccessTokenApi uses apiClient. 
          // We handle the loop prevention in the interceptor or by using a skip-auth flag if needed.
          // For now, let's assume the refresh endpoint is public/doesn't need the access token.
          
          const response = await refreshAccessTokenApi(refreshToken);
          if (response.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            const validRefreshToken = newRefreshToken || refreshToken;
            
            set({ accessToken, refreshToken: validRefreshToken });
          } else {
             get().logout();
             throw new Error('Refresh failed');
          }
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      setUser: (user) => set({ user }),

      checkTokenExpiration: () => {
        const { accessToken } = get();
        if (!accessToken) return false;
        try {
          const decoded: any = jwtDecode(accessToken);
          const currentTime = Date.now() / 1000;
          // Check if expired (give 10 seconds buffer)
          if (decoded.exp < currentTime + 10) {
            return false;
          }
          return true;
        } catch (error) {
          return false;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken, 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

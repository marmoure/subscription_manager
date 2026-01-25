import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import * as authService from '../services/auth';

const refreshAccessTokenApi = async (refreshToken: string) => {
  return await authService.refreshAccessToken(refreshToken);
};

export interface User {
  id: number;
  username: string;
  email: string;
  role?: 'admin' | 'super-admin';
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
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

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await authService.logout(refreshToken);
          } catch (error) {
            console.error('Logout API failed:', error);
          }
        }
        set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
        localStorage.removeItem('auth-storage'); // Clear storage explicitly if needed
      },

      logoutAll: async () => {
        try {
          await authService.logoutAll();
        } catch (error) {
          console.error('Logout All API failed:', error);
        }
        set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
        localStorage.removeItem('auth-storage');
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          throw new Error('No refresh token available');
        }

        try {
          const response = await refreshAccessTokenApi(refreshToken);
          if (response.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            const validRefreshToken = newRefreshToken || refreshToken;
            
            set({ accessToken, refreshToken: validRefreshToken });
          } else {
             await get().logout();
             throw new Error('Refresh failed');
          }
        } catch (error) {
          await get().logout();
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

// Listen for storage changes to handle logout across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'auth-storage' && !event.newValue) {
      // If auth-storage was cleared, log out this tab too
      useAuthStore.getState().logout();
    }
  });
}

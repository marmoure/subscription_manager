import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    isAuthenticated: store.isAuthenticated,
    user: store.user,
    accessToken: store.accessToken,
    login: store.login,
    logout: store.logout,
    refreshAccessToken: store.refreshAccessToken,
    checkTokenExpiration: store.checkTokenExpiration
  };
};

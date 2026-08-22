import { useAuthStore } from '../stores/auth.store';
import { apiClient } from '../lib/api-client';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const login = async (data: any) => {
    const res = await apiClient.post('/auth/login', data);
    const authData = res.data?.data || res.data;
    setAuth(authData.accessToken, authData.user);
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return { login, logout, user, isAuthenticated };
}
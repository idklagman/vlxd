import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  role: string;
}

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, user) => set({ accessToken: token, user, isAuthenticated: !!token }),
  clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false }),
  getToken: () => get().accessToken,
}));
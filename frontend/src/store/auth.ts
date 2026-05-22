import { create } from 'zustand';
import type { AuthResponse, UserDTO } from '@fiviko/shared';
import { api, loadStoredToken, setAuthToken } from '@/lib/api';

interface AuthState {
  user: UserDTO | null;
  /** True until the initial "am I logged in?" check completes. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    baseCurrency: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  /** Restore session from a stored token on app boot. */
  bootstrap: () => Promise<void>;
  setUser: (user: UserDTO) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  initializing: true,

  async login(email, password) {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    setAuthToken(data.token);
    set({ user: data.user });
  },

  async register(input) {
    const { data } = await api.post<AuthResponse>('/auth/register', input);
    setAuthToken(data.token);
    set({ user: data.user });
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setAuthToken(null);
      set({ user: null });
    }
  },

  async bootstrap() {
    const token = loadStoredToken();
    if (!token) {
      set({ initializing: false });
      return;
    }
    try {
      const { data } = await api.get<{ user: UserDTO }>('/auth/me');
      set({ user: data.user, initializing: false });
    } catch {
      setAuthToken(null);
      set({ user: null, initializing: false });
    }
  },

  setUser(user) {
    set({ user });
  },
}));

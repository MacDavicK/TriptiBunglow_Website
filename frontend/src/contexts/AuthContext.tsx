import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as adminApi from '@/services/admin.api';
import { setAccessToken, setOnUnauthenticated } from '@/services/auth-token-holder';
import { registerAuthRedirect } from '@/services/api';

export interface AdminInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  admin: AdminInfo | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

function redirectToLogin(): void {
  setAccessToken(null);
  window.location.href = '/admin/login';
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    admin: null,
  });

  const redirectToLoginCb = useCallback(() => {
    setState({ accessToken: null, admin: null });
    redirectToLogin();
  }, []);

  useEffect(() => {
    setOnUnauthenticated(redirectToLoginCb);
    registerAuthRedirect(redirectToLoginCb);
    return () => {
      setOnUnauthenticated(null);
    };
  }, [redirectToLoginCb]);

  const refreshAccessToken = useCallback(async () => {
    const result = await adminApi.refreshToken();
    setState((prev) => ({ ...prev, accessToken: result.accessToken }));
    setAccessToken(result.accessToken);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken: token, admin } = await adminApi.login(email, password);
      setState({ accessToken: token, admin });
      setAccessToken(token);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setState({ accessToken: null, admin: null });
      setAccessToken(null);
      redirectToLogin();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.accessToken && state.admin),
      login,
      logout,
      refreshAccessToken,
    }),
    [state, login, logout, refreshAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export { AuthContext };

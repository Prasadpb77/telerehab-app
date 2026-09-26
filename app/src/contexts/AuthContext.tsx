import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "../lib/api";
import {
  getToken,
  setToken,
  getStoredUser,
  setStoredUser,
  clearAuth,
  type AuthUser,
} from "../lib/authStorage";

interface AuthContextValue {
  user: AuthUser | null;
  profile: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (input: { full_name: string; email: string; password: string; phone?: string }) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(): Promise<AuthUser | null> {
    try {
      const { user: fresh } = (await api.auth.me()) as { user: AuthUser };
      setStoredUser(fresh);
      setUser(fresh);
      return fresh;
    } catch {
      // Token invalid/expired — clear local state.
      clearAuth();
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      // Optimistically hydrate from cache, then revalidate against the Worker.
      setUser(getStoredUser());
      await loadProfile();
      setLoading(false);
    })();
  }, []);

  async function signIn(email: string, password: string): Promise<AuthUser> {
    const res = (await api.auth.login(email, password)) as { token: string; user: AuthUser };
    setToken(res.token);
    setStoredUser(res.user);
    setUser(res.user);
    return res.user;
  }

  async function signUp(input: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthUser> {
    const res = (await api.auth.signup(input)) as { token: string; user: AuthUser };
    setToken(res.token);
    setStoredUser(res.user);
    setUser(res.user);
    return res.user;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut: async () => {
          clearAuth();
          setUser(null);
        },
        refreshProfile: async () => {
          await loadProfile();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/auth-storage";
import { LoginFormValues } from "@/schemas/auth.schema";
import {
  getMeRequest,
  loginRequest,
  logoutRequest,
  refreshTokenRequest,
} from "@/services/auth.service";
import { AuthUser } from "@/types";
import { ApiError } from "@/lib/api-client";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearTokens();
    setUser(null);
    setAccessToken(null);
  }, []);

  const establishSession = useCallback(
    async (token: string, refreshToken: string) => {
      setTokens(token, refreshToken);
      setAccessToken(token);
      const profile = await getMeRequest(token);
      setUser(profile);
    },
    []
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const tokens = await refreshTokenRequest(refreshToken);
      await establishSession(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, [clearSession, establishSession]);

  useEffect(() => {
    async function bootstrap() {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!token && !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        if (token) {
          const profile = await getMeRequest(token);
          setAccessToken(token);
          setUser(profile);
        } else if (refreshToken) {
          await refreshSession();
        }
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          const refreshed = await refreshSession();
          if (!refreshed) clearSession();
        } else {
          clearSession();
        }
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, [clearSession, refreshSession]);

  const login = useCallback(
    async (credentials: LoginFormValues) => {
      const { user: profile, tokens } = await loginRequest(credentials);
      setTokens(tokens.accessToken, tokens.refreshToken);
      setAccessToken(tokens.accessToken);
      setUser(profile);
      toast.success(`Welcome back, ${profile.firstName}!`);
      router.replace("/dashboard");
    },
    [router]
  );

  const logout = useCallback(async () => {
    const token = getAccessToken();
    try {
      if (token) {
        await logoutRequest(token);
      }
    } catch {
      // Clear local session even if API logout fails
    } finally {
      clearSession();
      toast.success("Logged out successfully");
      router.replace("/login");
    }
  }, [clearSession, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: !!user && !!accessToken,
      login,
      logout,
    }),
    [user, accessToken, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

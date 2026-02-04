"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { login as apiLogin, saveTokens, clearTokens, getAccessToken, LoginPayload } from "../api+/sap/auth/authService";
import { useAuthStore } from "@/stores/useAuthStore";

interface User {
  empId: string;
  userName: string;
  role: string;
  allowedModules?: string[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (userName: string, password: string, dbParams?: Partial<LoginPayload>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = () => {
      const token = getAccessToken();
      if (!token && pathname !== "/") {
        useAuthStore.getState().setSessionExpired(true);
      }
    };

    const token = getAccessToken();
    if (token) {
      setAccessToken(token);
      useAuthStore.getState().startExpiryTimer(token);
      const decoded = parseJwt(token);
      if (decoded) {
        setUser({
          empId: decoded.sub || decoded.nameid,
          userName: decoded.unique_name || decoded.name,
          role: decoded.role,
          allowedModules: decoded.AllowedModules
            ? decoded.AllowedModules.split(',').map((m: string) => m.trim())
            : []
        });
      }

      if (pathname === "/") {
        router.push("/dashboard");
      }
    } else {
      if (pathname !== "/") {
        router.push("/");
      }
    }

    // Periodic presence check for "real-time" responsiveness for Cookies
    const interval = setInterval(checkToken, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [pathname, router]);

  const login = async (userName: string, password: string, dbParams?: Partial<LoginPayload>) => {
    try {
      const data = await apiLogin({
        userName,
        password,
        ...dbParams
      });
      const decoded = parseJwt(data.accessToken);
      const userWithModules = {
        ...data.user,
        allowedModules: decoded?.AllowedModules
          ? decoded.AllowedModules.split(',').map((m: string) => m.trim())
          : []
      };

      setUser(userWithModules);
      setAccessToken(data.accessToken);
      useAuthStore.getState().startExpiryTimer(data.accessToken);
      saveTokens(data.accessToken, data.refreshToken);
      router.push("/dashboard");
    } catch (error: any) {
      throw new Error(error?.response?.data?.detail || error?.response?.data?.message || "Login failed");
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    clearTokens();
    useAuthStore.getState().resetSession();
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { login as apiLogin, saveTokens, clearTokens, getAccessToken, LoginPayload } from "../api+/sap/auth/authService";

interface User {
  empId: string;
  userName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (userName: string, password: string, dbParams?: Partial<LoginPayload>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setAccessToken(token);
      // Only redirect to dashboard if currently on the login page or root
      if (pathname === "/") {
        router.push("/dashboard");
      }
    } else {
      // Only redirect to login if not already there
      if (pathname !== "/") {
        router.push("/");
      }
    }
  }, [pathname]); // Depend on pathname to handle navigation

  const login = async (userName: string, password: string, dbParams?: Partial<LoginPayload>) => {
    try {
      const data = await apiLogin({
        userName,
        password,
        ...dbParams,
        CompanyDB: dbParams?.dbName || dbParams?.CompanyDB,
        BaseUrl: dbParams?.BaseUrl,
        SqlConnection: dbParams?.SqlConnection
      });
      setUser(data.user);
      setAccessToken(data.accessToken);
      saveTokens(data.accessToken, data.refreshToken);
      router.push("/dashboard");
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Login failed");
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    clearTokens();
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

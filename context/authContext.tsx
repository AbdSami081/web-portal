"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, saveTokens, clearTokens, getAccessToken } from "../api+/sap/auth/authService";

interface User {
  empId: string;
  userName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (token) 
    {
      setAccessToken(token);
      router.push("/dashboard") 
    }
    else router.push("/"); 
  }, []);

  const login = async (userName: string, password: string) => {
    try {
      const data = await apiLogin({ userName, password });
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

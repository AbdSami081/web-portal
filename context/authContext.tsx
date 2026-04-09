"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { login as apiLogin, saveTokens, clearTokens, getAccessToken, LoginPayload } from "../api+/sap/auth/authService";
import { getUserAccess } from "../api+/sap/authorization/authorizationService";
import { useAuthStore } from "@/stores/useAuthStore";

interface User {
  empId: string;
  userName: string;
  role: string;
  allowedModules?: string[];
  isSuperAdmin: boolean;
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
        // Fetch permissions from DB instead of JWT
        const companyDB = decoded.CompanyDB || decoded.companyDB; // Assuming companyDB is in token or we can get from store
        
        getUserAccess(decoded.sub || decoded.nameid, companyDB || "SBODemoAU")
          .then(access => {
            const allowed = access.flatMap(a => a.componentId ? [a.moduleId, a.componentId] : [a.moduleId]);
            let uniqueAllowed = Array.from(new Set(allowed)).map(id => id.toLowerCase());
            
            const isSuperAdmin = decoded.isSuperAdmin === "True" || decoded.issuperadmin === "True" || decoded.isSuperAdmin === true;

            setUser({
              empId: decoded.sub || decoded.nameid,
              userName: decoded.unique_name || decoded.name,
              role: role || (isAdmin ? "Admin" : "User"),
              allowedModules: uniqueAllowed,
              isSuperAdmin: isSuperAdmin
            });
          })
          .catch(err => {
            console.error("Failed to load permissions from DB", err);
            // Fallback to JWT if DB fails or just empty
            setUser({
              empId: decoded.sub || decoded.nameid,
              userName: decoded.unique_name || decoded.name,
              role: decoded.role,
              allowedModules: [],
              isSuperAdmin: false
            });
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
      const companyDB = decoded?.CompanyDB || decoded?.companyDB || (dbParams?.companyDB);
      const access = await getUserAccess(data.user.empId, companyDB || "SBODemoAU");
      const allowed = access.flatMap(a => a.componentId ? [a.moduleId, a.componentId] : [a.moduleId]);
      let uniqueAllowed = Array.from(new Set(allowed)).map(id => id.toLowerCase());

      const isSuperAdmin = decoded.isSuperAdmin === "True" || decoded.issuperadmin === "True" || decoded.isSuperAdmin === true;

      const userWithModules = {
        ...data.user,
        role: data.user.role,
        allowedModules: uniqueAllowed,
        isSuperAdmin: isSuperAdmin
      };

      setUser(userWithModules);
      setAccessToken(data.accessToken);
      useAuthStore.getState().startExpiryTimer(data.accessToken);
      saveTokens(data.accessToken, data.refreshToken);
      router.push("/dashboard");
    } catch (error: any) {
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error("Server is currently unreachable. Please ensure the API server is running.");
      }
      throw new Error(error?.response?.data?.detail || error?.response?.data?.message || "Login failed due to an unknown error.");
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

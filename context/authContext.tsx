"use client";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { login as apiLogin, saveTokens, clearTokens, getAccessToken, LoginPayload } from "../api+/sap/auth/authService";
import { getUserAccess, UserAccessEntry } from "../api+/sap/authorization/authorizationService";
import { useAuthStore } from "@/stores/useAuthStore";
import { clearPermissionsCache } from "@/lib/api/permissionsCache";
import { clearApiResponseCache } from "@/lib/apiClient";

interface User {
  empId: string;
  userName: string;
  role: string;
  allowedModules?: string[];
  isSuperAdmin: boolean;
  companyDB: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isPermissionsLoading: boolean;
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

const buildUser = (
  decoded: Record<string, any>,
  access: UserAccessEntry[] | null,
  companyDB: string,
  overrides?: Partial<User>
): User => {
  const allowedModulesClaim = decoded.AllowedModules || decoded.allowedModules || "";
  const tokenModules = allowedModulesClaim
    .split(',')
    .map((id: string) => id.trim().toLowerCase())
    .filter((id: string) => id !== "");

  let uniqueAllowed = tokenModules;
  if (access) {
    const dbAllowed = access.flatMap((a) => (a.componentId ? [a.moduleId, a.componentId] : [a.moduleId]));
    uniqueAllowed = Array.from(new Set([...dbAllowed, ...tokenModules])).map((id) => id.toLowerCase());
  }

  const role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  const isAdmin = role?.toLowerCase() === "admin";
  const isSuperAdmin =
    decoded.isSuperAdmin === "True" ||
    decoded.issuperadmin === "True" ||
    decoded.isSuperAdmin === true;

  return {
    empId: overrides?.empId || decoded.sub || decoded.nameid,
    userName: overrides?.userName || decoded.unique_name || decoded.name || "",
    role: overrides?.role || role || (isAdmin ? "Admin" : "User"),
    allowedModules: uniqueAllowed,
    isSuperAdmin: overrides?.isSuperAdmin ?? isSuperAdmin,
    companyDB: companyDB || "SBODemoAU",
  };
};

const refreshPermissions = async (
  decoded: Record<string, any>,
  empId: string,
  companyDB: string,
  overrides: Partial<User> | undefined,
  onUpdate: (user: User) => void,
  onLoadingChange: (loading: boolean) => void
) => {
  onLoadingChange(true);
  try {
    const access = await getUserAccess(empId, companyDB);
    onUpdate(buildUser(decoded, access, companyDB, overrides));
  } catch (err) {
    console.error("Failed to load permissions from DB", err);
    onUpdate(buildUser(decoded, null, companyDB, overrides));
  } finally {
    onLoadingChange(false);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
  const bootstrappedRef = useRef(false);
  const loginInProgressRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const token = getAccessToken();
    if (!token) return;

    const decoded = parseJwt(token);
    if (!decoded) return;

    const companyDB = decoded.CompanyDB || decoded.companyDB || "SBODemoAU";
    const empId = decoded.sub || decoded.nameid;

    setAccessToken(token);
    useAuthStore.getState().startExpiryTimer(token);
    setUser(buildUser(decoded, null, companyDB));

    void refreshPermissions(
      decoded,
      empId,
      companyDB,
      undefined,
      setUser,
      setIsPermissionsLoading
    );
  }, []);

  useEffect(() => {
    const token = getAccessToken();

    if (token && pathname === "/") {
      router.push("/dashboard");
    } else if (!token && pathname !== "/") {
      router.push("/");
    }

    const checkToken = () => {
      const currentToken = getAccessToken();
      if (!currentToken && pathname !== "/") {
        useAuthStore.getState().setSessionExpired(true);
      }
    };

    const interval = setInterval(checkToken, 5000);
    return () => clearInterval(interval);
  }, [pathname, router]);

  const login = async (userName: string, password: string, dbParams?: Partial<LoginPayload>) => {
    if (loginInProgressRef.current) return;
    loginInProgressRef.current = true;

    try {
      const data = await apiLogin({
        userName,
        password,
        ...dbParams
      });

      if (!data.accessToken) {
        throw new Error("Invalid login response from server.");
      }

      const decoded = parseJwt(data.accessToken);
      if (!decoded) {
        throw new Error("Invalid authentication token received from server.");
      }

      const companyDB = decoded.CompanyDB || decoded.companyDB || dbParams?.companyDB || "SBODemoAU";
      const empId = data.user.empId || String(decoded.sub || decoded.nameid || "");
      const overrides = {
        empId,
        userName: data.user.userName,
        role: data.user.role,
      };

      saveTokens(data.accessToken, data.refreshToken);
      setAccessToken(data.accessToken);
      useAuthStore.getState().startExpiryTimer(data.accessToken);

      const immediateUser = buildUser(decoded, null, companyDB, overrides);
      setUser(immediateUser);
      router.push("/dashboard");

      void refreshPermissions(
        decoded,
        empId,
        companyDB,
        overrides,
        setUser,
        setIsPermissionsLoading
      );
    } catch (error: any) {
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error("Server is currently unreachable. Please ensure the API server is running.");
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error("Login request timed out. Please try again.");
      }
      throw new Error(
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Login failed due to an unknown error."
      );
    } finally {
      loginInProgressRef.current = false;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setIsPermissionsLoading(false);
    clearTokens();
    clearPermissionsCache();
    clearApiResponseCache();
    useAuthStore.getState().resetSession();
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isPermissionsLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

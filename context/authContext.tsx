"use client";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { login as apiLogin, saveTokens, clearTokens, getAccessToken, LoginPayload } from "../api+/sap/auth/authService";
import { getUserAccess, UserAccessEntry } from "../api+/sap/authorization/authorizationService";
import { useAuthStore } from "@/stores/useAuthStore";
import { clearPermissionsCache } from "@/lib/api/permissionsCache";
import { clearApiResponseCache } from "@/lib/apiClient";
import { useBranchStore } from "@/stores/useBranchStore";
import { getBranches, getMyBranches } from "@/api+/sap/branch";
import { toast } from "sonner";

interface User {
  empId: string;
  sapUserId?: number;
  userName: string;
  fullName?: string;
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
    uniqueAllowed = dbAllowed.map((id) => id.toLowerCase());
  }

  const role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  const isAdmin = role?.toLowerCase() === "admin";
  const isSuperAdmin =
    decoded.isSuperAdmin === "True" ||
    decoded.issuperadmin === "True" ||
    decoded.isSuperAdmin === true;

  const rawSapUserId = overrides?.sapUserId ?? decoded.SapUserId ?? decoded.sapUserId ?? decoded.SAPUserId ?? decoded.userId;
  const sapUserId = rawSapUserId !== undefined && rawSapUserId !== null ? Number(rawSapUserId) : undefined;

  const userName = overrides?.userName || decoded.UserName || decoded.userName || decoded.unique_name || decoded.name || "";
  const fullName = overrides?.fullName || decoded.FullName || decoded.fullName || decoded.unique_name || decoded.name || userName;

  return {
    empId: overrides?.empId || decoded.sub || decoded.nameid,
    sapUserId,
    userName,
    fullName,
    role: overrides?.role || role || (isAdmin ? "Admin" : "User"),
    allowedModules: uniqueAllowed,
    isSuperAdmin: overrides?.isSuperAdmin ?? isSuperAdmin,
    companyDB: companyDB || "SBODemoAU",
  };
};

const initializeBranchSession = async (force = false) => {
  const branchStore = useBranchStore.getState();
  // Whether to (re-)decide the popup is gated per session; refreshing branch data itself
  // is not — otherwise anything added to the branch store later (like name lookups for
  // line items) would stay empty forever for a tab whose sessionStorage predates it.
  const shouldDecidePopup = force || (branchStore.sessionDefaultBranch === null && !branchStore.needsBranchSelection);

  try {
    const [allBranches, myBranches] = await Promise.all([
      getBranches(),
      getMyBranches(),
    ]);

    const assignedIds = new Set(myBranches.branches.map((b) => b.BPLID));
    const assigned = allBranches.filter((b) => assignedIds.has(b.BPLID));

    branchStore.setAllBranches(allBranches);
    branchStore.setAssignedBranches(assigned);
    branchStore.setSuggestedDefaultBranch(myBranches.defaultBranch);

    if (!shouldDecidePopup) return;

    if (assigned.length === 0) {
      toast.error("You are not assigned any branch.");
      return;
    }

    branchStore.setNeedsBranchSelection(true);
  } catch (err) {
    console.error("Failed to initialize branch session", err);
  }
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

    const savedSapUserId = typeof window !== "undefined" ? localStorage.getItem("sapUserId") : null;
    const initialOverrides = savedSapUserId ? { sapUserId: Number(savedSapUserId) } : undefined;

    setAccessToken(token);
    useAuthStore.getState().startExpiryTimer(token);
    setUser(buildUser(decoded, null, companyDB, initialOverrides));

    void refreshPermissions(
      decoded,
      empId,
      companyDB,
      initialOverrides,
      setUser,
      setIsPermissionsLoading
    );
    void initializeBranchSession();
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

      if (data.user.sapUserId !== undefined && data.user.sapUserId !== null) {
        localStorage.setItem("sapUserId", String(data.user.sapUserId));
      }

      const overrides = {
        empId,
        sapUserId: data.user.sapUserId,
        userName: data.user.userName,
        fullName: data.user.fullName || data.user.userName,
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
      useBranchStore.getState().clearBranch();
      void initializeBranchSession(true);
    } catch (error: any) {
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error("Server is currently unreachable. Please ensure the API server is running.");
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error("Login request timed out. Please try again.");
      }

      const responseData = error?.response?.data;
      const serverMessage =
        typeof responseData === "string" && responseData.trim()
          ? responseData
          : responseData?.detail || responseData?.message || responseData?.error;

      throw new Error(
        serverMessage || error?.message || "Login failed due to an unknown error."
      );
    } finally {
      loginInProgressRef.current = false;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setIsPermissionsLoading(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("sapUserId");
    }
    clearTokens();
    clearPermissionsCache();
    clearApiResponseCache();
    useAuthStore.getState().resetSession();
    useBranchStore.getState().clearBranch();
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

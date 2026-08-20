import axios from "axios";

export interface LoginPayload {
  userName: string;
  password: string;
  companyDB?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    empId: string;
    sapUserId?: number;
    userName: string;
    fullName?: string;
    role: string;
  };
}

const resolveAuthUrl = () => {
  const useProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === "true";
  if (typeof window !== "undefined") {
    if (!useProxy && process.env.NEXT_PUBLIC_API_URL) {
      const base = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
      return `${base}/api/Auth/login`;
    }
    return "/api/Auth/login";
  }
  return `${process.env.NEXT_PUBLIC_API_URL}api/Auth/login`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableLoginError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  return [502, 503, 504].includes(error.response.status);
};

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const AUTH_URL = resolveAuthUrl();
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await axios.post<any>(AUTH_URL, payload, { timeout: 60000 });
      const rawData = response.data;
      const rawUser = rawData.User || rawData.user || {};

      return {
        accessToken: rawData.AccessToken || rawData.accessToken,
        refreshToken: rawData.RefreshToken || rawData.refreshToken,
        user: {
          empId: String(rawUser.empId || rawUser.EmpId || rawUser.EmpID || ""),
          sapUserId: rawUser.SapUserId ?? rawUser.sapUserId ?? rawUser.SAPUserId ?? undefined,
          userName: rawUser.userName || rawUser.UserName || "",
          fullName: rawUser.fullName || rawUser.FullName || rawUser.userName || rawUser.UserName || "",
          role: rawUser.role || rawUser.Role || "",
        },
      };
    } catch (error) {
      lastError = error;
      if (attempt === 2 || !isRetryableLoginError(error)) {
        throw error;
      }
      await sleep(600);
    }
  }

  throw lastError;
};

export const saveTokens = (accessToken: string, refreshToken: string) => {
  document.cookie = `accessToken=${accessToken}; path=/; samesite=lax`;
  document.cookie = `refreshToken=${refreshToken}; path=/; samesite=lax`;
};

export const clearTokens = () => {
  document.cookie = "accessToken=; path=/; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  document.cookie = "refreshToken=; path=/; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  localStorage.clear();
};

export const getAccessToken = () => {
  const name = "accessToken=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
};

export const getRefreshToken = () => {
  const name = "refreshToken=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
};

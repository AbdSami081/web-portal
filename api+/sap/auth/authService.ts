import { API_URL } from "@/types/config";
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
    userName: string;
    role: string;
  };
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_URL}api/Auth/login`, payload);
  return response.data;
};

export const saveTokens = (accessToken: string, refreshToken: string) => {
  // Store in cookies with basic security attributes
  document.cookie = `accessToken=${accessToken}; path=/; samesite=lax`;
  document.cookie = `refreshToken=${refreshToken}; path=/; samesite=lax`;
};

export const clearTokens = () => {
  document.cookie = "accessToken=; path=/; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  document.cookie = "refreshToken=; path=/; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  localStorage.clear(); // Removing everything from LocalStorage as requested
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

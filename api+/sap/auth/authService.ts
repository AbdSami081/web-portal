import { LOGIN_URL } from "@/types/config";
import axios from "axios";

export interface LoginPayload {
  userName: string;
  password: string;
  serverName?: string;
  dbName?: string;
  dbPassword?: string;
  dbUserId?: string;
  CompanyDB?: string;
  BaseUrl?: string;
  SqlConnection?: string;
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
  const response = await axios.post<LoginResponse>(`${LOGIN_URL}api/Auth/login`, payload);
  return response.data;
};

export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const getAccessToken = () => localStorage.getItem("accessToken");
export const getRefreshToken = () => localStorage.getItem("refreshToken");

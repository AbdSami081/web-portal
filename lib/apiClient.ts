import axios from "axios";
import { API_URL } from "@/types/config";
import { getAccessToken } from "@/api+/sap/auth/authService";
import { useAuthStore } from "@/stores/useAuthStore";

const apiClient = axios.create({
    baseURL: API_URL,
});

apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            // Network error (server down, CORS, etc.)
            typeof window !== "undefined" && import("sonner").then((mod) => mod.toast.error("Cannot reach the server. Please check your connection or ensure the API is running."));
        }
        else if (error.response.status === 401) {
            // Trigger session expired modal
            useAuthStore.getState().setSessionExpired(true);
        }
        return Promise.reject(error);
    }
);

export default apiClient;

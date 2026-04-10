import axios from "axios";
import { getAccessToken } from "@/api+/sap/auth/authService";
import { useAuthStore } from "@/stores/useAuthStore";
import { getSapErrorMessage } from "@/lib/errorHelper";

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const reportingApiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_ReportingApi_URL,
});

const requestInterceptor = (config: any) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

const responseInterceptor = (response: any) => response;

const errorInterceptor = (error: any) => {
    if (axios.isAxiosError(error)) {
        // Log detailed diagnostics for developers
        if (error.response) {
            console.error('API Error Response:', {
                status: error.response.status,
                data: error.response.data,
                url: error.config?.url
            });

            if (error.response.status === 401) {
                // Trigger session expired modal
                useAuthStore.getState().setSessionExpired(true);
            }
        }
        else if (error.request) {
            console.error('API Network Error:', {
                message: error.message,
                code: error.code,
                url: error.config?.url
            });
            typeof window !== "undefined" && import("sonner").then((mod) => mod.toast.error("Cannot reach the server. Please check your connection."));
        }
        else {
            console.error('API Setup Error:', error.message);
        }

        // Transform message for the UI
        error.message = getSapErrorMessage(error);
    } else {
        console.error('Non-Axios Error:', error);
    }
    return Promise.reject(error);
};

// Apply interceptors to both clients
apiClient.interceptors.request.use(requestInterceptor, (err) => Promise.reject(err));
apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

reportingApiClient.interceptors.request.use(requestInterceptor, (err) => Promise.reject(err));
reportingApiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

export default apiClient;
export { reportingApiClient };

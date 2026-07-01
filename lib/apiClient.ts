import axios from "axios";
import { getAccessToken } from "@/api+/sap/auth/authService";
import { useAuthStore } from "@/stores/useAuthStore";
import { getSapErrorMessage } from "@/lib/errorHelper";

const resolveApiBaseUrl = () => {
    if (typeof window !== "undefined") {
        return "/";
    }
    const url = process.env.NEXT_PUBLIC_API_URL ?? "";
    return url.endsWith("/") ? url : `${url}/`;
};

const resolveReportingApiBaseUrl = () => {
    // Browser: same-origin proxy via next.config rewrites (/reporting/* -> reporting server)
    if (typeof window !== "undefined") {
        return "/reporting/";
    }
    const url = process.env.NEXT_PUBLIC_ReportingApi_URL ?? "";
    return url.endsWith("/") ? url : `${url}/`;
};

const apiClient = axios.create({
    baseURL: resolveApiBaseUrl(),
});

const reportingApiClient = axios.create({
    baseURL: resolveReportingApiBaseUrl(),
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
        if (error.response) {
            if (error.response.status !== 404) {
                console.error('API Error Response:', {
                    status: error.response.status,
                    data: error.response.data,
                    url: error.config?.url
                });
            }

            if (error.response.status === 401) {
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

        error.message = getSapErrorMessage(error);
    } else {
        console.error('Non-Axios Error:', error);
    }
    return Promise.reject(error);
};

apiClient.interceptors.request.use(requestInterceptor, (err) => Promise.reject(err));
apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

reportingApiClient.interceptors.request.use(requestInterceptor, (err) => Promise.reject(err));
reportingApiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

export default apiClient;
export { reportingApiClient };

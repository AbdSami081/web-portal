import axios from "axios";
import { getAccessToken } from "@/api+/sap/auth/authService";
import { useAuthStore } from "@/stores/useAuthStore";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { dedupeRequest } from "@/lib/api/requestDedupe";

const useApiProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === "true";

const resolveApiBaseUrl = () => {
    if (typeof window !== "undefined") {
        if (!useApiProxy) {
            const directUrl = process.env.NEXT_PUBLIC_API_URL;
            if (directUrl) {
                return directUrl.endsWith("/") ? directUrl : `${directUrl}/`;
            }
        }
        return "/";
    }
    const url = process.env.NEXT_PUBLIC_API_URL ?? "";
    return url.endsWith("/") ? url : `${url}/`;
};

const resolveReportingApiBaseUrl = () => {
    if (typeof window !== "undefined") {
        if (!useApiProxy) {
            const directUrl = process.env.NEXT_PUBLIC_ReportingApi_URL;
            if (directUrl) {
                return directUrl.endsWith("/") ? directUrl : `${directUrl}/`;
            }
        }
        return "/reporting/";
    }
    const url = process.env.NEXT_PUBLIC_ReportingApi_URL ?? "";
    return url.endsWith("/") ? url : `${url}/`;
};

const API_TIMEOUT_MS = 30000;
const GET_TIMEOUT_MS = 15000;
const RESPONSE_CACHE_TTL_MS = 30_000;

const responseCache = new Map<string, { data: unknown; expiresAt: number }>();

const apiClient = axios.create({
    baseURL: resolveApiBaseUrl(),
    timeout: API_TIMEOUT_MS,
});

const reportingApiClient = axios.create({
    baseURL: resolveReportingApiBaseUrl(),
    timeout: API_TIMEOUT_MS,
});

const requestInterceptor = (config: any) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const method = (config.method || "get").toLowerCase();
    if (method === "get" && !config.timeout) {
        config.timeout = GET_TIMEOUT_MS;
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
                const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/";
                if (!isLoginPage) {
                    useAuthStore.getState().setSessionExpired(true);
                }
            }
        }
        else if (error.request) {
            console.error('API Network Error:', {
                message: error.message,
                code: error.code,
                url: error.config?.url
            });
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

export async function cachedGet<T>(
    url: string,
    config?: Parameters<typeof apiClient.get>[1]
): Promise<T> {
    const params = config?.params ? JSON.stringify(config.params) : "";
    const key = `GET:${url}:${params}`;

    const cached = responseCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.data as T;
    }

    return dedupeRequest(key, async () => {
        const response = await apiClient.get<T>(url, config);
        responseCache.set(key, {
            data: response.data,
            expiresAt: Date.now() + RESPONSE_CACHE_TTL_MS,
        });
        return response.data;
    });
}

export function clearApiResponseCache() {
    responseCache.clear();
}

export default apiClient;
export { reportingApiClient };

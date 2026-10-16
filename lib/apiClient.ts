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

// Transparent retry for GET requests that fail because of a transient network
// blip or server-side hiccup (timeout, dropped connection, 502/503/504) —
// same reasoning as the manual retry added to the Authorization page's user/
// module loads, generalized so every GET across the app gets it automatically
// instead of needing to be hand-rolled per screen. Only GET is retried: a
// failed POST/PUT/DELETE/PATCH might have actually succeeded server-side
// before the response was lost, so blindly retrying those could double-submit
// a document or double-save a change — not safe to automate.
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 600;

const isRetryableError = (error: any) => {
    const method = (error.config?.method || "get").toLowerCase();
    if (method !== "get") return false;

    if (!error.response) return true; // network error, timeout, connection dropped
    return error.response.status >= 500; // transient server-side failure
};

const createRetryInterceptor = (client: typeof apiClient) => async (error: any) => {
    const config = error.config;
    if (!config || !isRetryableError(error)) {
        return Promise.reject(error);
    }

    const retryCount = (config.__retryCount || 0) + 1;
    if (retryCount > RETRY_ATTEMPTS) {
        return Promise.reject(error);
    }

    config.__retryCount = retryCount;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * retryCount));
    return client(config);
};

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
apiClient.interceptors.response.use(responseInterceptor, createRetryInterceptor(apiClient));
apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

reportingApiClient.interceptors.request.use(requestInterceptor, (err) => Promise.reject(err));
reportingApiClient.interceptors.response.use(responseInterceptor, createRetryInterceptor(reportingApiClient));
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
        const isEmptyArray = Array.isArray(response.data) && response.data.length === 0;
        if (!isEmptyArray) {
            responseCache.set(key, {
                data: response.data,
                expiresAt: Date.now() + RESPONSE_CACHE_TTL_MS,
            });
        }
        return response.data;
    });
}

export function clearApiResponseCache() {
    responseCache.clear();
}

export default apiClient;
export { reportingApiClient };

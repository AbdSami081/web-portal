import { create } from "zustand";
import { getAccessToken } from "@/api+/sap/auth/authService";

interface AuthStore {
    isSessionExpired: boolean;
    expiryTime: number | null;
    allowMultiBom: boolean;
    setSessionExpired: (expired: boolean) => void;
    resetSession: () => void;
    setExpiryTime: (time: number) => void;
    startExpiryTimer: (token: string) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => {
    let timer: NodeJS.Timeout | null = null;

    const parseJwt = (token: string) => {
        try {
            if (!token) return null;
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

    return {
        isSessionExpired: false,
        expiryTime: null,
        allowMultiBom: false,
        setSessionExpired: (expired) => set({ isSessionExpired: expired }),
        resetSession: () => {
            if (timer) clearTimeout(timer);
            set({ isSessionExpired: false, expiryTime: null });
        },
        setExpiryTime: (time) => set({ expiryTime: time }),
        startExpiryTimer: (token: string) => {
            if (timer) clearTimeout(timer);

            const decoded = parseJwt(token);
            if (!decoded || !decoded.exp) return;

            const exp = decoded.exp * 1000; // Convert to ms
            const now = Date.now();
            const delay = exp - now;

            // Parse AllowMultiBom from token claims
            const allowMultiBom = decoded["AllowMultiBom"] === "True" || decoded["AllowMultiBom"] === "true";

            set({ expiryTime: exp, isSessionExpired: false, allowMultiBom });

            if (delay > 0) {
                timer = setTimeout(() => {
                    set({ isSessionExpired: true });
                }, delay);
            } else {
                set({ isSessionExpired: true });
            }
        },
    };
});

/** Read AllowMultiBom directly from the current token (for use outside React components) */
export const getMultiBomAllowed = (): boolean => {
    const token = getAccessToken();
    if (!token) return false;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')));
        return payload["AllowMultiBom"] === "True" || payload["AllowMultiBom"] === "true";
    } catch {
        return false;
    }
};

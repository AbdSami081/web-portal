import { create } from "zustand";

interface AuthStore {
    isSessionExpired: boolean;
    expiryTime: number | null;
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

            set({ expiryTime: exp, isSessionExpired: false });

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

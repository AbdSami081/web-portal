"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { clearTokens } from "@/api+/sap/auth/authService";
import { useRouter, usePathname } from "next/navigation";

/**
 * Watches for session expiration and automatically redirects to login
 * after clearing local security tokens.
 */
export function SessionWatcher() {
    const { isSessionExpired, resetSession } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only redirect if session is expired and we are not already on the login page
        if (isSessionExpired && pathname !== "/") {
            console.log("[SESSION] Expired. Clearing tokens and redirecting to login...");
            
            // 1. Clear security tokens from cookies and local storage
            clearTokens();
            
            // 2. Reset the store state
            resetSession();
            
            // 3. Redirect to login
            router.push("/");
        }
    }, [isSessionExpired, pathname, router, resetSession]);

    return null;
}

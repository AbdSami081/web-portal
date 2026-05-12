"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { clearTokens } from "@/api+/sap/auth/authService";
import { useRouter, usePathname } from "next/navigation";

export function SessionWatcher() {
    const { isSessionExpired, resetSession } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isSessionExpired && pathname !== "/") {
            console.log("[SESSION] Expired. Clearing tokens and redirecting to login...");
            
            clearTokens();
            
            resetSession();
            
            router.push("/");
        }
    }, [isSessionExpired, pathname, router, resetSession]);

    return null;
}

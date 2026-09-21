"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRelationshipMapStore } from "@/stores/useRelationshipMapStore";

export function RelationshipMapRouteWatcher() {
  const pathname = usePathname();

  useEffect(() => {
    useRelationshipMapStore.getState().closeMap();
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("portalDocNav.active");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.pathname !== pathname) {
            sessionStorage.removeItem("portalDocNav.active");
          }
        }
      } catch {
        /* ignore */
      }
    }
  }, [pathname]);

  return null;
}

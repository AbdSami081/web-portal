"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRelationshipMapStore } from "@/stores/useRelationshipMapStore";

export function RelationshipMapRouteWatcher() {
  const pathname = usePathname();

  useEffect(() => {
    useRelationshipMapStore.getState().closeMap();
  }, [pathname]);

  return null;
}

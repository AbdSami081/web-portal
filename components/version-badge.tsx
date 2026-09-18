"use client";

import { useEffect } from "react";
import { usePublicConfigStore } from "@/stores/usePublicConfigStore";

interface VersionBadgeProps {
  className?: string;
}

export function VersionBadge({ className }: VersionBadgeProps) {
  const version = usePublicConfigStore((state) => state.version);
  const load = usePublicConfigStore((state) => state.load);

  useEffect(() => {
    load();
  }, [load]);

  if (!version) return null;

  return <span className={className}>v{version}</span>;
}

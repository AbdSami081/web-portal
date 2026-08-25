"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const PENDING_KEY = "portalDocNav.pending";
const ACTIVE_KEY = "portalDocNav.active";

export interface DocNavParams {
  draftEntry?: string;
  docEntry?: string;
  docType?: string;
  draft?: string;
  approvalStatus?: string;
  approvalRequestCode?: string;
}

const KEYS: (keyof DocNavParams)[] = [
  "draftEntry",
  "docEntry",
  "docType",
  "draft",
  "approvalStatus",
  "approvalRequestCode",
];

interface StoredNav {
  params: DocNavParams;
  pathname: string;
}

export const stageDocNavParams = (pathname: string, params: DocNavParams) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ params, pathname } satisfies StoredNav));
  } catch {
  }
};

const readStored = (key: string): StoredNav | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredNav) : null;
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: StoredNav | null) => {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      sessionStorage.setItem(key, JSON.stringify(value));
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
};

export const resolveDocNavParams = (
  searchParams: URLSearchParams,
  pathname: string
): DocNavParams => {
  const fromUrl: DocNavParams = {};
  for (const key of KEYS) {
    const value = searchParams.get(key);
    if (value) fromUrl[key] = value;
  }

  const pending = readStored(PENDING_KEY);
  const active = readStored(ACTIVE_KEY);

  if (pending && pending.pathname === pathname) {
    writeStored(ACTIVE_KEY, pending);
    writeStored(PENDING_KEY, null);
    return { ...pending.params, ...fromUrl };
  }

  if (active && active.pathname === pathname) {
    return { ...active.params, ...fromUrl };
  }

  return fromUrl;
};

export function useDocNavParams(): DocNavParams {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  return useMemo(() => resolveDocNavParams(searchParams, pathname), [searchParams, pathname]);
}

export const clearDocNavParams = (
  router?: { replace: (href: string) => void },
  pathname?: string | null
) => {
  writeStored(PENDING_KEY, null);
  writeStored(ACTIVE_KEY, null);

  if (router && pathname && typeof window !== "undefined" && window.location.search) {
    router.replace(pathname);
  }
};

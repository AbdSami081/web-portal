"use client";

import { usePathname, useSearchParams } from "next/navigation";

const PENDING_KEY = "portalDocNav.pending";
const ACTIVE_KEY = "portalDocNav.active";

export interface DocNavParams {
  draftEntry?: string;
  docEntry?: string;
  docType?: string;
  draft?: string;
  approvalStatus?: string;
  approvalRequestCode?: string;
  approvalRole?: string;
  approvalReadOnly?: string;
}

const KEYS: (keyof DocNavParams)[] = [
  "draftEntry",
  "docEntry",
  "docType",
  "draft",
  "approvalStatus",
  "approvalRequestCode",
  "approvalRole",
  "approvalReadOnly",
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

const readFromUrl = (searchParams: URLSearchParams): DocNavParams => {
  const fromUrl: DocNavParams = {};
  for (const key of KEYS) {
    const value = searchParams.get(key);
    if (value) fromUrl[key] = value;
  }

  if (Object.keys(fromUrl).length > 0) return fromUrl;

  if (typeof window !== "undefined" && window.location.search) {
    const live = new URLSearchParams(window.location.search);
    for (const key of KEYS) {
      const value = live.get(key);
      if (value) fromUrl[key] = value;
    }
  }

  return fromUrl;
};

const matchesPathname = (stored: string, pathname: string): boolean => {
  if (stored === pathname) return true;
  if (typeof window !== "undefined" && stored === window.location.pathname) return true;
  return false;
};

export const resolveDocNavParams = (
  searchParams: URLSearchParams,
  pathname: string
): DocNavParams => {
  const fromUrl = readFromUrl(searchParams);

  const pending = readStored(PENDING_KEY);
  let active = readStored(ACTIVE_KEY);

  if (active && !matchesPathname(active.pathname, pathname)) {
    writeStored(ACTIVE_KEY, null);
    active = null;
  }

  if (pending && matchesPathname(pending.pathname, pathname)) {
    writeStored(ACTIVE_KEY, pending);
    writeStored(PENDING_KEY, null);
    return { ...pending.params, ...fromUrl };
  }

  if (active && matchesPathname(active.pathname, pathname)) {
    return { ...active.params, ...fromUrl };
  }

  return fromUrl;
};

export const readDocNavFromBrowser = (): DocNavParams => {
  if (typeof window === "undefined") return {};
  return resolveDocNavParams(
    new URLSearchParams(window.location.search),
    window.location.pathname
  );
};

export function useDocNavParams(): DocNavParams {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  return resolveDocNavParams(searchParams, pathname);
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

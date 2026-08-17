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

/**
 * Called by the messages page BEFORE navigating to a document. The params are kept
 * in sessionStorage (so the browser URL stays clean) and are re-joined on the target
 * page by `resolveDocNavParams`. sessionStorage survives a page refresh but is scoped
 * to the tab, so the params are never shared across users/tabs.
 */
export const stageDocNavParams = (pathname: string, params: DocNavParams) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ params, pathname } satisfies StoredNav));
  } catch {
    /* storage unavailable - the page will simply fall back to no params */
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

/**
 * Resolves document-navigation params for the current page, in priority order:
 * 1. URL query params (backward compatible with direct/deep links).
 * 2. Params staged by the messages page for THIS pathname (consumed once -> "active").
 * 3. The last consumed params for THIS pathname (so a refresh keeps working).
 *
 * Staged params are moved to "active" exactly once, so stale values never leak into
 * unrelated pages (pathname must match).
 */
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

/** Hook for components: resolves the hidden/URL document nav params for the current route. */
export function useDocNavParams(): DocNavParams {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  return useMemo(() => resolveDocNavParams(searchParams, pathname), [searchParams, pathname]);
}

import { UserAccessEntry } from "@/api+/sap/authorization/authorizationService";

const CACHE_PREFIX = "wp_user_access_";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedPermissions {
  data: UserAccessEntry[];
  expiresAt: number;
}

export function getCachedPermissions(empId: string, companyDB: string): UserAccessEntry[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${empId}:${companyDB}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedPermissions;
    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${empId}:${companyDB}`);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function setCachedPermissions(empId: string, companyDB: string, data: UserAccessEntry[]) {
  if (typeof window === "undefined") return;

  try {
    const payload: CachedPermissions = {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    sessionStorage.setItem(`${CACHE_PREFIX}${empId}:${companyDB}`, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearPermissionsCache() {
  if (typeof window === "undefined") return;

  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  });
}

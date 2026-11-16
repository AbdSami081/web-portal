const CACHE_PREFIX = "wp-field-access:";

function cacheKey(userCode: string, docType: string) {
  return `${CACHE_PREFIX}${userCode.trim().toLowerCase()}:${docType.trim()}`;
}

export function readFieldProp(row: unknown, ...names: string[]): unknown {
  if (!row || typeof row !== "object") return undefined;
  const record = row as Record<string, unknown>;
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(record, name)) return record[name];
  }
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  for (const [key, value] of Object.entries(record)) {
    if (wanted.has(key.toLowerCase())) return value;
  }
  return undefined;
}

export function isFieldAllowed(row: unknown): boolean {
  const allowed = readFieldProp(row, "Enabled", "U_IsAllowed", "IsAllowed");
  return allowed === true || String(allowed ?? "N").trim().toUpperCase() === "Y";
}

export function fieldAccessKey(row: unknown): string {
  return String(readFieldProp(row, "U_FieldName", "FieldName", "U_FieldKey", "FieldKey") ?? "").trim();
}

export function allowedFieldNames(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  const names = new Set<string>();
  for (const row of rows) {
    if (!isFieldAllowed(row)) continue;
    const key = fieldAccessKey(row);
    if (key) names.add(key);
  }
  return [...names];
}

export function readFieldAccessCache(userCode: string, docType: string): string[] | undefined {
  if (typeof window === "undefined" || !userCode || !docType) return undefined;
  try {
    const raw = window.sessionStorage.getItem(cacheKey(userCode, docType));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed.filter((name): name is string => typeof name === "string" && name.trim() !== "");
  } catch {
    return undefined;
  }
}

export function writeFieldAccessCache(userCode: string, docType: string, fields: string[]) {
  if (typeof window === "undefined" || !userCode || !docType) return;
  try {
    window.sessionStorage.setItem(cacheKey(userCode, docType), JSON.stringify(fields));
  } catch {
    // The document still uses the in-memory list when storage is unavailable.
  }
}

export function clearFieldAccessCache(userCodes?: string[]) {
  if (typeof window === "undefined") return;
  const targets = userCodes?.map((code) => `${CACHE_PREFIX}${code.trim().toLowerCase()}:`);
  const keys: string[] = [];
  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;
    if (!targets || targets.some((prefix) => key.startsWith(prefix))) keys.push(key);
  }
  for (const key of keys) window.sessionStorage.removeItem(key);
}

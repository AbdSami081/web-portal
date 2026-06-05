export type UoMEntry = {
  AbsEntry: number;
  Code: string;
  Name: string;
};

/**
 * Resolves a UoM value against a list of UoM groups.
 *
 * Logic:
 * 1. If value is -1 or empty → skip
 * 2. If value is a number (AbsEntry) → look up in uoms and return Code
 * 3. If value is a string matching a Code → return it as-is
 * 4. If value is a string matching a Name → return Name
 * 5. If nothing matches → return value as-is (or "")
 */
export const resolveUoMCode = (
  value: unknown,
  uoms: UoMEntry[] = []
): string => {
  if (value === undefined || value === null) return "";

  const raw = String(value).trim();
  if (!raw || raw === "-1" || raw.toLowerCase() === "null" || raw.toLowerCase() === "undefined") {
    return "";
  }

  // Numeric: treat as AbsEntry — look up in UoM list
  const numeric = Number(raw);
  if (!isNaN(numeric) && uoms.length > 0) {
    const match = uoms.find((u) => u.AbsEntry === numeric);
    if (match) return match.Code || match.Name || "";
    return ""; // numeric but not found → don't show raw number
  }

  // String: check exact Code match first
  if (uoms.length > 0) {
    const byCode = uoms.find((u) => u.Code === raw);
    if (byCode) return byCode.Code;

    const byName = uoms.find((u) => u.Name === raw);
    if (byName) return byName.Name;
  }

  // Fallback: return raw string value
  return raw;
};

/**
 * Tries multiple candidate UoM values in order, returns the first resolved non-empty one.
 * Uses resolveUoMCode for each candidate.
 */
export const normalizeInventoryUom = (...values: unknown[]): string => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (!text || text === "-1" || text.toLowerCase() === "null" || text.toLowerCase() === "undefined") {
      continue;
    }
    return text;
  }
  return "";
};

/**
 * Resolves UoM from a list of candidate values using the UoM groups list.
 * First candidate that resolves to a non-empty value wins.
 */
export const resolveUoMFromCandidates = (
  uoms: UoMEntry[],
  ...candidates: unknown[]
): string => {
  for (const candidate of candidates) {
    const resolved = resolveUoMCode(candidate, uoms);
    if (resolved) return resolved;
  }
  return "";
};

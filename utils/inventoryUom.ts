export type UoMEntry = {
  AbsEntry: number;
  Code: string;
  Name: string;
};

export const resolveUoMCode = (
  value: unknown,
  uoms: UoMEntry[] = []
): string => {
  if (value === undefined || value === null) return "";

  const raw = String(value).trim();
  if (!raw || raw === "-1" || raw.toLowerCase() === "null" || raw.toLowerCase() === "undefined") {
    return "";
  }

  const numeric = Number(raw);
  if (!isNaN(numeric) && uoms.length > 0) {
    const match = uoms.find((u) => u.AbsEntry === numeric);
    if (match) return match.Code || match.Name || "";
    return ""; 
  }

  // String: check exact Code match first
  if (uoms.length > 0) {
    const byCode = uoms.find((u) => u.Code === raw);
    if (byCode) return byCode.Code;

    const byName = uoms.find((u) => u.Name === raw);
    if (byName) return byName.Code;  // Always return Code, not Name
  }

  return raw;
};
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

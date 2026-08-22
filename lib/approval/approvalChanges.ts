const HEADER_FIELDS = [
  "CardCode",
  "CardName",
  "Comments",
  "DocDate",
  "DocDueDate",
  "TaxDate",
  "FromWarehouse",
  "ToWarehouse",
  "JournalMemo",
  "DiscountPercent",
  "Freight",
  "Rounding",
  "RequiredDate",
  "Requester",
  "RequesterName",
];

const DATE_FIELDS = new Set([
  "DocDate",
  "DocDueDate",
  "TaxDate",
  "RequiredDate",
  "PostingDate",
  "DueDate",
]);

function normalizeDate(value: any): string {
  if (!value) return "";
  const datePart = String(value).split("T")[0];
  return datePart.trim();
}

// Header fields that are numeric. SAP Service Layer may return these as numbers or
// numeric strings, while the form/store holds JS numbers. Coercing both sides through
// `toNum` keeps the diff stable (e.g. "10" vs 10, "12,30" vs 12.3, "0" vs 0).
const NUMERIC_FIELDS = new Set([
  "DiscountPercent",
  "Freight",
  "Rounding",
  "DocTotal",
  "DiscSum",
  "TotalBeforeDiscount",
]);

// Coerces a value to a number, tolerating comma-decimal strings ("12,30") that the SAP
// Service Layer can return for some locales and the numeric JS values held by the form.
export function toNum(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const str = String(value).trim();
  if (!str) return 0;
  const lastComma = str.lastIndexOf(",");
  let normalized: string;
  if (lastComma > 0 && lastComma >= str.length - 4) {
    normalized = str.substring(0, lastComma) + "." + str.substring(lastComma + 1);
  } else {
    normalized = str.replace(/,/g, "");
  }
  const n = Number(normalized);
  return isNaN(n) ? 0 : Math.round(n * 10000) / 10000;
}

function normalizeUoM(uom: any): string {
  if (!uom) return "";
  const str = String(uom).trim();
  if (str.toLowerCase() === "manual" || str === "1" || str === "-1") return "";
  return str.toLowerCase();
}

function normalizeLine(l: any) {
  return {
    itemCode: String(l?.ItemCode || l?.ItemNo || l?.Item || "").trim().toLowerCase(),
    quantity: toNum(l?.Quantity ?? l?.PlannedQuantity ?? 0),
    warehouse: String(l?.WhsCode || l?.WarehouseCode || l?.FromWhsCode || l?.ToWhsCode || l?.TargetWarehouse || l?.SourceWarehouse || "").trim().toLowerCase(),
    price: toNum(l?.Price ?? l?.UnitPrice ?? 0),
    discountPercent: toNum(l?.DiscountPercent ?? 0),
    taxCode: String(l?.VatGroup || l?.TaxCode || "").trim().toLowerCase(),
    uom: normalizeUoM(l?.UoMCode),
  };
}

function linesEqual(a: ReturnType<typeof normalizeLine>, b: ReturnType<typeof normalizeLine>): boolean {
  if (a.itemCode !== b.itemCode) return false;
  if (Math.abs(a.quantity - b.quantity) > 0.0001) return false;
  if (Math.abs(a.price - b.price) > 0.0001) return false;
  if (Math.abs(a.discountPercent - b.discountPercent) > 0.0001) return false;
  if (a.warehouse && b.warehouse && a.warehouse !== b.warehouse) return false;
  if (a.taxCode && b.taxCode && a.taxCode !== b.taxCode) return false;
  if (a.uom && b.uom && a.uom !== b.uom) return false;
  return true;
}

export function hasDraftChanges(snapshot: any | null | undefined, currentLines: any[], currentHeader?: any): boolean {
  if (!snapshot) return true;
  const snapLines =
    snapshot.DocumentLines ||
    snapshot.Rows ||
    snapshot.ProductionOrderLines ||
    snapshot.DocumentRows ||
    [];
  const list = Array.isArray(currentLines) ? currentLines : [];
  if (!Array.isArray(snapLines)) return true;
  if (snapLines.length !== list.length) return true;

  const normSnapLines = snapLines.map(normalizeLine);
  const normCurrentLines = list.map(normalizeLine);

  // 1. Positional check first
  let allPositionalMatch = true;
  for (let i = 0; i < normSnapLines.length; i++) {
    if (!linesEqual(normSnapLines[i], normCurrentLines[i])) {
      allPositionalMatch = false;
      break;
    }
  }

  // 2. Multiset match check if positions differed
  if (!allPositionalMatch) {
    const matchedSnapIndices = new Set<number>();
    for (const curLine of normCurrentLines) {
      let foundIdx = -1;
      for (let j = 0; j < normSnapLines.length; j++) {
        if (!matchedSnapIndices.has(j) && linesEqual(normSnapLines[j], curLine)) {
          foundIdx = j;
          break;
        }
      }
      if (foundIdx === -1) {
        return true; // A line in current form has real changes or does not exist in snapshot
      }
      matchedSnapIndices.add(foundIdx);
    }
  }

  // 3. Header fields check
  if (currentHeader && typeof currentHeader === "object") {
    for (const field of HEADER_FIELDS) {
      if (currentHeader[field] === undefined || currentHeader[field] === null) continue;

      const snapRaw = snapshot[field];
      const curRaw = currentHeader[field];
      if (snapRaw === undefined && curRaw === undefined) continue;

      if (DATE_FIELDS.has(field)) {
        const snapDate = normalizeDate(snapRaw);
        const curDate = normalizeDate(curRaw);
        if (snapDate && curDate && snapDate !== curDate) return true;
      } else if (NUMERIC_FIELDS.has(field)) {
        const snapNum = toNum(snapRaw);
        const curNum = toNum(curRaw);
        if (Math.abs(snapNum - curNum) > 0.0001) return true;
      } else {
        const snapStr = String(snapRaw ?? "").trim().toLowerCase();
        const curStr = String(curRaw ?? "").trim().toLowerCase();
        if (snapStr !== curStr) return true;
      }
    }
  }

  return false;
}

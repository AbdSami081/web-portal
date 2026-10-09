import type { FieldCatalogEntry } from "@/types/fieldCatalog.type";
export const DIMENSION_COUNT = 5;

export function costingCodeField(dimension: number): string {
  return dimension === 1 ? "CostingCode" : `CostingCode${dimension}`;
}

export function cogsCostingCodeField(dimension: number): string {
  return dimension === 1 ? "COGSCostingCode" : `COGSCostingCode${dimension}`;
}

export const DISTRIBUTION_LINE_FIELDS: FieldCatalogEntry[] = Array.from(
  { length: DIMENSION_COUNT },
  (_, i) => i + 1
).flatMap((n) => [
  { key: costingCodeField(n), title: n === 1 ? "Distribution Rule" : `Distribution Rule ${n}` },
  { key: cogsCostingCodeField(n), title: n === 1 ? "COGS Distribution Rule" : `COGS Distribution Rule ${n}` },
]);

export function applyDistributionFields(line: Record<string, any>, baseFields: Record<string, unknown>) {
  for (let n = 1; n <= DIMENSION_COUNT; n++) {
    const cf = costingCodeField(n);
    const gf = cogsCostingCodeField(n);
    if (line[cf]) baseFields[cf] = line[cf];
    if (line[gf]) baseFields[gf] = line[gf];
  }
}

import type { FieldCatalogEntry } from "@/types/fieldCatalog.type";
export const DIMENSION_COUNT = 5;

export function costingCodeField(dimension: number): string {
  return dimension === 1 ? "CostingCode" : `CostingCode${dimension}`;
}

export function cogsCostingCodeField(dimension: number): string {
  return dimension === 1 ? "COGSCostingCode" : `COGSCostingCode${dimension}`;
}

// Fallback titles used wherever the real SAP dimension names (fetched async via
// getActiveDimensions) aren't available yet - e.g. this static catalog, which is built
// once at module load for the Field Access admin page's sync payload.
export function distributionFieldTitle(dimension: number, isCogs: boolean, dimensionLabel?: string): string {
  const base = dimensionLabel
    ? dimensionLabel
    : dimension === 1
      ? "Distribution Rule"
      : `Distribution Rule ${dimension}`;
  return isCogs ? `COGS ${base}` : base;
}

export const DISTRIBUTION_LINE_FIELDS: FieldCatalogEntry[] = Array.from(
  { length: DIMENSION_COUNT },
  (_, i) => i + 1
).flatMap((n) => [
  { key: costingCodeField(n), title: distributionFieldTitle(n, false) },
  { key: cogsCostingCodeField(n), title: distributionFieldTitle(n, true) },
]);

export function applyDistributionFields(line: Record<string, any>, baseFields: Record<string, unknown>) {
  for (let n = 1; n <= DIMENSION_COUNT; n++) {
    const cf = costingCodeField(n);
    const gf = cogsCostingCodeField(n);
    if (line[cf]) baseFields[cf] = line[cf];
    if (line[gf]) baseFields[gf] = line[gf];
  }
}

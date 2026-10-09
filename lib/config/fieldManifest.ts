import type { FieldCatalogEntry } from "@/types/fieldCatalog.type";
import { DocumentType } from "@/types/master/DocumentType";
import {
  PURCHASE_HEADER_FIELDS,
  PURCHASE_FOOTER_FIELDS,
  PURCHASE_LINE_FIELDS,
  PURCHASE_SERVICE_LINE_FIELDS,
  SALES_HEADER_FIELDS,
  SALES_FOOTER_FIELDS,
  SALES_LINE_FIELDS,
  SALES_SERVICE_LINE_FIELDS,
  INVENTORY_GOOD_ISSUE_HEADER_FIELDS,
  INVENTORY_TRANSFER_HEADER_FIELDS,
  INVENTORY_GOOD_ISSUE_LINE_FIELDS,
  INVENTORY_TRANSFER_LINE_FIELDS,
  INVENTORY_TRANSFER_REQUEST_LINE_FIELDS,
  INVENTORY_FOOTER_FIELDS,
  PRODUCTION_HEADER_FIELDS,
  PRODUCTION_LINE_FIELDS,
  PRODUCTION_FOOTER_FIELDS,
  resolveFields,
} from "./documentFieldsConfig";

export interface DocFieldCatalog {
  header: FieldCatalogEntry[];
  line: FieldCatalogEntry[];
}

function dedupe(entries: FieldCatalogEntry[]): FieldCatalogEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(e.key) ? false : (seen.add(e.key), true)));
}

const PURCHASE_CATALOG: DocFieldCatalog = {
  header: dedupe(resolveFields([...PURCHASE_HEADER_FIELDS, ...PURCHASE_FOOTER_FIELDS])),
  line: dedupe(resolveFields([...PURCHASE_LINE_FIELDS, ...PURCHASE_SERVICE_LINE_FIELDS])),
};

const SALES_CATALOG: DocFieldCatalog = {
  header: dedupe(resolveFields([...SALES_HEADER_FIELDS, ...SALES_FOOTER_FIELDS])),
  line: dedupe(resolveFields([...SALES_LINE_FIELDS, ...SALES_SERVICE_LINE_FIELDS])),
};

const PRODUCTION_CATALOG: DocFieldCatalog = {
  header: dedupe(resolveFields([...PRODUCTION_HEADER_FIELDS, ...PRODUCTION_FOOTER_FIELDS])),
  line: resolveFields(PRODUCTION_LINE_FIELDS),
};

const INVENTORY_GOOD_ISSUE_CATALOG: DocFieldCatalog = {
  header: dedupe(resolveFields([...INVENTORY_GOOD_ISSUE_HEADER_FIELDS, ...INVENTORY_FOOTER_FIELDS])),
  line: resolveFields(INVENTORY_GOOD_ISSUE_LINE_FIELDS),
};

const INVENTORY_TRANSFER_CATALOG: DocFieldCatalog = {
  header: dedupe(resolveFields([...INVENTORY_TRANSFER_HEADER_FIELDS, ...INVENTORY_FOOTER_FIELDS])),
  line: resolveFields(INVENTORY_TRANSFER_LINE_FIELDS),
};

const INVENTORY_TRANSFER_REQUEST_CATALOG: DocFieldCatalog = {
  header: dedupe(resolveFields([...INVENTORY_TRANSFER_HEADER_FIELDS, ...INVENTORY_FOOTER_FIELDS])),
  line: resolveFields(INVENTORY_TRANSFER_REQUEST_LINE_FIELDS),
};

export function getFieldCatalog(
  url: string,
  objectCode: number | string | undefined
): DocFieldCatalog | null {
  if (objectCode === undefined || objectCode === null || objectCode === "") return null;
  const code = Number(objectCode);
  if (Number.isNaN(code)) return null;

  if (url.startsWith("/dashboard/purchase")) return PURCHASE_CATALOG;
  if (url.startsWith("/dashboard/sales")) return SALES_CATALOG;
  if (url.startsWith("/dashboard/production")) return PRODUCTION_CATALOG;
  if (url.startsWith("/dashboard/inventory")) {
    if (code === DocumentType.GoodIssue) return INVENTORY_GOOD_ISSUE_CATALOG;
    if (code === DocumentType.InvTransferReq) return INVENTORY_TRANSFER_REQUEST_CATALOG;
    if (code === DocumentType.InvTransfer) return INVENTORY_TRANSFER_CATALOG;
    return null;
  }
  return null;
}

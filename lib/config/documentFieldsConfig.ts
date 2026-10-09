import type { FieldCatalogEntry } from "@/types/fieldCatalog.type";
import { DocumentType } from "@/types/master/DocumentType";
import { DISTRIBUTION_LINE_FIELDS } from "@/lib/sap/helpers/distributionHelper";

export interface FieldDef extends FieldCatalogEntry {
  enabled: boolean;
}

function withTitle(fields: FieldDef[], key: string, title: string): FieldDef[] {
  return fields.map((f) => (f.key === key ? { ...f, title } : f));
}

export const PURCHASE_HEADER_FIELDS: FieldDef[] = [
  { key: "Requester", title: "Requester", enabled: true },
  { key: "CardCode", title: "Vendor Code", enabled: true },
  { key: "CardName", title: "Vendor Name", enabled: true },
  { key: "RequesterName", title: "Requester Name", enabled: true },
  { key: "BPL_IDAssignedToInvoice", title: "Branch", enabled: true },
  { key: "SendNotification", title: "Send Notification", enabled: true },
  { key: "RequesterEmail", title: "Requester Email", enabled: true },
  { key: "DocDate", title: "Posting Date", enabled: true },
  { key: "DocDueDate", title: "Due Date", enabled: true },
  { key: "TaxDate", title: "Tax Date", enabled: true },
  { key: "RequiredDate", title: "Required Date", enabled: true },
];

export const PURCHASE_FOOTER_FIELDS: FieldDef[] = [
  { key: "TotalBeforeDiscount", title: "Total Before Discount", enabled: true },
  { key: "DiscountPercent", title: "Discount %", enabled: true },
  { key: "TotalFreight", title: "Freight", enabled: true },
  { key: "Rounding", title: "Rounding", enabled: true },
  { key: "TaxTotal", title: "Tax Total", enabled: true },
  { key: "DocTotal", title: "Document Total", enabled: true },
  { key: "Comments", title: "Remarks", enabled: true },
];

export const PURCHASE_DOWNPAYMENT_FOOTER_FIELDS: FieldDef[] = withTitle(
  PURCHASE_FOOTER_FIELDS,
  "DiscountPercent",
  "DPM"
);

export const PURCHASE_LINE_FIELDS: FieldDef[] = [
  { key: "ItemCode", title: "Item Code", enabled: true },
  { key: "ItemName", title: "Item Description", enabled: true },
  { key: "FreeText", title: "Free Text", enabled: true },
  { key: "Project", title: "Project", enabled: true },
  { key: "Quantity", title: "Qty", enabled: true },
  { key: "OnHand", title: "Qty In Whs", enabled: true },
  { key: "Price", title: "Price", enabled: true },
  { key: "DiscountPercent", title: "Disc %", enabled: true },
  { key: "TaxCode", title: "Tax Code", enabled: true },
  { key: "TaxAmount", title: "Tax Amount (LC)", enabled: true },
  { key: "WarehouseCode", title: "Whs", enabled: true },
  { key: "BPLid", title: "Branch", enabled: true },
  { key: "UoMCode", title: "UoM", enabled: true },
  { key: "LineTotal", title: "Line Total", enabled: true },
  { key: "Freight1Type", title: "Freight 1 Type", enabled: true },
  { key: "Freight1LCAmount", title: "Freight 1 (LC)", enabled: true },
  { key: "Freight2Type", title: "Freight 2 Type", enabled: true },
  { key: "Freight2LCAmount", title: "Freight 2 (LC)", enabled: true },
  { key: "Freight3Type", title: "Freight 3 Type", enabled: true },
  { key: "Freight3LCAmount", title: "Freight 3 (LC)", enabled: true },
  ...DISTRIBUTION_LINE_FIELDS.map((f) => ({ ...f, enabled: true })),
];

export const PURCHASE_SERVICE_LINE_FIELDS: FieldDef[] = [
  { key: "AccountCode", title: "G/L Account", enabled: true },
  { key: "AccountName", title: "G/L Account Name", enabled: true },
  { key: "Description", title: "Description", enabled: true },
  { key: "DiscountPercent", title: "Disc %", enabled: true },
  { key: "TaxCode", title: "Tax Code", enabled: true },
  { key: "LineTotal", title: "Line Total", enabled: true },
  { key: "TaxAmount", title: "Tax Amount (LC)", enabled: true },
  { key: "Freight1Type", title: "Freight 1 Type", enabled: true },
  { key: "Freight1LCAmount", title: "Freight 1 (LC)", enabled: true },
  { key: "Freight2Type", title: "Freight 2 Type", enabled: true },
  { key: "Freight2LCAmount", title: "Freight 2 (LC)", enabled: true },
  { key: "Freight3Type", title: "Freight 3 Type", enabled: true },
  { key: "Freight3LCAmount", title: "Freight 3 (LC)", enabled: true },
];

export const SALES_HEADER_FIELDS: FieldDef[] = [
  { key: "CardCode", title: "Customer Code", enabled: true },
  { key: "CardName", title: "Customer Name", enabled: true },
  { key: "BPLid", title: "Branch", enabled: true },
  { key: "DocStatus", title: "Status", enabled: true },
  { key: "DocDate", title: "Posting Date", enabled: true },
  { key: "DocDueDate", title: "Due Date", enabled: true },
  { key: "TaxDate", title: "Tax Date", enabled: true },
];

export const SALES_FOOTER_FIELDS: FieldDef[] = [
  { key: "SalesPersonCode", title: "Sales Employee", enabled: true },
  { key: "TotalBeforeDiscount", title: "Total Before Discount", enabled: true },
  { key: "DiscountPercent", title: "Discount %", enabled: true },
  { key: "TotalFreight", title: "Freight", enabled: true },
  { key: "Rounding", title: "Rounding", enabled: true },
  { key: "TaxTotal", title: "Tax Total", enabled: true },
  { key: "DocTotal", title: "Document Total", enabled: true },
  { key: "Comments", title: "Remarks", enabled: true },
];

export const SALES_DOWNPAYMENT_FOOTER_FIELDS: FieldDef[] = withTitle(
  SALES_FOOTER_FIELDS,
  "DiscountPercent",
  "DPM"
);

export const SALES_LINE_FIELDS: FieldDef[] = [
  { key: "ItemCode", title: "Item Code", enabled: true },
  { key: "ItemName", title: "Item Description", enabled: true },
  { key: "FreeText", title: "Free Text", enabled: true },
  { key: "Project", title: "Project", enabled: true },
  { key: "Quantity", title: "Qty", enabled: true },
  { key: "OnHand", title: "Qty In Whs", enabled: true },
  { key: "Price", title: "Price", enabled: true },
  { key: "DiscountPercent", title: "Disc %", enabled: true },
  { key: "TaxCode", title: "Tax Code", enabled: true },
  { key: "TaxAmount", title: "Tax Amount (LC)", enabled: true },
  { key: "WarehouseCode", title: "Whs", enabled: true },
  { key: "BPLid", title: "Branch", enabled: true },
  { key: "UoMCode", title: "UoM Code", enabled: true },
  { key: "UoMName", title: "UoM Name", enabled: true },
  { key: "LineTotal", title: "Line Total", enabled: true },
  { key: "Freight1Type", title: "Freight 1 Type", enabled: true },
  { key: "Freight1LCAmount", title: "Freight 1 (LC)", enabled: true },
  { key: "Freight2Type", title: "Freight 2 Type", enabled: true },
  { key: "Freight2LCAmount", title: "Freight 2 (LC)", enabled: true },
  { key: "Freight3Type", title: "Freight 3 Type", enabled: true },
  { key: "Freight3LCAmount", title: "Freight 3 (LC)", enabled: true },
  ...DISTRIBUTION_LINE_FIELDS.map((f) => ({ ...f, enabled: true })),
];

export const SALES_SERVICE_LINE_FIELDS: FieldDef[] = [
  { key: "AccountCode", title: "G/L Account", enabled: true },
  { key: "AccountName", title: "G/L Account Name", enabled: true },
  { key: "Description", title: "Description", enabled: true },
  { key: "DiscountPercent", title: "Disc %", enabled: true },
  { key: "TaxCode", title: "Tax Code", enabled: true },
  { key: "LineTotal", title: "Line Total", enabled: true },
  { key: "TaxAmount", title: "Tax Amount (LC)", enabled: true },
  { key: "Freight1Type", title: "Freight 1 Type", enabled: true },
  { key: "Freight1LCAmount", title: "Freight 1 (LC)", enabled: true },
  { key: "Freight2Type", title: "Freight 2 Type", enabled: true },
  { key: "Freight2LCAmount", title: "Freight 2 (LC)", enabled: true },
  { key: "Freight3Type", title: "Freight 3 Type", enabled: true },
  { key: "Freight3LCAmount", title: "Freight 3 (LC)", enabled: true },
];

export const INVENTORY_GOOD_ISSUE_HEADER_FIELDS: FieldDef[] = [
  { key: "BPL_IDAssignedToInvoice", title: "Branch", enabled: true },
  { key: "DocDate", title: "Posting Date", enabled: true },
];

export const INVENTORY_TRANSFER_HEADER_FIELDS: FieldDef[] = [
  { key: "CardCode", title: "Customer/Vendor Code", enabled: true },
  { key: "CardName", title: "Customer/Vendor Name", enabled: true },
  { key: "BPL_IDAssignedToInvoice", title: "Branch", enabled: true },
  { key: "FromWarehouse", title: "From Warehouse", enabled: true },
  { key: "ToWarehouse", title: "To Warehouse", enabled: true },
  { key: "DocDate", title: "Posting Date", enabled: true },
];

export const INVENTORY_GOOD_ISSUE_LINE_FIELDS: FieldDef[] = [
  { key: "ItemCode", title: "Item", enabled: true },
  { key: "Dscription", title: "Description", enabled: true },
  { key: "Project", title: "Project", enabled: true },
  { key: "WhsCode", title: "Warehouse", enabled: true },
  { key: "BPLid", title: "Branch", enabled: true },
  { key: "Quantity", title: "Quantity", enabled: true },
  { key: "OnHand", title: "Qty In Whs", enabled: true },
  { key: "UoMCode", title: "UoM Code", enabled: true },
  { key: "UoMName", title: "UoM Name", enabled: true },
];

export const INVENTORY_TRANSFER_LINE_FIELDS: FieldDef[] = [
  { key: "ItemCode", title: "Item", enabled: true },
  { key: "Dscription", title: "Description", enabled: true },
  { key: "Project", title: "Project", enabled: true },
  { key: "FromWhsCode", title: "From Whs", enabled: true },
  { key: "WhsCode", title: "To Whs", enabled: true },
  { key: "BPLid", title: "Branch", enabled: true },
  { key: "Quantity", title: "Quantity", enabled: true },
  { key: "OnHand", title: "Qty In Whs", enabled: true },
  { key: "UoMCode", title: "UoM Code", enabled: true },
  { key: "UoMName", title: "UoM Name", enabled: true },
];

export const INVENTORY_TRANSFER_REQUEST_LINE_FIELDS: FieldDef[] = [
  { key: "ItemCode", title: "Item", enabled: true },
  { key: "Dscription", title: "Description", enabled: true },
  { key: "Project", title: "Project", enabled: true },
  { key: "FromWhsCode", title: "From Whs", enabled: true },
  { key: "WhsCode", title: "To Whs", enabled: true },
  { key: "BPLid", title: "Branch", enabled: true },
  { key: "Quantity", title: "Quantity", enabled: true },
  { key: "OnHand", title: "Qty In Whs", enabled: true },
  { key: "OpenQty", title: "Open Qty", enabled: true },
  { key: "UoMCode", title: "UoM Code", enabled: true },
  { key: "UoMName", title: "UoM Name", enabled: true },
];

export const INVENTORY_FOOTER_FIELDS: FieldDef[] = [
  { key: "SalesPersonCode", title: "Sales Employee", enabled: true },
  { key: "JournalMemo", title: "Journal Memo", enabled: true },
  { key: "Comments", title: "Comments", enabled: true },
];

export const PRODUCTION_HEADER_FIELDS: FieldDef[] = [
  { key: "HeaderProject", title: "Project", enabled: true },
  { key: "Ref2", title: "Reference", enabled: true },
  { key: "TaxDate", title: "Posting Date", enabled: true },
  { key: "ProductionOrderType", title: "Type", enabled: true },
  { key: "ItemNo", title: "Product No.", enabled: true },
  { key: "ProductDescription", title: "Product Description", enabled: true },
  { key: "ProductionOrderStatus", title: "Status", enabled: true },
  { key: "PlannedQuantity", title: "Planned Quantity", enabled: true },
  { key: "Warehouse", title: "Warehouse", enabled: true },
  { key: "Priority", title: "Priority", enabled: true },
  { key: "CreationDate", title: "Order Date", enabled: true },
  { key: "StartDate", title: "Start Date", enabled: true },
  { key: "DueDate", title: "Due Date", enabled: true },
  { key: "BPL_IDAssignedToInvoice", title: "Branch", enabled: true },
];

export const PRODUCTION_LINE_FIELDS: FieldDef[] = [
  { key: "OrderNumber", title: "Order Number", enabled: true },
  { key: "ItemType", title: "Type", enabled: true },
  { key: "ItemNo", title: "Item No.", enabled: true },
  { key: "ItemName", title: "Item Description", enabled: true },
  { key: "Project", title: "Project", enabled: true },
  { key: "BaseQuantity", title: "Base Qty", enabled: true },
  { key: "BaseRatio", title: "Base Ratio", enabled: true },
  { key: "PlannedQuantity", title: "Planned Qty", enabled: true },
  { key: "IssuedQuantity", title: "Issued Qty", enabled: true },
  { key: "AvailableQuantity", title: "Available Qty", enabled: true },
  { key: "UoMCode", title: "UoM Code", enabled: true },
  { key: "MeasureUnit", title: "UoM Name", enabled: true },
  { key: "Warehouse", title: "Warehouse", enabled: true },
  { key: "ProductionOrderIssueType", title: "Issue Method", enabled: true },
];

export const PRODUCTION_FOOTER_FIELDS: FieldDef[] = [
  { key: "Comments", title: "Comments", enabled: true },
  { key: "JournalMemo", title: "Journal Memo", enabled: true },
  { key: "PickRmrk", title: "Pick Remark", enabled: true },
];

function copyField(key: "CopyFrom" | "CopyTo", enabled: boolean): FieldDef {
  return { key, title: key === "CopyFrom" ? "Copy From" : "Copy To", enabled };
}

const HEADER_FIELDS_BY_OBJTYPE: Record<number, FieldDef[]> = {
  [DocumentType.PurchaseRequests]: [...PURCHASE_HEADER_FIELDS, ...PURCHASE_FOOTER_FIELDS, copyField("CopyFrom", false), copyField("CopyTo", true)],
  [DocumentType.PurchaseQuotation]: [...PURCHASE_HEADER_FIELDS, ...PURCHASE_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],
  [DocumentType.PurchaseOrder]: [...PURCHASE_HEADER_FIELDS, ...PURCHASE_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],
  [DocumentType.GoodsReceiptPO]: [...PURCHASE_HEADER_FIELDS, ...PURCHASE_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],
  [DocumentType.APInvoice]: [...PURCHASE_HEADER_FIELDS, ...PURCHASE_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],
  [DocumentType.APCreditMemo]: [...PURCHASE_HEADER_FIELDS, ...PURCHASE_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", false)],
  [DocumentType.GoodsReturn]: [...PURCHASE_HEADER_FIELDS, ...PURCHASE_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", false)],
  [DocumentType.GoodsReturnRequest]: [...PURCHASE_HEADER_FIELDS, ...PURCHASE_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],
  [DocumentType.APDownPaymentInvoice]: [...PURCHASE_HEADER_FIELDS, ...PURCHASE_DOWNPAYMENT_FOOTER_FIELDS, ...SALES_HEADER_FIELDS, ...SALES_DOWNPAYMENT_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],

  [DocumentType.Quotation]: [...SALES_HEADER_FIELDS, ...SALES_FOOTER_FIELDS, copyField("CopyFrom", false), copyField("CopyTo", true)],
  [DocumentType.Order]: [...SALES_HEADER_FIELDS, ...SALES_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],
  [DocumentType.Delivery]: [...SALES_HEADER_FIELDS, ...SALES_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],
  [DocumentType.ARInvoice]: [...SALES_HEADER_FIELDS, ...SALES_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],
  [DocumentType.SalesReturn]: [...SALES_HEADER_FIELDS, ...SALES_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],
  [DocumentType.SalesReturnRequest]: [...SALES_HEADER_FIELDS, ...SALES_FOOTER_FIELDS, copyField("CopyFrom", false), copyField("CopyTo", true)],
  [DocumentType.ARCreditMemo]: [...SALES_HEADER_FIELDS, ...SALES_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", false)],
  // AR Down Payment Invoice (203, unambiguous) — DPM footer.
  [DocumentType.ARDownPaymentInvoice]: [...SALES_HEADER_FIELDS, ...SALES_DOWNPAYMENT_FOOTER_FIELDS, copyField("CopyFrom", true), copyField("CopyTo", true)],

  // GoodIssue and IssueForProduction share object code 60 — merged (Issue for
  // Production never offers Copy From, Inventory Good Issue has no copy concept).
  [DocumentType.GoodIssue]: [...INVENTORY_GOOD_ISSUE_HEADER_FIELDS, ...INVENTORY_FOOTER_FIELDS, ...PRODUCTION_HEADER_FIELDS, ...PRODUCTION_FOOTER_FIELDS, copyField("CopyFrom", false)],
  [DocumentType.InvTransfer]: [...INVENTORY_TRANSFER_HEADER_FIELDS, ...INVENTORY_FOOTER_FIELDS],
  [DocumentType.InvTransferReq]: [...INVENTORY_TRANSFER_HEADER_FIELDS, ...INVENTORY_FOOTER_FIELDS],

  [DocumentType.ProductionOrder]: [...PRODUCTION_HEADER_FIELDS, ...PRODUCTION_FOOTER_FIELDS, copyField("CopyFrom", true)],
  [DocumentType.ReceiptFromProduction]: [...PRODUCTION_HEADER_FIELDS, ...PRODUCTION_FOOTER_FIELDS, copyField("CopyFrom", false)],
};

const LINE_FIELDS_BY_OBJTYPE: Record<number, FieldDef[]> = {
  [DocumentType.PurchaseRequests]: [...PURCHASE_LINE_FIELDS, ...PURCHASE_SERVICE_LINE_FIELDS],
  [DocumentType.PurchaseQuotation]: [...PURCHASE_LINE_FIELDS, ...PURCHASE_SERVICE_LINE_FIELDS],
  [DocumentType.PurchaseOrder]: [...PURCHASE_LINE_FIELDS, ...PURCHASE_SERVICE_LINE_FIELDS],
  [DocumentType.GoodsReceiptPO]: [...PURCHASE_LINE_FIELDS, ...PURCHASE_SERVICE_LINE_FIELDS],
  [DocumentType.APInvoice]: [...PURCHASE_LINE_FIELDS, ...PURCHASE_SERVICE_LINE_FIELDS],
  [DocumentType.APCreditMemo]: [...PURCHASE_LINE_FIELDS, ...PURCHASE_SERVICE_LINE_FIELDS],
  [DocumentType.GoodsReturn]: [...PURCHASE_LINE_FIELDS, ...PURCHASE_SERVICE_LINE_FIELDS],
  [DocumentType.GoodsReturnRequest]: [...PURCHASE_LINE_FIELDS, ...PURCHASE_SERVICE_LINE_FIELDS],
  [DocumentType.APDownPaymentInvoice]: [...PURCHASE_LINE_FIELDS, ...PURCHASE_SERVICE_LINE_FIELDS, ...SALES_LINE_FIELDS, ...SALES_SERVICE_LINE_FIELDS],

  [DocumentType.Quotation]: [...SALES_LINE_FIELDS, ...SALES_SERVICE_LINE_FIELDS],
  [DocumentType.Order]: [...SALES_LINE_FIELDS, ...SALES_SERVICE_LINE_FIELDS],
  [DocumentType.Delivery]: [...SALES_LINE_FIELDS, ...SALES_SERVICE_LINE_FIELDS],
  [DocumentType.ARInvoice]: [...SALES_LINE_FIELDS, ...SALES_SERVICE_LINE_FIELDS],
  [DocumentType.SalesReturn]: [...SALES_LINE_FIELDS, ...SALES_SERVICE_LINE_FIELDS],
  [DocumentType.SalesReturnRequest]: [...SALES_LINE_FIELDS, ...SALES_SERVICE_LINE_FIELDS],
  [DocumentType.ARCreditMemo]: [...SALES_LINE_FIELDS, ...SALES_SERVICE_LINE_FIELDS],
  [DocumentType.ARDownPaymentInvoice]: [...SALES_LINE_FIELDS, ...SALES_SERVICE_LINE_FIELDS],

  [DocumentType.GoodIssue]: INVENTORY_GOOD_ISSUE_LINE_FIELDS,
  [DocumentType.InvTransfer]: INVENTORY_TRANSFER_LINE_FIELDS,
  [DocumentType.InvTransferReq]: INVENTORY_TRANSFER_REQUEST_LINE_FIELDS,

  [DocumentType.ProductionOrder]: PRODUCTION_LINE_FIELDS,
  [DocumentType.ReceiptFromProduction]: PRODUCTION_LINE_FIELDS,
};

export function getFieldDef(
  objtype: number,
  fieldGroup: "headerFieds" | "linesFieds",
  fieldName: string
): FieldDef | undefined {
  const table = fieldGroup === "headerFieds" ? HEADER_FIELDS_BY_OBJTYPE : LINE_FIELDS_BY_OBJTYPE;
  const fields = table[objtype];
  if (!fields) return undefined;
  return fields.find((f) => f.key.toLowerCase() === fieldName.toLowerCase());
}

export function resolveFields(fields: FieldDef[]): FieldCatalogEntry[] {
  return fields
    .filter((f) => f.enabled)
    .map(({ key, title }) => ({ key, title }));
}

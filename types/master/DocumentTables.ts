import { DocumentType } from "./DocumentType";

export function getMasterTable(docType: number): string {
  switch (docType) {
    case DocumentType.Quotation:
      return "OQUT";

    case DocumentType.Order:
      return "ORDR";

    case DocumentType.Delivery:
      return "ODLN";

    case DocumentType.ARInvoice:
      return "OINV";

    case DocumentType.InvTransfer:
      return "OWTR";

    case DocumentType.InvTransferReq:
      return "OWTQ";

    case DocumentType.IssueForProduction:
      return "OIGE";
 
    case DocumentType.ReceiptFromProduction:
      return "OIGN";

    case DocumentType.ProductionOrder:
      return "OWOR";

    case DocumentType.SalesReturn:
      return "ORDN";

    default:
      return "";
  }
}

/**
 * The document's LINE table (e.g. RDR1 for a Sales Order) — used to load
 * line-level UDF definitions so they can be rendered as extra line columns.
 */
export function getMasterLineTable(docType: number): string {
  switch (docType) {
    // Sales
    case 23: return "QUT1";          // Quotation
    case 17: return "RDR1";          // Sales Order
    case 15: return "DLN1";          // Delivery
    case 13: return "INV1";          // A/R Invoice
    case 16: return "RDN1";          // Sales Return
    case 14: return "RIN1";          // A/R Credit Memo
    case 203: return "DPI1";         // A/R Down Payment
    case 234000031: return "RRR1";   // Return Request
    // Purchase
    case 1470000113: return "PRQ1";  // Purchase Request
    case 54: return "PQT1";          // Purchase Quotation
    case 540000006: return "PQT1";
    case 22: return "POR1";          // Purchase Order
    case 20: return "PDN1";          // Goods Receipt PO
    case 21: return "RPD1";          // Goods Return
    case 19: return "RPC1";          // A/P Credit Memo
    case 18: return "PCH1";          // A/P Invoice
    case 204: return "DPO1";         // A/P Down Payment
    case 234000032: return "PRR1";   // Goods Return Request
    // Inventory / Production
    case 67: return "WTR1";          // Inventory Transfer
    case 1250000001: return "WTQ1";  // Inventory Transfer Request
    case 60: return "IGE1";          // Goods Issue
    case 59: return "IGN1";          // Goods Receipt
    case 202: return "WOR1";         // Production Order
    default: return "";
  }
}
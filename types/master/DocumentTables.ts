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
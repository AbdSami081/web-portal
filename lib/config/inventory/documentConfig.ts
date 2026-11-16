import { DocumentType } from "@/types/master/DocumentType";

export interface DocumentConfig {
  type: DocumentType;
  title: string;
}

export const InvTransferConfig: DocumentConfig = {
  type: DocumentType.InvTransfer,
  title: "Inventory Transfer",
};

export const InvTransferReqConfig: DocumentConfig = {
  type: DocumentType.InvTransferReq,
  title: "Inventory Transfer Request",
};

export const GoodIssueConfig: DocumentConfig = {
  type: DocumentType.GoodIssue,
  title: "Good Issue",
};
export const GoodReceiptConfig: DocumentConfig = {
  type: DocumentType.GoodsReceipt,
  title: "Good Receipt",
};

export const getDocumentConfig = (type: DocumentType): DocumentConfig => {
  switch (type) {
    case DocumentType.InvTransfer: return InvTransferConfig;
    case DocumentType.InvTransferReq: return InvTransferReqConfig;
    case DocumentType.GoodIssue: return GoodIssueConfig;
    case DocumentType.GoodsReceipt: return GoodReceiptConfig;
    default: return InvTransferConfig; 
  }
};
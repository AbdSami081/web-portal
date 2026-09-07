import { DocumentType } from "@/types/master/DocumentType";

export interface DocumentConfig {
  type: DocumentType;
  title: string;
  showGLAccount?: boolean;
}

export const InvTransferConfig: DocumentConfig = {
  type: DocumentType.InvTransfer,
  title: "Inventory Transfer",
  showGLAccount: true,
};

export const InvTransferReqConfig: DocumentConfig = {
  type: DocumentType.InvTransferReq,
  title: "Inventory Transfer Request",
};

export const GoodIssueConfig: DocumentConfig = {
  type: DocumentType.GoodIssue,
  title: "Good Issue",
  showGLAccount: true,
};

export const getDocumentConfig = (type: DocumentType): DocumentConfig => {
  switch (type) {
    case DocumentType.InvTransfer: return InvTransferConfig;
    case DocumentType.InvTransferReq: return InvTransferReqConfig;
    case DocumentType.GoodIssue: return GoodIssueConfig;
    default: return InvTransferConfig; 
  }
};
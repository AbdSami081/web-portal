
import { DocumentType } from "@/types/sales/salesDocuments.type";

export interface DocumentConfig {
  type: DocumentType;
  title: string;
  
  // headerFields: {
  //   showDueDate: boolean;
  // };

//   itemColumns: {
//     showWarehouse: boolean;
//     showDiscount: boolean;
//     showBackorder: boolean;
//   };

//   isRowDisabled: (line: SalesDocumentLine, headerStatus: string) => boolean;
//   isDisabledTable: (headerStatus: string) => boolean;
//   hideSubmitButton: (headerStatus: string) => boolean;
}

export const InvTransferConfig: DocumentConfig = {
  type: DocumentType.InvTransfer,
  title: "Inventory Transfer",
  // headerFields: {
  //   showDueDate: false
  // },
//   itemColumns: {
//     showWarehouse: true,
//     showDiscount: true,
//     showBackorder: false,
//   },
//   isRowDisabled: (line, headerStatus) => {
//     if (headerStatus === "bost_Close") return true; 
//     if (line.IsClosed === "tYES") return true;
//     return false;
//   },
//   isDisabledTable: (headerStatus) => {
//     return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
//   },
//   hideSubmitButton: (headerStatus) => {
//         return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
//   }
};

export const InvTransferReqConfig: DocumentConfig = {
  type: DocumentType.InvTransferReq,
  title: "Inventory Transfer Request",
  // headerFields: {
  //   showDueDate: false
  // },
//   itemColumns: {
//     showWarehouse: true,
//     showDiscount: true,
//     showBackorder: false,
//   },
//   isRowDisabled: (line, headerStatus) => {
//     if (headerStatus === "bost_Close") return true; 
//     if (line.IsClosed === "tYES") return true;
//     return false;
//   },
//   isDisabledTable: (headerStatus) => {
//     return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
//   },
//   hideSubmitButton: (headerStatus) => {
//         return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
//   }
};

export const getDocumentConfig = (type: DocumentType): DocumentConfig => {
  switch (type) {
    case DocumentType.InvTransfer: return InvTransferConfig;
    case DocumentType.InvTransferReq: return InvTransferReqConfig;
    default: return InvTransferConfig; 
  }
};
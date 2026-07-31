import { DocumentType } from "@/types/master/DocumentType";
import { PurchaseDocumentLine } from "@/types/purchase/purchaseDocuments.type";

export interface DocumentConfig {
  type: DocumentType;
  title: string;
  
  headerFields: {
    showValidUntil: boolean;
  };

  itemColumns: {
    showWarehouse: boolean;
    showDiscount: boolean;
    showBackorder: boolean;
  };

  isRowDisabled: (line: PurchaseDocumentLine, headerStatus: string) => boolean;
  isDisabledTable: (headerStatus: string) => boolean;
  hideSubmitButton: (headerStatus: string) => boolean;
}

export const requestConfig: DocumentConfig = {
  type: DocumentType.PurchaseRequests,
  title: "Purchase Request",
  headerFields: {
    showValidUntil: true
  },
  itemColumns: {
    showWarehouse: true,
    showDiscount: true,
    showBackorder: false,
  },
  isRowDisabled: (line, headerStatus) => {
    if (headerStatus === "bost_Close") return true; 
    if (line.IsClosed === "tYES") return true;
    return false;
  },
  isDisabledTable: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  },
  hideSubmitButton: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  }
};

export const quotationConfig: DocumentConfig = {
  type: DocumentType.PurchaseQuotation,
  title: "Purchase Quotation",
  headerFields: {
    showValidUntil: true
  },
  itemColumns: {
    showWarehouse: true,
    showDiscount: true,
    showBackorder: false,
  },
  isRowDisabled: (line, headerStatus) => {
    if (headerStatus === "bost_Close") return true; 
    if (line.IsClosed === "tYES") return true;
    return false;
  },
  isDisabledTable: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  },
  hideSubmitButton: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  }
};

export const orderConfig: DocumentConfig = {
  type: DocumentType.PurchaseOrder,
  title: "Purchase Order",
  headerFields: {
    showValidUntil: false
  },
  itemColumns: {
    showWarehouse: true,
    showDiscount: true,
    showBackorder: true,
  },
  isRowDisabled: (line, headerStatus) => {
    if (headerStatus === "bost_Close" || headerStatus === "bost_Cancel") return true;
    if (line.OrderedQty && line.OrderedQty > 0) return true; 
    return false;
  },
  isDisabledTable: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  },
  hideSubmitButton: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  }
};

export const GRPOConfig: DocumentConfig = {
  type: DocumentType.GoodsReceiptPO,
  title: "Goods Receipt PO",
  headerFields: {
    showValidUntil: false
  },
  itemColumns: {
    showWarehouse: true,
    showDiscount: true,
    showBackorder: true,
  },
  isRowDisabled: (line, headerStatus) => {
    if (headerStatus === "bost_Close" || headerStatus === "bost_Cancel") return true;
    if (line.OrderedQty && line.OrderedQty > 0) return true; 
    return false;
  },
  isDisabledTable: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  },
  hideSubmitButton: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  }
};

export const returnConfig: DocumentConfig = {
  type: DocumentType.SalesReturn,
  title: "Return",
  headerFields: {
    showValidUntil: false
  },
  itemColumns: {
    showWarehouse: true,
    showDiscount: true,
    showBackorder: true,
  },
  isRowDisabled: (line, headerStatus) => {
    if (headerStatus === "bost_Close" || headerStatus === "bost_Cancel") return true;
    if (line.OrderedQty && line.OrderedQty > 0) return true; 
    return false;
  },
  isDisabledTable: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  },
  hideSubmitButton: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  }
};

export const invoiceConfig: DocumentConfig = {
  type: DocumentType.APInvoice,
  title: "A/P Invoice",
  headerFields: {
    showValidUntil: false
  },
  itemColumns: {
    showWarehouse: true,
    showDiscount: true,
    showBackorder: true,
  },
  isRowDisabled: (line, headerStatus) => {
    if (headerStatus === "bost_Close" || headerStatus === "bost_Cancel") return true;
    if (line.OrderedQty && line.OrderedQty > 0) return true; 
    return false;
  },
  isDisabledTable: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  },
  hideSubmitButton: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  }
};

export const getDocumentConfig = (type: DocumentType): DocumentConfig => {
  switch (type) {
    case DocumentType.PurchaseRequests: return requestConfig;
    case DocumentType.PurchaseQuotation: return quotationConfig;
    case DocumentType.PurchaseOrder: return orderConfig;
    case DocumentType.GoodsReceiptPO: return GRPOConfig;
    case DocumentType.APInvoice: return invoiceConfig;
    default: return quotationConfig; 
  }
};

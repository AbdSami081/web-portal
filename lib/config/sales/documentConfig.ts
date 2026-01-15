
import { DocumentType, SalesDocumentLine } from "@/types/sales/salesDocuments.type";

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

  isRowDisabled: (line: SalesDocumentLine, headerStatus: string) => boolean;
  isDisabledTable: (headerStatus: string) => boolean;
  hideSubmitButton: (headerStatus: string) => boolean;
}

export const quotationConfig: DocumentConfig = {
  type: DocumentType.Quotation,
  title: "Sales Quotation",
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
  type: DocumentType.Order,
  title: "Sales Order",
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

export const deliveryConfig: DocumentConfig = {
  type: DocumentType.Delivery,
  title: "Delivery Order",
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
  type: DocumentType.ARInvoice,
  title: "A/R Invoice",
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
    case DocumentType.Quotation: return quotationConfig;
    case DocumentType.Order: return orderConfig;
    case DocumentType.Delivery: return deliveryConfig;
    case DocumentType.SalesReturn: return returnConfig;
    case DocumentType.ARInvoice: return invoiceConfig;
    default: return quotationConfig; 
  }
};
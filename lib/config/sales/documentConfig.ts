
import { DocumentType } from "@/types/master/DocumentType";
import {  SalesDocumentLine } from "@/types/sales/salesDocuments.type";

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
  title: "Sales Return",
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

export const returnRequestConfig: DocumentConfig = {
  type: DocumentType.ReturnRequest,
  title: "Sales Return Request",
  headerFields: {
    showValidUntil: false
  },
  itemColumns: {
    showWarehouse: true,
    showDiscount: true,
    showBackorder: false,
  },
  isRowDisabled: (line, headerStatus) => {
    if (headerStatus === "bost_Close" || headerStatus === "bost_Cancel") return true;
    return false;
  },
  isDisabledTable: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  },
  hideSubmitButton: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  }
};

export const creditMemoConfig: DocumentConfig = {
  type: DocumentType.CreditMemo,
  title: "A/R Credit Memo",
  headerFields: {
    showValidUntil: false
  },
  itemColumns: {
    showWarehouse: true,
    showDiscount: true,
    showBackorder: false,
  },
  isRowDisabled: (line, headerStatus) => {
    if (headerStatus === "bost_Close" || headerStatus === "bost_Cancel") return true;
    return false;
  },
  isDisabledTable: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  },
  hideSubmitButton: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  }
};

export const downPaymentRequestConfig: DocumentConfig = {
  type: DocumentType.DownPaymentRequest,
  title: "A/R Down Payment Request",
  headerFields: {
    showValidUntil: false
  },
  itemColumns: {
    showWarehouse: true,
    showDiscount: true,
    showBackorder: false,
  },
  isRowDisabled: (line, headerStatus) => {
    if (headerStatus === "bost_Close" || headerStatus === "bost_Cancel") return true;
    return false;
  },
  isDisabledTable: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  },
  hideSubmitButton: (headerStatus) => {
    return headerStatus === "bost_Close" || headerStatus === "bost_Cancel";
  }
};

export const downPaymentInvoiceConfig: DocumentConfig = {
  type: DocumentType.DownPaymentInvoice,
  title: "A/R Down Payment Invoice",
  headerFields: {
    showValidUntil: false
  },
  itemColumns: {
    showWarehouse: true,
    showDiscount: true,
    showBackorder: false,
  },
  isRowDisabled: (line, headerStatus) => {
    if (headerStatus === "bost_Close" || headerStatus === "bost_Cancel") return true;
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
    case DocumentType.SalesReturn:
    case DocumentType.Return: return returnConfig;
    case DocumentType.ARInvoice: return invoiceConfig;
    case DocumentType.ReturnRequest:
    case DocumentType.SalesReturnRequest: return returnRequestConfig;
    case DocumentType.CreditMemo:
    case DocumentType.ARCreditMemo: return creditMemoConfig;
    case DocumentType.DownPaymentRequest:
    case DocumentType.ARDownPaymentRequest: return downPaymentRequestConfig;
    case DocumentType.DownPaymentInvoice:
    case DocumentType.ARDownPaymentInvoice: return downPaymentInvoiceConfig;
    default: return quotationConfig; 
  }
};
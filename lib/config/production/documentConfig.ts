
import { DocumentType } from "@/types/sales/salesDocuments.type";

export interface DocumentConfig {
  type: DocumentType;
  title: string;
  headerFields: {
    baseRef?: boolean;
    reference?: boolean;
    docDate?: boolean;
    productNo?: boolean;
    productDescription?: boolean;
    plannedQuantity?: boolean;
    warehouse?: boolean;
    priority?: boolean;
    startDate?: boolean;
    orderDate?: boolean;
    dueDate?: boolean;
  };
  itemColumns: {
    type?: boolean;
    itemCode?: boolean;
    itemDescription?: boolean;
    baseQty?: boolean;
    baseRatio?: boolean;
    plannedQty?: boolean;
    issued?: boolean;
    available?: boolean;
    uomCode?: boolean;
    warehouse?: boolean;
    issueMethod?: boolean;
    actions?: boolean;
  };
  footerActions?: {
    showProductionOrderButton?: boolean;
  };
}

export const IFPRDConfig: DocumentConfig = {
  type: DocumentType.IssueForProduction,
  title: "Issue For Production",
  headerFields: {
    baseRef: true,
    reference: true,
    docDate: true,
  },
  itemColumns: {
    type: true,
    itemCode: true,
    itemDescription: true,
    plannedQty: true,
    warehouse: true,
    actions: true,
  },
  footerActions: {
    showProductionOrderButton: true,
  }
};

export const ReceiptFPRDConfig: DocumentConfig = {
  type: DocumentType.ReceiptFromProduction,
  title: "Receipt From Production",
  headerFields: {
    baseRef: true,
    reference: true,
    docDate: true,
  },
  itemColumns: {
    type: true,
    itemCode: true,
    itemDescription: true,
    plannedQty: true,
    warehouse: true,
    actions: true,
  },
  footerActions: {
    showProductionOrderButton: true,
  }
};

export const PRDOrderConfig: DocumentConfig = {
  type: DocumentType.ProductionOrder,
  title: "Production Order",
  headerFields: {
    productNo: true,
    productDescription: true,
    plannedQuantity: true,
    warehouse: true,
    priority: true,
    startDate: true,
    orderDate: true,
    dueDate: true,
  },
  itemColumns: {
    itemCode: true,
    itemDescription: true,
    baseQty: true,
    baseRatio: true,
    plannedQty: true,
    issued: true,
    available: true,
    uomCode: true,
    warehouse: true,
    issueMethod: true,
  },
  footerActions: {
    showProductionOrderButton: false,
  }
};

export const getDocumentConfig = (type: DocumentType): DocumentConfig => {
  switch (type) {
    case DocumentType.IssueForProduction: return IFPRDConfig;
    case DocumentType.ReceiptFromProduction: return ReceiptFPRDConfig;
    case DocumentType.ProductionOrder: return PRDOrderConfig;
    default: return IFPRDConfig;
  }
};

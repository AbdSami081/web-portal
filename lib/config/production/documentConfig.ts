import { DocumentType } from "@/types/master/DocumentType";


export interface DocumentConfig {
  type: DocumentType;
  title: string;
  headerFields: {
    baseRef?: boolean;
    search?: boolean;
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
    type?: boolean;
    status?: boolean;
    branch?: boolean;
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
    uomName?: boolean;
    warehouse?: boolean;
    issueMethod?: boolean;
    actions?: boolean;
    orderNumber?: boolean;
    openQty?: boolean;
  };
  footerActions?: {
    showProductionOrderButton?: boolean;
  };
}

export const IFPRDConfig: DocumentConfig = {
  type: DocumentType.IssueForProduction,
  title: "Issue For Production",
  headerFields: {
    search: true,
    reference: true,
    docDate: true,
    type: false,
    status: false,
    branch: true,
  },
  itemColumns: {
    type: true,
    itemCode: true,
    itemDescription: true,
    plannedQty: true,
    issued: true,
    openQty: true,
    uomCode: true,
    uomName: true,
    warehouse: true,
    actions: true,
    orderNumber: true,
  },
  footerActions: {
    showProductionOrderButton: true,
  }
};

export const ReceiptFPRDConfig: DocumentConfig = {
  type: DocumentType.ReceiptFromProduction,
  title: "Receipt From Production",
  headerFields: {
    search: true,
    reference: true,
    docDate: true,
    type: false,
    status: false,
    branch: true,
  },
  itemColumns: {
    type: true,
    itemCode: true,
    itemDescription: true,
    plannedQty: true,
    uomCode: true,
    uomName: true,
    warehouse: true,
    actions: true,
    orderNumber: true,
    openQty: true,
  },
  footerActions: {
    showProductionOrderButton: true,
  }
};

export const PRDOrderConfig: DocumentConfig = {
  type: DocumentType.ProductionOrder,
  title: "Production Order",
  headerFields: {
    search: true,
    productNo: true,
    productDescription: true,
    plannedQuantity: true,
    warehouse: true,
    priority: true,
    startDate: true,
    orderDate: true,
    dueDate: true,
    type: true,
    status: true,
    // Unlike Issue/Receipt for Production, SAP's ProductionOrders object has no
    // BPL_IDAssignedToInvoice property — branch is implicit from the Warehouse chosen.
    branch: false,
  },
  itemColumns: {
    itemCode: true,
    itemDescription: true,
    baseQty: true,
    baseRatio: true,
    plannedQty: true,
    issued: true,
    available: false,
    uomCode: true,
    uomName: true,
    warehouse: true,
    issueMethod: true,
    actions: true,
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

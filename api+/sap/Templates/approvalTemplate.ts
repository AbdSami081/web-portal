import apiClient from "@/lib/apiClient";
import { ApprovalTemplate } from "@/types/template.type";
import { DocumentType } from "@/types/master/DocumentType";

export const getTemplateDocuments = async (): Promise<ApprovalTemplate[]> => {
  const res = await apiClient.get("api/Approval/ApprovalTemplates");
  if (!res.data) return [];
  return res.data as ApprovalTemplate[];
};

export const getApprovalDocumentType = (docType: number | string, pathname = ""): string => {
  const numType = Number(docType);
  const currentPath = pathname.toLowerCase();

 if (currentPath.includes("apdownpaymentrequest")) return "atdtPurchaseDownPayment";

  switch (numType) {
    case DocumentType.Quotation:
      return "atdtQuotation";
    case DocumentType.Order:
      return "atdtOrder";
    case DocumentType.Delivery:
      return "atdtDelivery";
    case DocumentType.ARInvoice:
      return "atdtInvoice";
    case DocumentType.Return:
    case DocumentType.SalesReturn:
      return "atdtReturns";
    case DocumentType.ReturnRequest:
    case DocumentType.SalesReturnRequest:
      return "atdtReturnsRequest";
    case DocumentType.CreditMemo:
    case DocumentType.ARCreditMemo:
      return "atdtCreditNotes";
    case DocumentType.DownPaymentInvoice:
    case DocumentType.ARDownPaymentInvoice:
    case DocumentType.DownPaymentRequest:
    case DocumentType.ARDownPaymentRequest:
      return "atdtDownPayment";
    case DocumentType.PurchaseRequests:
      return "atdtPurchaseRequest";
    case DocumentType.PurchaseQuotation:
      return "atdtPurchaseQuotation";
    case DocumentType.PurchaseOrder:
      return "atdtPurchaseOrder";
    case DocumentType.GoodsReceiptPO:
      return "atdtGoodsReceiptPO";
    case DocumentType.APInvoice:
    case DocumentType.APReserveInvoice:
      return "atdtPurchaseInvoice";
    case DocumentType.APCreditMemo:
      return "atdtPurchaseCreditNote";
    case DocumentType.GoodsReturn:
      return "atdtPurchaseDeliveryNotes";
    case DocumentType.GoodsReturnRequest:
      return "atdtGoodsReturnRequest";
    case DocumentType.APDownPaymentInvoice:
    case DocumentType.APDownPaymentRequest:
      return "atdtPurchaseDownPayment";
    case DocumentType.InvTransferReq:
      return "atdtInventoryTransferRequest";
    case DocumentType.InvTransfer:
      return "atdtInventoryTransfer";
    case DocumentType.GoodIssue:
    case DocumentType.IssueForProduction:
      return "atdtGoodIssue";
    case DocumentType.ReceiptFromProduction:
      return "atdtGoodsReceipt";
    case DocumentType.ProductionOrder:
      return "atdtProductionOrder";
    default:
      return typeof docType === "string" ? docType : "atdtQuotation";
  }
};

export const getCurrentUserApprovalTemplates = async (
  userId: number | string,
  documentType?: string
): Promise<ApprovalTemplate[]> => {
  try {
    const params: Record<string, any> = { userId };
    if (documentType) {
      params.documentType = documentType;
    }
    const res = await apiClient.get("api/Approval/ApprovalTemplates/current", {
      params,
    });
    if (!res.data) return [];

    const templates = res.data.ApprovalTemplate || res.data.value || res.data;
    if (Array.isArray(templates)) {
      return templates;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export interface SubmitApprovalRequestDto {
  TemplateCode?: number;
  StageCode?: number;
  ApproverUserID?: number;
  IsDraft?: string;
  ObjectEntry?: number;
  ObjectType?: string | number;
  OriginatorID?: number;
  Remarks?: string;
}

export const submitApprovalRequest = async (
  id: number,
  request: SubmitApprovalRequestDto
): Promise<any> => {
  const targetId = Number(id) > 0 ? Number(id) : 0;
  const res = await apiClient.patch(`api/Approval/ApprovalRequests/${targetId}`, request);
  return res.data;
};

export const rejectApprovalRequest = async (id: number, remarks = "Rejected"): Promise<any> => {
  const res = await apiClient.patch(`api/Approval/ApprovalRequests/${id}/reject`, {
    Remarks: remarks,
  });
  return res.data;
};

export const validateDraftChanged = async (
  draftEntry: number,
  documentLines: any[],
  header: Record<string, any>
): Promise<boolean> => {
  try {
    const res = await apiClient.post("api/Approval/ValidateDraftChanged", {
      DraftEntry: draftEntry,
      DocumentLines: documentLines,
      Header: header,
    });
    return Boolean(res.data?.changed ?? res.data?.Changed ?? true);
  } catch {
    return true;
  }
};

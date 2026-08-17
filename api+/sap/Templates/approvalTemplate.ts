import apiClient from "@/lib/apiClient";
import { ApprovalTemplate } from "@/types/template.type";
import { DocumentType } from "@/types/master/DocumentType";

export const getTemplateDocuments = async (): Promise<ApprovalTemplate[]> => {
  const res = await apiClient.get("api/Approval/ApprovalTemplates");
  if (!res.data) return [];
  console.log("Approval Template Data:", res.data.value);
  return res.data as ApprovalTemplate[];
};

export const getApprovalDocumentType = (docType: number | string): string => {
  const numType = Number(docType);
  switch (numType) {
    case DocumentType.Quotation:
      return "atdtQuotation";
    case DocumentType.Order:
      return "atdtOrder";
    case DocumentType.Delivery:
      return "atdtDelivery";
    case DocumentType.ARInvoice:
      return "atdtInvoice";
    case DocumentType.SalesReturn:
      return "atdtReturns";
    case DocumentType.InvTransferReq:
      return "atdtInventoryTransferRequest";
    case DocumentType.InvTransfer:
      return "atdtInventoryTransfer";
    case DocumentType.GoodIssue:
      return "atdtGoodIssue";
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
    console.error("Failed to fetch current user approval templates:", error);
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
  console.log("Submitting approval request:", { id, request });

  // Creation of a NEW request: POST (the backend resolves approvers from the stage).
  // The PATCH fallback only exists for legacy callers passing a real ApprovalRequest id.
  try {
    const res = await apiClient.post("api/Approval/ApprovalRequests", request);
    return res.data;
  } catch (error) {
    console.warn("POST ApprovalRequests failed, falling back to PATCH ApprovalRequests:", error);
    const res = await apiClient.patch(`api/Approval/ApprovalRequests/${id}`, request);
    return res.data;
  }
};

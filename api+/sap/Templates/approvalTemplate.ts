import apiClient from "@/lib/apiClient";
import { ApprovalTemplate } from "@/types/template.type";

export const getTemplateDocuments = async (): Promise<ApprovalTemplate[]> => {
  const res = await apiClient.get("api/Approval/ApprovalTemplates");
  if (!res.data) return [];
  console.log("Approval Template Data:", res.data.value);
  return res.data as ApprovalTemplate[];
};

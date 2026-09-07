import apiClient from "@/lib/apiClient";

export interface AdminSettings {
  NotifyRequester: string;
  notifyRqr: string;
  EnableApprovalProcessInDI: boolean;
  CanUpdateApprovedDocument: boolean;
  CanOriginatorUpdateDraft: boolean;
  CanAuthorizerUpdateDraft: boolean;
  IsApprovalProcessEnabled: boolean | null;
  SendApprovalEmailNotification: boolean | null;
}

let cached: Promise<AdminSettings | null> | null = null;

const fetchAdminSettings = async (): Promise<AdminSettings | null> => {
  try {
    const res = await apiClient.get<AdminSettings>("api/Administration/GetAdminSettings");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch admin settings:", error);
    return null;
  }
};

export const getAdminSettings = async (force = false): Promise<AdminSettings | null> => {
  if (force || !cached) {
    cached = fetchAdminSettings();
  }
  const result = await cached;
  if (result === null) cached = null;
  return result;
};

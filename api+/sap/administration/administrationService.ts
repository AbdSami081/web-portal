import apiClient from "@/lib/apiClient";

export interface AdminSettings {
  NotifyRequester: string;
  notifyRqr: string;
}

export const getAdminSettings = async (): Promise<AdminSettings | null> => {
  try {
    const res = await apiClient.get<AdminSettings>("api/Administration/GetAdminSettings");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch admin settings:", error);
    return null;
  }
};

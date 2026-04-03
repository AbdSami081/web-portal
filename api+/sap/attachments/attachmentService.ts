import apiClient from "@/lib/apiClient";
import { getAccessToken } from "../auth/authService";

export interface AttachmentUploadResponse {
  fileName: string;
  originalName: string;
  objectType: string;
  path: string;
  size: number;
}


export const uploadAttachments = async (
  files: File[],
  objectType: string
): Promise<AttachmentUploadResponse[]> => {
  const formData = new FormData();
  formData.append("objectType", objectType);

  files.forEach((file) => {
    formData.append("files", file);
  });

  const token = getAccessToken();

  const response = await apiClient.post(
    "api/Attachments/upload",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const downloadAttachment = async (filePath: string) => {
  const token = getAccessToken();
  try {
    const res = await apiClient.get(`api/Attachments/display?filePath=${encodeURIComponent(filePath)}`, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch attachment", err);
    return null;
  }
};

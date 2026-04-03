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

  console.log("Uploading attachments:", files.map(f => f.name));
  console.log("token:", token);

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

  console.log("Upload response:", response.data);
  return response.data;
};

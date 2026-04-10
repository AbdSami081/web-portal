import apiClient from "@/lib/apiClient";

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

  const response = await apiClient.post(
    "api/Attachments/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const downloadAttachment = async (filePath: string) => {
  const res = await apiClient.get(`api/Attachments/display?filePath=${encodeURIComponent(filePath)}`, {
    responseType: 'blob',
  });
  return res.data;
};

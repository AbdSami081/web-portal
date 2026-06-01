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

export const mapAttachmentForSap = (att: any) => ({
  FileExtension: att.FileName?.split(".").pop(),
  FileName: att.FileName?.split(".").slice(0, -1).join("."),
  SourcePath: att.SourcePath,
  FreeText: att.FreeText,
  CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
});

export const uploadAndPatchAttachments = async (
  attachments: any[],
  objectType: string,
  docEntry: number,
  patchDocument: (docEntry: number, payload: any) => Promise<any>
) => {
  const newAttachments = attachments.filter((att) => att.File);
  const existingAttachments = attachments.filter((att) => !att.File);

  let uploadedAttachments: any[] = [];

  if (newAttachments.length > 0) {
    const filesToUpload = newAttachments.map((att) => att.File as File);
    const uploadResults = await uploadAttachments(filesToUpload, objectType);

    uploadedAttachments = newAttachments.map((att, index) => ({
      ...att,
      SourcePath: uploadResults[index].path,
    }));
  }

  const processedAttachments = [...existingAttachments, ...uploadedAttachments];

  if (processedAttachments.length > 0) {
    await patchDocument(docEntry, {
      Attachments2_Lines: processedAttachments.map((att) => mapAttachmentForSap(att)),
    });
  }

  return {
    uploadedCount: uploadedAttachments.length,
    processedAttachments,
  };
};

export const downloadAttachment = async (filePath: string) => {
  const res = await apiClient.get(`api/Attachments/display?filePath=${encodeURIComponent(filePath)}`, {
    responseType: 'blob',
  });
  return res.data;
};

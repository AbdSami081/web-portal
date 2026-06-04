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

const splitPath = (path = "") => {
  const BACKSLASH = String.fromCharCode(92);
  const lastSep = Math.max(path.lastIndexOf("/"), path.lastIndexOf(BACKSLASH));

  return {
    folderPath: lastSep > -1 ? path.substring(0, lastSep) : path,
    fileName: lastSep > -1 ? path.substring(lastSep + 1) : "",
  };
};

const splitFileName = (fileName = "") => {
  const lastDot = fileName.lastIndexOf(".");

  return {
    name: lastDot > -1 ? fileName.substring(0, lastDot) : fileName,
    extension: lastDot > -1 ? fileName.substring(lastDot + 1) : "",
  };
};

export const mapAttachmentForSap = (att: any) => {
  const sourcePath = att.SourcePath || "";
  const { folderPath, fileName: fileNameFromPath } = splitPath(sourcePath);
  const sourcePathHasFile = fileNameFromPath.includes(".");
  const fileWithExtension = sourcePathHasFile ? fileNameFromPath : (att.FileName || "");
  const { name, extension } = splitFileName(fileWithExtension);

  return {
    FileName: name,
    FileExtension: extension,
    SourcePath: sourcePathHasFile ? folderPath : (sourcePath || process.env.NEXT_PUBLIC_ATTACHMENT_SOURCE_PATH || ""),
    FreeText: att.FreeText || "",
    CopyToTargetDoc: att.CopyToTarget ? "tYES" : "tNO",
  };
};

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
      FileName: uploadResults[index].fileName || uploadResults[index].originalName || att.FileName,
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

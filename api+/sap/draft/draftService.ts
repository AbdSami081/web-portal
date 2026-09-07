import apiClient from "@/lib/apiClient";

export interface SaveDraftToDocumentPayload {
  Document: {
    DocEntry: number;
    DocDueDate?: string;
  };
}

export const SaveDraftToDocument = async (payload: SaveDraftToDocumentPayload | any): Promise<any | null> => {
  const res = await apiClient.post(`api/Draft/SaveDraftToDocument`, payload);
  if (!res.data) return null;
  return res.data;
};

export const saveDraftToDocument = SaveDraftToDocument;

export const getDraftDocument = async (draftID: number): Promise<any | null> => {
  const res = await apiClient.get(`api/Draft/Drafts/${draftID}`);
  if (!res.data) return null;
  return res.data;
};

export const findDraftByNumber = async (
  docNum: number,
  objectType?: number | string
): Promise<any | null> => {
  try {
    const params: Record<string, any> = { docNum };
    if (objectType !== undefined && objectType !== null && `${objectType}` !== "") {
      params.objectType = objectType;
    }
    const res = await apiClient.get(`api/Draft/Drafts`, { params });
    return res.data || null;
  } catch {
    return null;
  }
};

export const patchDraftDocument = async (draftID: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Draft/Drafts/${draftID}`, payload);
  if (!res.data) return null;
  return res.data;
};
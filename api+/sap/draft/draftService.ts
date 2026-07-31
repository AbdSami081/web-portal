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
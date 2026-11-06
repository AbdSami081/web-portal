import apiClient from "@/lib/apiClient";

export interface SaveDraftToDocumentPayload {
  Document: {
    DocEntry: number;
    DocDueDate?: string;
    DocObjectCode?: string;
    RequriedDate?: string;
  };
}

/** Service Layer treats extra document fields as a draft update before posting; omit them when converting an approved draft unchanged. */
export function buildSaveDraftToDocumentPayload(draftEntry: number, requiredDate?: string): SaveDraftToDocumentPayload {
  return {
    Document: {
      DocEntry: draftEntry,
      ...(requiredDate && { RequriedDate: requiredDate }),
    },
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
  if (typeof res.data === "string") {
    try {
      return JSON.parse(res.data);
    } catch {
      return null;
    }
  }
  return res.data;
};

export const getPostedDocumentForDraft = async (
  draftId: number
): Promise<{ docEntry: number } | null> => {
  if (!draftId || draftId <= 0) return null;
  const res = await apiClient.get(`api/Draft/PostedDocument/${draftId}`);
  const docEntry = Number(res.data?.docEntry ?? res.data?.DocEntry ?? 0);
  return Number.isFinite(docEntry) && docEntry > 0 ? { docEntry } : null;
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
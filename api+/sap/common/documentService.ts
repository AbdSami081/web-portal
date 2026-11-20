import apiClient from "@/lib/apiClient";

const unwrapDocumentsResponse = (responseData: unknown): any[] => {
  const parsed = typeof responseData === "string" ? JSON.parse(responseData) : responseData;
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.value)) return record.value;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.items)) return record.items;
  }
  return [];
};

export const getAllDrafts = async (): Promise<any[]> => {
  const response = await apiClient.get("api/Documents/getAll/drafts", {
    params: { resourceName: "drafts", skip: 0, top: 20 },
  });
  return unwrapDocumentsResponse(response.data);
};

export const getAllDraftDocs = async (): Promise<any[]> => {
  const response = await apiClient.get("api/Documents/getAll/draftsdocs");
  return unwrapDocumentsResponse(response.data);
};

export const getDraftDocument = async (docEntry: number): Promise<any | null> => {
  const response = await apiClient.get(`api/Documents/drafts/${docEntry}`);
  const parsed = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
  return parsed && typeof parsed === "object" ? parsed : null;
};

export const getDocumentsList = async (
  resourceName: string,
  skip: number = 0,
  top: number = 20,
  search?: string
): Promise<any[]> => {
  try {
    const trimmedSearch = search?.trim();

    const res = await apiClient.get(
      `api/Documents/getAll/${resourceName}`,
      { params: { skip, top, search: trimmedSearch || undefined } }
    );

    const raw = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

    const data = raw.value ?? [];

    (data as any).hasMore = raw.hasMore ?? false;

    return data;
  } catch (error: any) {
    console.error("Get Documents List Error:", error?.response?.data || error);
    throw error;
  }
};

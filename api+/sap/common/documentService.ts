import apiClient from "@/lib/apiClient";

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
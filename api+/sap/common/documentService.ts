import apiClient from "@/lib/apiClient";

export const getDocumentsList = async (
  resourceName: string,
  skip: number = 0,
  top: number = 20
): Promise<any[]> => {
  try {
    const res = await apiClient.get(
      `api/Documents/getAll/${resourceName}`,
      { params: { skip, top } }
    );

    const raw = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

    const data = raw.value ?? [];

    // extra property attach ki hai, array ka behavior/return type same rehta hai
    (data as any).hasMore = raw.hasMore ?? false;

    return data;
  } catch (error) {
    console.error("Get Documents List Error:", error);
    throw error;
  }
};
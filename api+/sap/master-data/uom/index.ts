import apiClient from "@/lib/apiClient";

export async function getUOMs(): Promise<{ AbsEntry: number; Code: string; Name: string }[]> {
  try {
    const res = await apiClient.get(`api/Master/GetUnitOfMeasurments`);

    const data = res?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.value)) return data.value;

    return [];
  } catch (error) {
    console.error("Failed to fetch UoMs:", error);
    return [];
  }
}
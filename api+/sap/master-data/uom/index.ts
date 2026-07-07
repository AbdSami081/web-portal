import { cachedGet } from "@/lib/apiClient";

export async function getUOMs(): Promise<{ AbsEntry: number; Code: string; Name: string }[]> {
  try {
    const data = await cachedGet<any>(`api/Master/GetUnitOfMeasurments`, { timeout: 10000 });

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.value)) return data.value;

    return [];
  } catch (error) {
    console.error("Failed to fetch UoMs:", error);
    return [];
  }
}
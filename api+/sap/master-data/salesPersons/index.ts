import { cachedGet } from "@/lib/apiClient";

export async function getSalesPersons(): Promise<{ SalesEmployeeCode: number; SalesEmployeeName: string }[]> {
  try {
    const data = await cachedGet<any>(`api/Master/GetSalesPersons`, { timeout: 10000 });

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.value)) return data.value;

    return [];
  } catch (error) {
    console.error("Failed to fetch Sales Persons:", error);
    return [];
  }
}

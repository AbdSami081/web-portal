import { MasterDataService } from "@/lib/sap/service_layer/masterDataService";

export async function getUOMs(): Promise<{ AbsEntry: number; Code: string; Name: string }[]> {
  try {
    const data = await MasterDataService.getUOMs();
    return data || [];
  } catch (error) {
    console.error("Failed to fetch UoMs:", error);
    return [];
  }
}

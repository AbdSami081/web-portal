import { BaseProductionDocument } from "@/types/production/PRDDoc.type";
import apiClient from "@/lib/apiClient";

export const getBOMList = async (): Promise<any[]> => {
  try {
    const res = await apiClient.get(`api/Sales/GetBOMForProduction`);
    return res.data?.value || [];
  } catch (err) {
    console.error("Failed to fetch BOM list", err);
    return [];
  }
};

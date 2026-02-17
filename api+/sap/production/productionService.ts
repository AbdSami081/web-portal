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

export const postProductionOrder = async (data: any): Promise<any> => {
  try {
    const res = await apiClient.post(`api/Sales/Production`, data);
    return res.data;
  } catch (err) {
    console.error("Failed to post production order", err);
    throw err;
  }
};

import { getSapErrorMessage } from "@/lib/errorHelper";
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
  } catch (err: any) {
    console.error("Failed to post production order", err);
    throw new Error(getSapErrorMessage(err) || "Failed to post production order");
  }
};

export const patchProductionOrder = async (docEntry: number, payload: any): Promise<any> => {
  try {
    const res = await apiClient.patch(`api/Sales/Production/${docEntry}`, payload);
    return res.data;
  } catch (err: any) {
    console.error("Failed to patch production order", err);
    throw new Error(getSapErrorMessage(err) || "Failed to patch production order");
  }
};

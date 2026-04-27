import apiClient from "@/lib/apiClient";
import { VatGroup } from "@/types/sales/VatGroups.type";

export const getVatGroups = async (): Promise<VatGroup[]> => {
  try {
    const res = await apiClient.get(`api/Master/GetVatGroups`);
    const data = res.data?.value || res.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching VAT groups:", error);
    return [];
  }
};

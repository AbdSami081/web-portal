
import apiClient from "@/lib/apiClient";
import { Warehouse } from "@/types/warehouse/warehouse";

export const getwarehouses = async (): Promise<Warehouse[]> => {
  try {
    const res = await apiClient.get(`api/Sales/GetWarehouse`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Failed to fetch warehouse", err);
    return [];
  }
};


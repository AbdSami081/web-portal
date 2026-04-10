
import apiClient from "@/lib/apiClient";
import { Warehouse } from "@/types/warehouse/warehouse";

export const getwarehouses = async (): Promise<Warehouse[]> => {
  const res = await apiClient.get(`api/Master/GetWarehouse`);
  return Array.isArray(res.data) ? res.data : [];
};


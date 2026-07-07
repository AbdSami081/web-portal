import { cachedGet } from "@/lib/apiClient";
import { Warehouse } from "@/types/warehouse/warehouse";

export const getwarehouses = async (): Promise<Warehouse[]> => {
  const data = await cachedGet<Warehouse[]>(`api/Master/GetWarehouse`, {
    timeout: 10000,
  });
  return Array.isArray(data) ? data : [];
};


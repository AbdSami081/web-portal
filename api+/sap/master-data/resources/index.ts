import apiClient from "@/lib/apiClient";
import { Item } from "@/types/sales/Item.type";

export const getResourcesList = async (): Promise<Item[]> => {
  const res = await apiClient.get(`api/Master/GetResources`);

  return Array.isArray(res.data.value) ? res.data.value : [];
};

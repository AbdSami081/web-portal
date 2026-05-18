import apiClient from "@/lib/apiClient";

export interface FreightType {
  Code?: string;
  Name?: string;
  // Adjust based on actual API response
  [key: string]: any;
}

export interface FreightWithCharges {
  Code?: string;
  Name?: string;
  Category?: string;
  [key: string]: any;
}

export interface VatGroup {
  Code?: string;
  Name?: string;
  [key: string]: any;
}

export const getFreightTypes = async (): Promise<FreightType[]> => {
  try {
    const res = await apiClient.get(`api/Master/GetFrieghtTypes`);
    const data = res.data?.value || res.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching freight types:", error);
    return [];
  }
};

export const fetchFreightWithCharges = async (category: string = ""): Promise<FreightWithCharges[]> => {
  try {
    const res = await apiClient.get(`api/Master/FetchFreightWithCharges`, {
      params: { category }
    });
    const data = res.data?.value || res.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching freight with charges:", error);
    return [];
  }
};

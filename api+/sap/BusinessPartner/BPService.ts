import apiClient from "@/lib/apiClient";

export const saveBusinessPartner = async (payload: any) => {
  try {
    const res = await apiClient.post(
      "api/BusinessPartner/BusinessPartners",
      payload
    );

    return res.data;
  } catch (error) {
    console.error("Save Business Partner Error:", error);
    throw error;
  }
};

export interface BusinessPartnerCategory {
  Code: string;
  Name: string;
}

export const getBusinessPartnerCategories = async (): Promise<BusinessPartnerCategory[]> => {
  try {
    const res = await apiClient.get("api/Master/GetBusinessPartnerCategories");

    const data =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    return Array.isArray(data)
      ? data
      : Array.isArray(data.value)
      ? data.value
      : [];
  } catch (error) {
    console.error("Get Business Partner Categories Error:", error);
    throw error;
  }
};

export interface BusinessPartnerGroup {
  Code: number;
  Name: string;
}

export const getBusinessPartnerGroups = async (): Promise<BusinessPartnerGroup[]> => {
  try {
    const res = await apiClient.get("api/Master/GetBusinessPartnerGroups");

    const data =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.data)) return data.data;

    return [];
  } catch (error) {
    console.error("Get Business Partner Groups Error:", error);
    throw error;
  }
};

export interface Currency {
  Code: string;
  Name: string;
}

export const getCurrencies = async (): Promise<Currency[]> => {
  try {
    const res = await apiClient.get("api/Master/GetCurrencies");

    const data =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.data)) return data.data;

    return [];
  } catch (error) {
    console.error("Get Currencies Error:", error);
    throw error;
  }
};

export interface BusinessPartnerProject {
  Code: string;
  Name: string;
  ValidFrom: string;
  ValidTo: string;
  Active: string;
}

export const getBusinessPartnerProjects = async (): Promise<BusinessPartnerProject[]> => {
  try {
    const res = await apiClient.get("api/Master/GetBusinessPartnerProjects");

    const data =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.data)) return data.data;

    return [];
  } catch (error) {
    console.error("Get Business Partner Projects Error:", error);
    throw error;
  }
};

export interface Industry {
  IndustryCode: number;
  IndustryName: string;
  IndustryDescription: string;
}

export const getIndustries = async (): Promise<Industry[]> => {
  try {
    const res = await apiClient.get("api/Master/GetIndustries");

    const data =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.data)) return data.data;

    return [];
  } catch (error) {
    console.error("Get Industries Error:", error);
    throw error;
  }
};

export interface BusinessPartnerType {
  Code: string;
  Name: string;
}
export const getBusinessPartnerTypes = async (): Promise<BusinessPartnerType[]> => {
  try {
    const res = await apiClient.get("api/Master/GetBusinessPartnerTypes");

    const data =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.data)) return data.data;

    return [];
  } catch (error) {
    console.error("Get Business Partner Types Error:", error);
    throw error;
  }
};

export interface ShippingType {
  Code: number;
  Name: string;
  Website: string | null;
}
export const getShippingTypes = async (): Promise<ShippingType[]> => {
  try {
    const res = await apiClient.get("api/Master/GetShippingTypesList");

    const data =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.data)) return data.data;

    return [];
  } catch (error) {
    console.error("Get Shipping Types Error:", error);
    throw error;
  }
};

export interface FactoringIndicator {
  IndicatorCode: string;
  IndicatorName: string;
}
export const getFactoringIndicators = async (): Promise<FactoringIndicator[]> => {
  try {
    const res = await apiClient.get("api/Master/GetFactoringIndicators");

    const data =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.data)) return data.data;

    return [];
  } catch (error) {
    console.error("Get Factoring Indicators Error:", error);
    throw error;
  }
};
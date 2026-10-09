import apiClient from "@/lib/apiClient";

export interface SapDimension {
  DimensionCode: number;
  DimensionName: string;
  IsActive: string;
  DimensionDescription: string;
}

export const getActiveDimensions = async (): Promise<SapDimension[]> => {
  try {
    const res = await apiClient.get("api/Master/GetActiveDimensions");

    const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

    const raw = Array.isArray(data)
      ? data
      : Array.isArray(data.value)
      ? data.value
      : [];

    return raw.filter((d: SapDimension) => d.IsActive === "tYES");
  } catch (error) {
    console.error("Get Active Dimensions Error:", error);
    return [];
  }
};

export interface DistributionRule {
  Code: string;
  Name: string;
}

export const getDistributionRules = async (dimension: number): Promise<DistributionRule[]> => {
  try {
    const res = await apiClient.get(`api/Master/GetDistributionRules?dimension=${dimension}`);

    const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

    const raw = Array.isArray(data)
      ? data
      : Array.isArray(data.value)
      ? data.value
      : [];

    return raw.map((r: any) => ({
      Code: r.FactorCode,
      Name: r.FactorDescription || r.FactorCode,
    }));
  } catch (error) {
    console.error("Get Distribution Rules Error:", error);
    return [];
  }
};

const distributionRulesCache = new Map<number, Promise<DistributionRule[]>>();

export const getDistributionRulesCached = (dimension: number): Promise<DistributionRule[]> => {
  let cached = distributionRulesCache.get(dimension);
  if (!cached) {
    cached = getDistributionRules(dimension);
    distributionRulesCache.set(dimension, cached);
  }
  return cached;
};

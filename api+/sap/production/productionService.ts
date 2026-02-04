import { BaseProductionDocument } from "@/types/production/PRDDoc.type";
import apiClient from "@/lib/apiClient";

export const getPRDOrder = async (baseRef: number): Promise<BaseProductionDocument | null> => {
  try {
    const res = await apiClient.get(`ProductionOrders(${baseRef})`);

    if (!res.data) return null;

    const doc: BaseProductionDocument = {
      ...res.data,
      PRDOrderLines: (res.data.ProductionOrderLines || []).map((line: any) => ({
        ...line,
      })),
    };

    return doc;
  } catch (err) {
    console.error("Failed to fetch sales document", err);
    return null;
  }
};

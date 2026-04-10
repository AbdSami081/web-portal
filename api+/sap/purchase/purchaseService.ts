import apiClient from "@/lib/apiClient";

export const postPurchaseOrder = async (data: any): Promise<any> => {
    const res = await apiClient.post(`api/PurchaseOrder`, data);
    return res.data;
};

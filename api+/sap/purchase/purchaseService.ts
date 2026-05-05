import apiClient from "@/lib/apiClient";

export const postPurchaseOrder = async (data: any): Promise<any> => {
    const res = await apiClient.post(`api/PurchaseOrder`, data);
    return res.data;
};

export const postPurchaseRequest = async (data: any): Promise<any> => {
    // Assuming backend endpoint is /api/PurchaseRequest
    const res = await apiClient.post(`api/PurchaseRequest`, data);
    return res.data;
};

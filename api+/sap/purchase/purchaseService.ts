import apiClient from "@/lib/apiClient";

export const postPurchaseOrder = async (data: any): Promise<any> => {
    try {
        const res = await apiClient.post(`api/PurchaseOrder`, data);
        return res.data;
    } catch (err) {
        console.error("Failed to post purchase order", err);
        throw err;
    }
};

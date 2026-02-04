import apiClient from "@/lib/apiClient";

export interface InventoryTransferLine {
    ItemCode: string;
    Quantity: number;
    UnitPrice?: number;
    WarehouseCode?: string;
    FromWarehouseCode?: string;
    BaseType?: number;
    BaseEntry?: number;
    BaseLine?: number;
}

export interface InventoryTransferPayload {
    CardCode: string;
    FromWarehouse?: string;
    ToWarehouse?: string;
    Comments?: string;
    JournalMemo?: string;
    StockTransferLines: InventoryTransferLine[];
}

export const postInventoryTransferRequest = async (payload: InventoryTransferPayload) => {
    try {

        const response = await apiClient.post("api/Sales/InventoryTransferRequest", payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.Message || error.response?.data?.detail || "Failed to post inventory transfer request");
    }
};

export const postInventoryTransfer = async (payload: InventoryTransferPayload) => {
    try {

        const response = await apiClient.post("api/Sales/InventoryTransfer", payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.Message || error.response?.data?.detail || "Failed to post inventory transfer request");
    }
};

export const getInventoryTransferRequest = async (docNum: number) => {
    try {
        const response = await apiClient.get(`api/Sales/InventoryTransferRequest?docNum=${docNum}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.Message || error.response?.data?.detail || "Failed to fetch inventory transfer request");
    }
};

export const getInventoryTransfer = async (docNum: number) => {
    try {
        const response = await apiClient.get(`api/Sales/InventoryTransfer?docNum=${docNum}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.Message || error.response?.data?.detail || "Failed to fetch inventory transfer");
    }
};

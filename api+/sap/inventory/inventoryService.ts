import apiClient from "@/lib/apiClient";
import { getSapErrorMessage } from "@/lib/errorHelper";

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
    Attachments2_Lines?: any[];
}

export const postInventoryTransferRequest = async (payload: InventoryTransferPayload) => {
    try {

        const response = await apiClient.post("api/Sales/InventoryTransferRequest", payload);
        return response.data;
    } catch (error: any) {
        throw new Error(getSapErrorMessage(error) || "Failed to post inventory transfer");
    }
};

export const postInventoryTransfer = async (payload: InventoryTransferPayload) => {
    try {

        const response = await apiClient.post("api/Sales/InventoryTransfer", payload);
        return response.data;
    } catch (error: any) {
        throw new Error(getSapErrorMessage(error) || "Failed to post inventory transfer");
    }
};

export const getInventoryTransferRequest = async (docNum: number) => {
    try {
        const response = await apiClient.get(`api/Sales/InventoryTransferRequest?docNum=${docNum}`);
        return response.data;
    } catch (error: any) {
        throw new Error(getSapErrorMessage(error) || "Failed to fetch inventory transfer request");
    }
};

export const getInventoryTransfer = async (docNum: number) => {
    try {
        const response = await apiClient.get(`api/Sales/InventoryTransfer?docNum=${docNum}`);
        return response.data;
    } catch (error: any) {
        throw new Error(getSapErrorMessage(error) || "Failed to fetch inventory transfer");
    }
};

export const getInventoryTransferRequestList = async () => {
    try {
        const response = await apiClient.get(`api/Sales/InventoryTransferRequestList`);
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        return data.value || [];
    } catch (error: any) {
        throw new Error(getSapErrorMessage(error) || "Failed to fetch inventory transfer requests");
    }
};
export const patchInventoryTransferRequest = async (docEntry: number, payload: any) => {
    try {
        const response = await apiClient.patch(`api/Sales/InventoryTransferRequest/${docEntry}`, payload);
        return response.data;
    } catch (error: any) {
        throw new Error(getSapErrorMessage(error) || "Failed to patch inventory transfer request");
    }
};

export const patchInventoryTransfer = async (docEntry: number, payload: any) => {
    try {
        const response = await apiClient.patch(`api/Sales/InventoryTransfer/${docEntry}`, payload);
        return response.data;
    } catch (error: any) {
        throw new Error(getSapErrorMessage(error) || "Failed to patch inventory transfer");
    }
};

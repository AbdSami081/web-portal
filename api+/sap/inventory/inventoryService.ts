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
    const response = await apiClient.post("api/Inventory/InventoryTransferRequest", payload);
    return response.data;
};

export const postInventoryTransfer = async (payload: InventoryTransferPayload) => {
    const response = await apiClient.post("api/Inventory/InventoryTransfer", payload);
    return response.data;
};

export const getInventoryTransferRequest = async (docNum: number) => {
    const response = await apiClient.get(`api/Inventory/InventoryTransferRequest?docNum=${docNum}`);
    return response.data;
};

export const getInventoryTransfer = async (docNum: number) => {
    const response = await apiClient.get(`api/Inventory/InventoryTransfer?docNum=${docNum}`);
    return response.data;
};

export const getInventoryTransferRequestList = async () => {
    const response = await apiClient.get(`api/Inventory/InventoryTransferRequestList`);
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    return data.value || [];
};

export const patchInventoryTransferRequest = async (docEntry: number, payload: any) => {
    const response = await apiClient.patch(`api/Inventory/InventoryTransferRequest/${docEntry}`, payload);
    return response.data;
};

export const patchInventoryTransfer = async (docEntry: number, payload: any) => {
    const response = await apiClient.patch(`api/Inventory/InventoryTransfer/${docEntry}`, payload);
    return response.data;
};

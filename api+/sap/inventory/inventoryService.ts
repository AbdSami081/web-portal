import apiClient from "@/lib/apiClient";
import { getSapErrorMessage } from "@/lib/errorHelper";

export interface InventoryTransferLine {
    ItemCode: string;
    Quantity: number;
    UnitPrice?: number;
    UoMCode?: string;
    MeasureUnit?: string;
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

export const getInventoryTransferRequestList = async (
    skip: number = 0,
    top: number = 20,
    search: string = ""
) => {
    const params = new URLSearchParams();
    params.set("skip", String(skip));
    params.set("top", String(top));
    if (search) params.set("search", search);
    const response = await apiClient.get(`api/Inventory/InventoryTransferRequestList?${params.toString()}`);
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    const list = data.value || [];
    const hasMore = !!data["@odata.nextLink"] || list.length >= top;
    return {
        value: list,
        hasMore: hasMore
    };
};

export const patchInventoryTransferRequest = async (docEntry: number, payload: any) => {
    const response = await apiClient.patch(`api/Inventory/InventoryTransferRequest/${docEntry}`, payload);
    return response.data;
};

export const patchInventoryTransfer = async (docEntry: number, payload: any) => {
    const response = await apiClient.patch(`api/Inventory/InventoryTransfer/${docEntry}`, payload);
    return response.data;
};

export const getSerialsByItemCodes = async (itemCodes: string[]) => {
    const response = await apiClient.get(`api/Inventory/items/stock/ManageBySerials?itemCodes=${itemCodes.join(',')}`);
    return response.data;
};

export const getBatchesByItemCodes = async (itemCodes: string[]) => {
    const response = await apiClient.get(`api/Inventory/items/stock/ManageByBatches?itemCodes=${itemCodes.join(',')}`);
    return response.data;
};

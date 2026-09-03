import apiClient from "@/lib/apiClient";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { withDefaultBPLId } from "@/lib/sap/helpers/documentPayloadHelper";

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

export interface GoodIssuePayload {
    Comments?: string;
    JournalMemo?: string;
    DocumentLines: InventoryTransferLine[];
    Attachments2_Lines?: any[];
}

export const postInventoryTransferRequest = async (payload: InventoryTransferPayload) => {
    const response = await apiClient.post("api/Inventory/InventoryTransferRequest", payload);
    return response.data;
};

export const postInventoryTransfer = async (payload: any) => {
    const response = await apiClient.post("api/Inventory/InventoryTransfer", withDefaultBPLId(payload));
    return response.data;
};

export const postGoodIssue = async (payload: any) => {
    const response = await apiClient.post("api/Inventory/GoodIssue", withDefaultBPLId(payload));
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

export const getGoodIssue = async (docNum: number) => {
    const response = await apiClient.get(`api/Inventory/GoodIssue?docNum=${docNum}`);
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

export const getGoodIssueList = async (skip = 0, top = 20, search = "") => {
    const response = await apiClient.get(`api/Inventory/GoodIssueList`, {
        params: { skip, top, search: search || undefined },
    });
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    const list = data.value || [];
    const hasMore = !!data["@odata.nextLink"] || list.length >= top;
    return { value: list, hasMore };
};

export const patchInventoryTransferRequest = async (docEntry: number, payload: any) => {
    const response = await apiClient.patch(`api/Inventory/InventoryTransferRequest/${docEntry}`, payload);
    return response.data;
};

export const patchInventoryTransfer = async (docEntry: number, payload: any) => {
    const response = await apiClient.patch(`api/Inventory/InventoryTransfer/${docEntry}`, payload);
    return response.data;
};

export const patchGoodIssue = async (docEntry: number, payload: any) => {
    const response = await apiClient.patch(`api/Inventory/GoodIssue/${docEntry}`, payload);
    return response.data;
};

// Close functions
export const closeInventoryTransferRequest = async (docEntry: number): Promise<any | null> => {
    const response = await apiClient.post(`api/Inventory/InventoryTransferRequest/${docEntry}/Close`);
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

export interface DocumentBatchAllocation {
    LineNum: number;
    ItemCode: string;
    BatchNumber: string;
    Quantity: number;
}
export interface DocumentSerialAllocation {
    LineNum: number;
    ItemCode: string;
    SerialNumber: string;
    InternalSerialNumber?: string;
    SystemNumber?: number;
}

/**
 * Batch & serial numbers already allocated to a saved document's lines
 * (read straight from IBT1 / SRI1). Used to pre-fill the selection modals when
 * an existing document is re-opened — the Service Layer GET does not reliably
 * return line-level SerialNumbers/BatchNumbers.
 */
export const getDocumentSerialBatchAllocations = async (
    docType: number,
    docEntry: number
): Promise<{ batches: DocumentBatchAllocation[]; serials: DocumentSerialAllocation[] }> => {
    if (!docType || !docEntry) return { batches: [], serials: [] };
    try {
        const res = await apiClient.get(
            `api/Inventory/DocumentSerialBatch?docType=${docType}&docEntry=${docEntry}`
        );
        const d = res.data || {};
        return {
            batches: Array.isArray(d.batches ?? d.Batches) ? (d.batches ?? d.Batches) : [],
            serials: Array.isArray(d.serials ?? d.Serials) ? (d.serials ?? d.Serials) : [],
        };
    } catch {
        return { batches: [], serials: [] };
    }
};

export const getItemMasterDataDocument = async (
  itemCode: string
): Promise<any[] | null> => {
  const normalizedCode = itemCode?.trim();

  if (!normalizedCode) {
    return [];
  }

  const response = await apiClient.get("api/ItemMaster/Items", {
    params: {
      itemCode: normalizedCode,
    },
  });

  return response.data ?? [];
};

export const updateItemMasterData = async (
  itemCode: string,
  payload: Record<string, any>,
): Promise<any | null> => {
  const normalizedCode = itemCode?.trim();

  if (!normalizedCode) {
    throw new Error("Item code is required to update Item Master Data.");
  }

  const cleanPayload = Object.fromEntries(
    Object.entries(payload ?? {}).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        !(typeof value === "string" && value.trim() === "")
    )
  );

  delete cleanPayload.ItemCode;

  const escapedCode = normalizedCode.replace(/'/g, "''");
  const endpoint = `api/ItemMaster/Items('${escapedCode}')`;

  try {
    const res = await apiClient.patch(endpoint, cleanPayload);
    return res.data ?? null;
  } catch (error: any) {
    const status = error?.response?.status;

    if (status === 400 || status === 404 || status === 405) {
      throw new Error(
        error?.response?.data?.error?.message?.value ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update item master data."
      );
    }
    throw error;
  }
};
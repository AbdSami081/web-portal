import { getSapErrorMessage } from "@/lib/errorHelper";
import apiClient from "@/lib/apiClient";
import { DocumentType } from "@/types/master/DocumentType";
import { withDefaultBPLId } from "@/lib/sap/helpers/documentPayloadHelper";

export const getBOMList = async (isMultiBom: boolean = false, search: string = "", skip: number = 0, top: number = 100): Promise<any[]> => {
  const res = await apiClient.get(`api/Production/GetBOMForProduction?isMultiBom=${isMultiBom}&search=${search}&skip=${skip}&top=${top}`);
  const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  return data?.value || (Array.isArray(data) ? data : []);
};

export const postProductionOrder = async (data: any): Promise<any> => {
  // No withDefaultBPLId here: SAP's ProductionOrders object has no BPL_IDAssignedToInvoice
  // property at all (confirmed live — "Property 'BPL_IDAssignedToInvoice' of 'ProductionOrder'
  // is invalid"), unlike every other document type. Its branch is implicit from the Warehouse.
  const res = await apiClient.post(`api/Production/Production`, data);
  return res.data;
};

export const patchProductionOrder = async (docEntry: number, payload: any): Promise<any> => {
  const res = await apiClient.patch(`api/Production/Production/${docEntry}`, payload);
  return res.data;
};

export const getReleasedProductionOrders = async (skip: number = 0, docType?: number): Promise<any[]> => {
  const url = `api/Production/GetReleasedProductionOrders?skip=${skip}${docType ? `&docType=${docType}` : ''}`;
  const res = await apiClient.get(url);
  const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  return data?.value || (Array.isArray(data) ? data : []);
};

export const getDisassembleProductionOrders = async (skip: number = 0, top: number = 20): Promise<any[]> => {
  const res = await apiClient.get(`api/Production/GetDisassembleProductionOrders?skip=${skip}&top=${top}`);
  const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  return data?.value || (Array.isArray(data) ? data : []);
};

export const postIssueForProduction = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Production/IssueForProduction`, withDefaultBPLId(data));
  return res.data;
};

export const postReceiptFromProduction = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Production/ReceiptForProduction`, withDefaultBPLId(data));
  return res.data;
};

export const patchIssueForProduction = async (docEntry: number, payload: any): Promise<any> => {
  const res = await apiClient.patch(`api/Production/IssueForProduction/${docEntry}`, payload);
  return res.data;
};

export const patchReceiptFromProduction = async (docEntry: number, payload: any): Promise<any> => {
  const res = await apiClient.patch(`api/Production/ReceiptForProduction/${docEntry}`, payload);
  return res.data;
};

// Close functions
export const closeProductionOrder = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Production/Production/${docEntry}/Close`);
  return res.data;
};

export const closeIssueForProduction = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Production/IssueForProduction/${docEntry}/Close`);
  return res.data;
};

export const closeReceiptForProduction = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Production/ReceiptForProduction/${docEntry}/Close`);
  return res.data;
};

const mapAttachment = (att: any) => {
  const sourcePath = att.SourcePath || "";
  const storedFileName = att.FileName || "";

  const BACKSLASH = String.fromCharCode(92);
  const lastSep = Math.max(sourcePath.lastIndexOf("/"), sourcePath.lastIndexOf(BACKSLASH));
  const fileInPath = lastSep > -1 ? sourcePath.substring(lastSep + 1) : "";
  const folderPath = lastSep > -1 ? sourcePath.substring(0, lastSep) : sourcePath;

  const fileWithExt = (fileInPath && fileInPath.includes(".")) ? fileInPath : storedFileName;

  const lastDot = fileWithExt.lastIndexOf(".");
  const baseName = lastDot > -1 ? fileWithExt.substring(0, lastDot) : fileWithExt;
  const ext = lastDot > -1 ? fileWithExt.substring(lastDot + 1) : "";

  return {
    FileName: baseName,
    FileExtension: ext,
    SourcePath: folderPath,
    FreeText: att.FreeText || "",
  };
};

const mapProductionOrderLine = (line: any, data: any, includeLineNumber = false) => {
  const linePayload: any = {
    ItemNo: line.ItemNo,
    BaseQuantity: line.BaseQuantity ?? 0,
    PlannedQuantity: line.PlannedQuantity ?? 0,
    IssuedQuantity: line.IssuedQuantity ?? 0,
    ProductionOrderIssueType: line.ProductionOrderIssueType || "im_Manual",
    Warehouse: line.Warehouse || data.Warehouse,
    ItemType: line.ItemType,
  };

  if (includeLineNumber && line.LineNumber !== undefined && line.LineNumber !== null) {
    linePayload.LineNumber = line.LineNumber;
  }

  return linePayload;
};

export const saveProductionDocument = async (docType: DocumentType, data: any, lines: any[], attachments: any[]): Promise<any> => {
  if (docType === DocumentType.ProductionOrder) {
    // SAP's ProductionOrders object has no BPL_IDAssignedToInvoice (or BPLID) property at
    // all — confirmed live ("Property '...' of 'ProductionOrder' is invalid" either way).
    // Its branch is implicit from the Warehouse selected, unlike Issue/Receipt for
    // Production below (InventoryGenExits/InventoryGenEntries), which do support it.
    const payload: any = {
      ItemNo: data.ItemNo,
      Remarks: data.Remarks || data.Comments,
      ProductionOrderStatus: data.ProductionOrderStatus || "boposPlanned",
    };

    if (attachments.length > 0) {
      payload.Attachments2_Lines = attachments.map((att) => mapAttachment(att));
    }

    if (data.AbsoluteEntry && data.AbsoluteEntry > 0) {
      payload.ProductionOrderLines = lines.map(line => mapProductionOrderLine(line, data, true));
      return await patchProductionOrder(data.AbsoluteEntry, payload);
    } else {
      payload.ItemNo = data.ItemNo;
      payload.PlannedQuantity = data.PlannedQuantity;
      payload.PostingDate = data.PostingDate || data.CreationDate || data.DocDate;
      payload.StartDate = data.StartDate;
      payload.DueDate = data.DueDate;
      payload.Warehouse = data.Warehouse;
      payload.Priority = data.Priority;
      payload.ProductionOrderType = data.ProductionOrderType || "bopotStandard";
      payload.PickRemarks = data.PickRmrk || "Created via Web Portal";
      payload.ProductionOrderLines = lines.map(line => mapProductionOrderLine(line, data));

      console.log(payload);            
      return await postProductionOrder(payload);
    }
  } else if (docType === DocumentType.IssueForProduction || docType === DocumentType.ReceiptFromProduction) {
    const isUpdate = !!(data.DocEntry && data.DocEntry > 0);
    const payload: any = {
      Comments: data.Comments || data.Remarks,
      JournalMemo: data.JournalMemo,
      BPL_IDAssignedToInvoice: data.BPL_IDAssignedToInvoice,
      // Both document types post real stock movement on Add, so SAP locks line
      // Quantity afterward — resending it (even unchanged) fails the same way as
      // Delivery does ("Incorrect 'Qty (Inventory UoM)' in line ..."). Omit
      // DocumentLines entirely on update; only header remarks are safe to patch.
      ...(!isUpdate && {
        DocumentLines: lines.map(line => ({
          Quantity: line.PlannedQuantity,
          WarehouseCode: line.Warehouse,
          ItemCode: line.OrderNumber ? undefined : (line.ItemNo || line.ItemCode),
          BaseType: line.OrderNumber ? 202 : undefined,
          BaseEntry: line.OrderNumber,
          BaseLine: (line.OrderNumber && line.LineNumber === -1) ? undefined : line.LineNumber,
        })),
      }),
    };

    if (attachments.length > 0) {
      payload.Attachments2_Lines = attachments.map(att => mapAttachment(att));
    }

    if (data.DocEntry && data.DocEntry > 0) {
      if (docType === DocumentType.IssueForProduction) {
        return await patchIssueForProduction(data.DocEntry, payload);
      } else {
        return await patchReceiptFromProduction(data.DocEntry, payload);
      }
    } else {
      if (docType === DocumentType.IssueForProduction) {
        return await postIssueForProduction(payload);
      } else {
        return await postReceiptFromProduction(payload);
      }
    }
  }
  throw new Error("Unsupported document type for production submission");
};

export const getIssueForProduction = async (docNum: number): Promise<any> => {
  const res = await apiClient.get(`api/Production/IssueForProduction?docNum=${docNum}`);
  return res.data;
};

export const getReceiptFromProduction = async (docNum: number): Promise<any> => {
  const res = await apiClient.get(`api/Production/ReceiptForProduction?docNum=${docNum}`);
  return res.data;
};

export const getProductionOrder = async (docNum: number): Promise<any> => {
  const res = await apiClient.get(`api/Production/ProductionOrder?docNum=${docNum}`);
  return res.data;
};

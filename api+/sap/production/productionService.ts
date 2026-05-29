import { getSapErrorMessage } from "@/lib/errorHelper";
import apiClient from "@/lib/apiClient";
import { DocumentType } from "@/types/master/DocumentType";

export const getBOMList = async (isMultiBom: boolean = false, search: string = "", skip: number = 0, top: number = 100): Promise<any[]> => {
  const res = await apiClient.get(`api/Production/GetBOMForProduction?isMultiBom=${isMultiBom}&search=${search}&skip=${skip}&top=${top}`);
  const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  return data?.value || (Array.isArray(data) ? data : []);
};

export const postProductionOrder = async (data: any): Promise<any> => {
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
  const res = await apiClient.post(`api/Production/IssueForProduction`, data);
  return res.data;
};

export const postReceiptFromProduction = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Production/ReceiptForProduction`, data);
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

export const saveProductionDocument = async (docType: DocumentType, data: any, lines: any[], attachments: any[]): Promise<any> => {
  if (docType === DocumentType.ProductionOrder) {
    const payload: any = {
      ItemNo: data.ItemNo,
      Remarks: data.Remarks || data.Comments,
      ProductionOrderStatus: data.ProductionOrderStatus || "boposPlanned",
      Attachments2_Lines: attachments.map((att) => mapAttachment(att)),
    };

    if (data.AbsoluteEntry && data.AbsoluteEntry > 0) {
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
      payload.ProductionOrderLines = lines.map(line => ({
        ItemNo: line.ItemNo,
        BaseQuantity: line.BaseQuantity || 1,
        PlannedQuantity: line.PlannedQuantity || 0,
        IssuedQuantity: line.IssuedQuantity || 0,
        ProductionOrderIssueType: line.ProductionOrderIssueType || "im_Manual",
        Warehouse: line.Warehouse || data.Warehouse,
        ItemType: line.ItemType
      }));

      console.log(payload);            
      return await postProductionOrder(payload);
    }
  } else if (docType === DocumentType.IssueForProduction || docType === DocumentType.ReceiptFromProduction) {
    const isUpdate = !!(data.DocEntry && data.DocEntry > 0);
    const payload = {
      Comments: data.Comments || data.Remarks,
      JournalMemo: data.JournalMemo,
      DocumentLines: lines.map(line => {
        const linePayload: any = {
          Quantity: line.PlannedQuantity,
          WarehouseCode: line.Warehouse,
        };

        if (isUpdate) {
          // For updates, we need LineNum to identify the line, 
          // but we MUST omit read-only reference fields (BaseType, BaseEntry, BaseLine, ItemCode)
          linePayload.LineNum = line.LineNumber;
        } else {
          // For new documents, we include the references
          linePayload.ItemCode = line.OrderNumber ? undefined : (line.ItemNo || line.ItemCode);
          linePayload.BaseType = line.OrderNumber ? 202 : undefined;
          linePayload.BaseEntry = line.OrderNumber;
          linePayload.BaseLine = (line.OrderNumber && line.LineNumber === -1) ? undefined : line.LineNumber;
        }
        return linePayload;
      }),
      Attachments2_Lines: attachments.map(att => mapAttachment(att))
    };

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

import { getSapErrorMessage } from "@/lib/errorHelper";
import apiClient from "@/lib/apiClient";
import { DocumentType } from "@/types/sales/salesDocuments.type";

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

export const getReleasedProductionOrders = async (skip: number = 0, top: number = 20): Promise<any[]> => {
  const res = await apiClient.get(`api/Production/GetReleasedProductionOrders?skip=${skip}&top=${top}`);
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

export const saveProductionDocument = async (docType: DocumentType, data: any, lines: any[], attachments: any[]): Promise<any> => {
  if (docType === DocumentType.ProductionOrder) {
    const payload: any = {
      ItemNo: data.ItemNo,
      Remarks: data.Remarks || data.Comments,
      ProductionOrderStatus: data.ProductionOrderStatus || "boposPlanned",
      Attachments2_Lines: attachments.map((att) => ({
        FileName: att.FileName,
        File: att.File,
        SourcePath: att.SourcePath,
        FreeText: att.FreeText,
        CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
      })),
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
        PlannedQuantity: line.PlannedQuantity,
        IssuedQuantity: line.IssuedQuantity || 0,
        ProductionOrderIssueType: line.ProductionOrderIssueType || "im_Manual",
        Warehouse: line.Warehouse || data.Warehouse
      }));
      return await postProductionOrder(payload);
    }
  } else if (docType === DocumentType.IssueForProduction || docType === DocumentType.ReceiptFromProduction) {
    const payload = {
      Comments: data.Comments || data.Remarks,
      JournalMemo: data.JournalMemo,
      DocumentLines: lines.map(line => ({
        ItemCode: line.OrderNumber ? undefined : line.ItemNo,
        Quantity: line.PlannedQuantity,
        WarehouseCode: line.Warehouse,
        BaseType: line.OrderNumber ? 202 : undefined,
        BaseEntry: line.OrderNumber,
        BaseLine: line.LineNumber,
      })),
      Attachments2_Lines: attachments.map(att => ({
        FileName: att.FileName,
        File: att.File,
      }))
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

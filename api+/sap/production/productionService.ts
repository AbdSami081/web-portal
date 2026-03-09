import { getSapErrorMessage } from "@/lib/errorHelper";
import apiClient from "@/lib/apiClient";
import { DocumentType } from "@/types/sales/salesDocuments.type";

export const getBOMList = async (): Promise<any[]> => {
  try {
    const res = await apiClient.get(`api/Production/GetBOMForProduction`);
    return res.data?.value || [];
  } catch (err) {
    console.error("Failed to fetch BOM list", err);
    return [];
  }
};

export const postProductionOrder = async (data: any): Promise<any> => {
  try {
    const res = await apiClient.post(`api/Production/Production`, data);
    return res.data;
  } catch (err: any) {
    console.error("Failed to post production order", err);
    throw new Error(getSapErrorMessage(err) || "Failed to post production order");
  }
};

export const patchProductionOrder = async (docEntry: number, payload: any): Promise<any> => {
  try {
    const res = await apiClient.patch(`api/Production/Production/${docEntry}`, payload);
    return res.data;
  } catch (err: any) {
    console.error("Failed to patch production order", err);
    throw new Error(getSapErrorMessage(err) || "Failed to patch production order");
  }
};

export const getReleasedProductionOrders = async (): Promise<any[]> => {
  try {
    const res = await apiClient.get(`api/Production/GetReleasedProductionOrders`);
    return res.data?.value || [];
  } catch (err) {
    console.error("Failed to fetch released production orders", err);
    return [];
  }
};

export const postIssueForProduction = async (data: any): Promise<any> => {
  try {
    const res = await apiClient.post(`api/Production/IssueForProduction`, data);
    return res.data;
  } catch (err: any) {
    console.error("Failed to post issue for production", err);
    throw new Error(getSapErrorMessage(err) || "Failed to post issue for production");
  }
};

export const saveProductionDocument = async (docType: DocumentType, data: any, lines: any[], attachments: any[]): Promise<any> => {
  try {
    if (docType === DocumentType.ProductionOrder) {
      const payload: any = {
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
    } else if (docType === DocumentType.IssueForProduction) {
      const payload = {
        Comments: data.Comments || data.Remarks,
        JournalMemo: data.JournalMemo,
        DocumentLines: lines.map(line => ({
          ItemCode: line.ItemNo,
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
      return await postIssueForProduction(payload);
    }
    throw new Error("Unsupported document type for production submission");
  } catch (error: any) {
    throw error;
  }
};

import { BaseSalesDocument } from "@/types/sales/salesDocuments.type";
import apiClient from "@/lib/apiClient";

export const getQuotationDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  const res = await apiClient.get(`api/Sales/Quotations?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BaseSalesDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const getSalesOrderDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  const res = await apiClient.get(`api/Sales/Orders?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BaseSalesDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const getSalesDeliveryDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  const res = await apiClient.get(`api/Sales/DeliveryNote?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BaseSalesDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const getARInvoiceDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  const res = await apiClient.get(`api/Sales/Invoices?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BaseSalesDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const getSalesReturnDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  const res = await apiClient.get(`api/Sales/Returns?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BaseSalesDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const postQuotation = async (payload: any): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/Quotations`, payload);
  if (!res.data) return null;

  const doc: BaseSalesDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const postSalesReturn = async (payload: any): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/Returns`, payload);
  if (!res.data) return null;

  const doc: BaseSalesDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const postSalesOrder = async (payload: any): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/Orders`, payload);
  if (!res.data) return null;

  const doc: BaseSalesDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const postDelivery = async (payload: any): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/DeliveryNote`, payload);
  if (!res.data) return null;

  const doc: BaseSalesDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const postARInvoice = async (payload: any): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/Invoices`, payload);
  if (!res.data) return null;

  const doc: BaseSalesDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const getQuotationByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  const res = await apiClient.get(`api/Sales/GetQuotationByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
  return res.data || [];
};

export const getSalesOrderByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  const res = await apiClient.get(`api/Sales/GetSalesOrderByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
  return res.data || [];
};

export const getSalesDeliveryByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  const res = await apiClient.get(`api/Sales/getSalesDeliveryByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
  return res.data || [];
};

export const patchQuotation = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Sales/Quotations/${docEntry}`, payload);
  return res.data;
};

export const patchSalesOrder = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Sales/Orders/${docEntry}`, payload);
  return res.data;
};

export const patchDeliveryNote = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Sales/DeliveryNote/${docEntry}`, payload);
  return res.data;
};

export const patchARInvoice = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Sales/Invoices/${docEntry}`, payload);
  return res.data;
};

export const patchSalesReturn = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Sales/Returns/${docEntry}`, payload);
  return res.data;
};

export const getAttachment = async (filePath: string) => {
  const res = await apiClient.get(`api/Sales/DisplayAttachment?filePath=${encodeURIComponent(filePath)}`, {
    responseType: 'blob'
  });
  return res.data;
};

export { getDocumentsList } from "@/api+/sap/common/documentService";

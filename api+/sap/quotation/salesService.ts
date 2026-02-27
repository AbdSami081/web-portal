import { BaseSalesDocument } from "@/types/sales/salesDocuments.type";
import apiClient from "@/lib/apiClient";

export const getQuotationDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  try {
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
  } catch (err) {
    console.error("Failed to fetch sales document", err);
    return null;
  }
};

export const getSalesOrderDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  try {
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
  } catch (err) {
    console.error("Failed to fetch sales document", err);
    return null;
  }
};

export const getSalesDeliveryDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  try {
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
  } catch (err) {
    console.error("Failed to fetch sales document", err);
    return null;
  }
};

export const postQuotation = async (payload: any): Promise<any | null> => {
  try {
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
  } catch (err) {
    console.error("Failed to save sales document", err);
    throw err;
  }
};

export const postSalesReturn = async (payload: any): Promise<any | null> => {
  try {
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
  } catch (err) {
    console.error("Failed to save sales document", err);
    throw err;
  }
};

export const postSalesOrder = async (payload: any): Promise<any | null> => {
  try {
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
  } catch (err) {
    console.error("Failed to save sales order", err);
    throw err;
  }
};

export const postDelivery = async (payload: any): Promise<any | null> => {
  try {
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
  } catch (err) {
    console.error("Failed to save delivery note", err);
    throw err;
  }
};

export const postARInvoice = async (payload: any): Promise<any | null> => {
  try {
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
  } catch (err) {
    console.error("Failed to save AR invoice", err);
    throw err;
  }
};

export const getQuotationByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  try {
    const res = await apiClient.get(`api/Sales/GetQuotationByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch quotations by BP", err);
    return null;
  }
};

export const getSalesOrderByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  try {
    const res = await apiClient.get(`api/Sales/GetSalesOrderByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch orders by BP", err);
    return null;
  }
};

export const getSalesDeliveryByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  try {
    const res = await apiClient.get(`api/Sales/getSalesDeliveryByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch deliveries by BP", err);
    return null;
  }
};

export const patchQuotation = async (docEntry: number, payload: any): Promise<any | null> => {
  try {
    const res = await apiClient.patch(`api/Sales/Quotations/${docEntry}`, payload);
    return res.data;
  } catch (err) {
    console.error("Failed to patch quotation", err);
    return null;
  }
};

export const patchSalesOrder = async (docEntry: number, payload: any): Promise<any | null> => {
  try {
    const res = await apiClient.patch(`api/Sales/Orders/${docEntry}`, payload);
    return res.data;
  } catch (err) {
    console.error("Failed to patch sales order", err);
    return null;
  }
};

export const patchDeliveryNote = async (docEntry: number, payload: any): Promise<any | null> => {
  try {
    const res = await apiClient.patch(`api/Sales/DeliveryNote/${docEntry}`, payload);
    return res.data;
  } catch (err) {
    console.error("Failed to patch delivery note", err);
    return null;
  }
};

export const patchARInvoice = async (docEntry: number, payload: any): Promise<any | null> => {
  try {
    const res = await apiClient.patch(`api/Sales/Invoices/${docEntry}`, payload);
    return res.data;
  } catch (err) {
    console.error("Failed to patch AR invoice", err);
    return null;
  }
};

export const getAttachment = async (filePath: string) => {
  try {
    const res = await apiClient.get(`api/Sales/DisplayAttachment?filePath=${encodeURIComponent(filePath)}`, {
      responseType: 'blob'
    });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch attachment", err);
    return null;
  }
};

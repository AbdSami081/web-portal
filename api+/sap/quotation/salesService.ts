import { BaseSalesDocument } from "@/types/sales/salesDocuments.type";
import axios from "axios";
import { API_URL } from "@/types/config";

export const getQuotationDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  try {
    const res = await axios.get(`${API_URL}Quotations?docNum=${docNum}`);
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

    const res = await axios.get(`${API_URL}Orders?docNum=${docNum}`);
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

    const res = await axios.get(`${API_URL}DeliveryNote?docNum=${docNum}`);
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
    const res = await axios.post(`${API_URL}Quotations`, payload);
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
    return null;
  }
};

export const postSalesReturn = async (payload: any): Promise<any | null> => {
  try {
    const res = await axios.post(`${API_URL}Returns`, payload);
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
    return null;
  }
};

export const postSalesOrder = async (payload: any): Promise<any | null> => {
  try {
    const res = await axios.post(`${API_URL}Orders`, payload);
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
    return null;
  }
};

export const postDelivery = async (payload: any): Promise<any | null> => {
  try {
    const res = await axios.post(`${API_URL}DeliveryNote`, payload);
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
    return null;
  }
};

export const postARInvoice = async (payload: any): Promise<any | null> => {
  try {
    const res = await axios.post(`${API_URL}Invoices`, payload);
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
    return null;
  }
};

export const getQuotationByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  try {
    const res = await axios.get(`${API_URL}GetQuotationByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch quotations by BP", err);
    return null;
  }
};

export const getSalesOrderByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  try {
    const res = await axios.get(`${API_URL}GetSalesOrderByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch orders by BP", err);
    return null;
  }
};

export const getSalesDeliveryByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  try {
    const res = await axios.get(`${API_URL}GetSalesDeliveryByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch deliveries by BP", err);
    return null;
  }
};

export const patchQuotation = async (docEntry: number, payload: any): Promise<any | null> => {
  try {
    const res = await axios.patch(`${API_URL}Quotations/${docEntry}`, payload);
    return res.data;
  } catch (err) {
    console.error("Failed to patch quotation", err);
    return null;
  }
};

export const patchSalesOrder = async (docEntry: number, payload: any): Promise<any | null> => {
  try {
    const res = await axios.patch(`${API_URL}Orders/${docEntry}`, payload);
    return res.data;
  } catch (err) {
    console.error("Failed to patch sales order", err);
    return null;
  }
};

export const patchDeliveryNote = async (docEntry: number, payload: any): Promise<any | null> => {
  try {
    const res = await axios.patch(`${API_URL}DeliveryNote/${docEntry}`, payload);
    return res.data;
  } catch (err) {
    console.error("Failed to patch delivery note", err);
    return null;
  }
};

export const patchARInvoice = async (docEntry: number, payload: any): Promise<any | null> => {
  try {
    const res = await axios.patch(`${API_URL}Invoices/${docEntry}`, payload);
    return res.data;
  } catch (err) {
    console.error("Failed to patch AR invoice", err);
    return null;
  }
};

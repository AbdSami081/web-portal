import { BaseSalesDocument } from "@/types/sales/salesDocuments.type";
import axios from "axios";
import { API_URL } from "@/types/config";
import { getUniqPayload } from "recharts/types/util/payload/getUniqPayload";

export const getQuotationDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  try {
    const res = await axios.get(`${API_URL}Quotations?docNum=${docNum}`);
    if (!res.data) return null;

    const doc: BaseSalesDocument = {
      ...res.data,
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

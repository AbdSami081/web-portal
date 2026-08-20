import { BaseSalesDocument } from "@/types/sales/salesDocuments.type";
import apiClient from "@/lib/apiClient";
import { withDefaultBPLId } from "@/lib/sap/helpers/documentPayloadHelper";

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
  const res = await apiClient.post(`api/Sales/Quotations`, withDefaultBPLId(payload));
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
  const res = await apiClient.post(`api/Sales/Returns`, withDefaultBPLId(payload));
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
  const res = await apiClient.post(`api/Sales/Orders`, withDefaultBPLId(payload));
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
  const res = await apiClient.post(`api/Sales/DeliveryNote`, withDefaultBPLId(payload));
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
  const res = await apiClient.post(`api/Sales/Invoices`, withDefaultBPLId(payload));
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

export const closeQuotation = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/Quotations/${docEntry}/Close`);
  return res.data;
};

export const closeSalesOrder = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/Orders/${docEntry}/Close`);
  return res.data;
};

export const closeDeliveryNote = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/DeliveryNote/${docEntry}/Close`);
  return res.data;
};

export const closeARInvoice = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/Invoices/${docEntry}/Close`);
  return res.data;
};

export const closeSalesReturn = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/Returns/${docEntry}/Close`);
  return res.data;
};

export const getSalesReturnRequestDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  const res = await apiClient.get(`api/Sales/ReturnRequest/${docNum}`);
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

export const postReturnRequest = async (payload: any): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/ReturnRequest`, withDefaultBPLId(payload));
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

export const patchReturnRequestNote = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Sales/ReturnRequest/${docEntry}`, payload);
  return res.data;
};

export const closeReturnRequest = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/ReturnRequest/${docEntry}/Close`);
  return res.data;
};

export const getSalesCreditMemoDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  const res = await apiClient.get(`api/Sales/CreditNotes/${docNum}`);
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

export const postCreditMemo = async (payload: any): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/CreditNotes`, withDefaultBPLId(payload));
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

export const patchCreditMemo = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Sales/CreditNotes/${docEntry}`, payload);
  return res.data;
};

export const closeCreditMemo = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/CreditNotes/${docEntry}/Close`);
  return res.data;
};

export const getARDownPaymentRequestDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  const res = await apiClient.get(`api/Sales/DownPayments/${docNum}`);
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

export const getARDownPaymentInvoiceDocument = async (docNum: number): Promise<BaseSalesDocument | null> => {
  return getARDownPaymentRequestDocument(docNum);
};

export const postARDownPayment = async (payload: any): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/DownPayments`, withDefaultBPLId(payload));
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

export const patchARDownPayment = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Sales/DownPayments/${docEntry}`, payload);
  return res.data;
};

export const closeARDownPayment = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Sales/DownPayments/${docEntry}/Close`);
  return res.data;
};

export const getAttachment = async (filePath: string) => {
  const res = await apiClient.get(`api/Sales/DisplayAttachment?filePath=${encodeURIComponent(filePath)}`, {
    responseType: 'blob'
  });
  return res.data;
};

export const getDraftDocument = async (draftID: number): Promise<BaseSalesDocument | null> => {
  const res = await apiClient.get(`api/Draft/Drafts/${draftID}`);
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

export { getDocumentsList } from "@/api+/sap/common/documentService";

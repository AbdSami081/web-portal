import apiClient from "@/lib/apiClient";
import { BasePurchaseDocument } from "@/types/purchase/purchaseDocuments.type";
import { withDefaultBPLId } from "@/lib/sap/helpers/documentPayloadHelper";

// Close functions
export const closePurchaseQuotation = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/PurchaseQuotations/${docEntry}/Close`);
  return res.data;
};

export const closePurchaseOrder = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/PurchaseOrders/${docEntry}/Close`);
  return res.data;
};

export const closePurchaseDeliveryNote = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/PurchaseDeliveryNotes/${docEntry}/Close`);
  return res.data;
};

export const closePurchaseInvoice = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/PurchaseInvoices/${docEntry}/Close`);
  return res.data;
};

export const closePurchaseReturn = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/PurchaseReturns/${docEntry}/Close`);
  return res.data;
};

export const closePurchaseCreditNote = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/PurchaseCreditNotes/${docEntry}/Close`);
  return res.data;
};

export const closePurchaseRequest = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/PurchaseRequests/${docEntry}/Close`);
  return res.data;
};

export const closePurchaseDownPayment = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/PurchaseDownPayments/${docEntry}/Close`);
  return res.data;
};

export const closeGoodsReturnRequest = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/GoodsReturnRequest/${docEntry}/Close`);
  return res.data;
};

export const getPurchaseQuotationDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/PurchaseQuotation?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const getPurchaseRequestDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/PurchaseRequests?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const getPurchaseOrderDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/PurchaseOrders?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const getPurchaseDeliveryDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/PurchaseDeliveryNotes?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const getAPInvoiceDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/PurchaseInvoices?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const getPurchaseReturnDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/Returns?docNum=${docNum}`);
  if (!res.data) return null;

  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const postPurchaseOrder = async (payload: any): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/PurchaseOrders`, payload, {
    headers: {
      Prefer: "return-no-content",
    },
  });

  if (res.status === 204) {
    return {
      isDraft: true,
    };
  }
  if (!res.data) return null;

  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const patchPurchaseOrder = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/PurchaseOrders/${docEntry}`, payload);
  return res.data;
};

export const postPurchaseRequest = async (payload: any): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/PurchaseRequests`, withDefaultBPLId(payload));
  if (!res.data) return null;

  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };

  return doc;
};

export const patchPurchaseRequest = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/PurchaseRequests/${docEntry}`, payload);
  return res.data;
};

export const postPurchaseQuotation = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Purchase/PurchaseQuotations`, withDefaultBPLId(data));
  return res.data;
};

export const patchPurchaseQuotation = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/PurchaseQuotations/${docEntry}`, payload);
  return res.data;
};

export const postPurchaseGRPO = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Purchase/PurchaseDeliveryNotes`, withDefaultBPLId(data));
  return res.data;
};

export const patchGRPO = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/PurchaseDeliveryNotes/${docEntry}`, payload);
  return res.data;
};

export const postPurchaseInvoice = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Purchase/PurchaseInvoices`, withDefaultBPLId(data));
  return res.data;
};

export const patchPurchaseInvoice = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/PurchaseInvoices/${docEntry}`, payload);
  return res.data;
};

export const getPurchaseQuotation = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/PurchaseInvoices/${docEntry}`, payload);
  return res.data || [];
};

export const getPurchaseQuotationByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  const res = await apiClient.get(`api/Purchase/GetPurchaseQuotationsByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
  return res.data || [];
};

export const getPurchaseOrderByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  const res = await apiClient.get(`api/Purchase/GetPurchaseOrderByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
  return res.data || [];
};

export const getPurchaseDeliveryByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  const res = await apiClient.get(`api/Purchase/GetGRPOByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
  return res.data || [];
};

export const getPurchaseRequestsByBP = async (cardCode: string, skip = 0, top = 20): Promise<any[] | null> => {
  const res = await apiClient.get(`api/Purchase/GetPurchaseRequestsByBP?cardCode=${cardCode}&skip=${skip}&top=${top}`);
  return res.data || [];
};

export const getAPCreditMemoDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/PurchaseCreditNotes?docNum=${docNum}`);
  if (!res.data) return null;
  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };
  return doc;
};

export const getGoodsReturnDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/PurchaseReturns?docNum=${docNum}`);
  if (!res.data) return null;
  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };
  return doc;
};

export const getGoodsReturnRequestDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/GoodsReturnRequest?docNum=${docNum}`);
  if (!res.data) return null;
  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };
  return doc;
};

export const getAPDownPaymentRequestDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/PurchaseDownPayments?docNum=${docNum}`);
  if (!res.data) return null;
  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };
  return doc;
};

export const getAPDownPaymentInvoiceDocument = async (docNum: number): Promise<BasePurchaseDocument | null> => {
  const res = await apiClient.get(`api/Purchase/PurchaseDownPayments?docNum=${docNum}`);
  if (!res.data) return null;
  const doc: BasePurchaseDocument = {
    ...res.data,
    comments: res.data.Comments ?? "",
    DocumentLines: (res.data.DocumentLines || []).map((line: any) => ({
      ...line,
    })),
  };
  return doc;
};

export const postApCreditMemo = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Purchase/PurchaseCreditNotes`, withDefaultBPLId(data));
  return res.data;
};

export const patchApCreditMemo = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/PurchaseCreditNotes/${docEntry}`, payload);
  return res.data;
};

export const postGoodsReturn = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Purchase/PurchaseReturns`, withDefaultBPLId(data));
  return res.data;
};

export const patchGoodsReturn = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/PurchaseReturns/${docEntry}`, payload);
  return res.data;
};

export const postGoodsReturnRequest = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Purchase/GoodsReturnRequest`, withDefaultBPLId(data));
  return res.data;
};

export const patchGoodsReturnRequest = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/GoodsReturnRequest/${docEntry}`, payload);
  return res.data;
};

export const postAPDownPaymentInvoice = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Purchase/PurchaseDownPayments`, withDefaultBPLId(data));
  return res.data;
};

export const patchAPDownPaymentInvoice = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/PurchaseDownPayments/${docEntry}`, payload);
  return res.data;
};

export const postAPDownPaymentRequest = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Purchase/PurchaseDownPayments`, withDefaultBPLId(data));
  return res.data;
};

export const patchAPDownPaymentRequest = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/PurchaseDownPayments/${docEntry}`, payload);
  return res.data;
};

export const postReservePurchaseInvoice = async (data: any): Promise<any> => {
  const res = await apiClient.post(`api/Purchase/ReservePurchaseInvoices`, withDefaultBPLId(data));
  return res.data;
};

export const patchReservePurchaseInvoice = async (docEntry: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Purchase/ReservePurchaseInvoices/${docEntry}`, payload);
  return res.data;
};

export const closeReservePurchaseInvoice = async (docEntry: number): Promise<any | null> => {
  const res = await apiClient.post(`api/Purchase/ReservePurchaseInvoices/${docEntry}/Close`);
  return res.data;
};

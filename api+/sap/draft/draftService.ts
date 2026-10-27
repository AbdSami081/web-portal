import apiClient from "@/lib/apiClient";

export interface SaveDraftToDocumentPayload {
  Document: {
    DocEntry: number;
    DocDueDate?: string;
  };
}




export interface DraftRow {
  id: number;
  document: string;
  documentNo: number;
  postingDate: string;
  bpCode: string;
  total: number;
  currency: string;
  remarks: string;
  // abhi khali, UDFs aane par map honge
  fbrInvoiceNumber?: string;
  projectManager?: string;
  projectDirector?: string;
  projectManagerName?: string;
  projectDirectorName?: string;
  ntnRegistered?: string;
  fbrScenarioId?: string;
  refresher?: "Yes" | "No";
  objectCode: string;
}

const docNames: Record<string, string> = {
  oQuotations: "Sales Quotations",
  oOrders: "Sales Orders",
  oPurchaseRequest: "Purchase Request",
  oPurchaseQuotations: "Purchase Quotations",
  oPurchaseDeliveryNotes: "Goods Receipt PO",
  oInventoryTransferRequest: "Inventory Transfer Request",
};
// draftService.ts ke end mein
export const draftRoutes: Record<string, string> = {
  // Sales
  oQuotations: "/dashboard/sales/quotation/new",
  oOrders: "/dashboard/sales/order/new",
  oDeliveryNotes: "/dashboard/sales/delivery/new",
  oInvoices: "/dashboard/sales/invoice",
  oReturns: "/dashboard/sales/return/new",

  // Purchase
  oPurchaseRequest: "/dashboard/purchase/request/new",
  oPurchaseQuotations: "/dashboard/purchase/quotation/new",
  oPurchaseOrders: "/dashboard/purchase/order/new",
  oPurchaseDeliveryNotes: "/dashboard/purchase/grpo/new",
  oPurchaseInvoices: "/dashboard/purchase/invoice/new",

  // Inventory
  oInventoryTransferRequest: "/dashboard/inventory/transfer-request/new",
  oStockTransfer: "/dashboard/inventory/transfer/new",
  oInventoryGenEntry: "/dashboard/inventory/goods-receipt/new",
  oInventoryGenExit: "/dashboard/inventory/goods-issue/new",
};

export const SaveDraftToDocument = async (payload: SaveDraftToDocumentPayload | any): Promise<any | null> => {
  const res = await apiClient.post(`api/Draft/SaveDraftToDocument`, payload);
  if (!res.data) return null;
  return res.data;
};

export const saveDraftToDocument = SaveDraftToDocument;

export const getDraftDocument = async (draftID: number): Promise<any | null> => {
  const res = await apiClient.get(`api/Draft/Drafts/${draftID}`);
  if (!res.data) return null;
  return res.data;
};

export const findDraftByNumber = async (
  docNum: number,
  objectType?: number | string
): Promise<any | null> => {
  try {
    const params: Record<string, any> = { docNum };
    if (objectType !== undefined && objectType !== null && `${objectType}` !== "") {
      params.objectType = objectType;
    }
    const res = await apiClient.get(`api/Draft/Drafts`, { params });
    return res.data || null;
  } catch {
    return null;
  }
};

export const patchDraftDocument = async (draftID: number, payload: any): Promise<any | null> => {
  const res = await apiClient.patch(`api/Draft/Drafts/${draftID}`, payload);
  if (!res.data) return null;
  return res.data;
};






const formatDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y.slice(2)}`;
};

export const getAllDrafts = async (skip = 0, top = 20): Promise<DraftRow[]> => {
  const res = await apiClient.get(`api/Documents/getAll/draftsdocs?skip=${skip}&top=${top}`);

  return (res.data?.value ?? []).map((d: any) => ({
    id: d.DocEntry,
      objectCode: d.DocObjectCode, 
    document: docNames[d.DocObjectCode] ?? d.DocObjectCode,
    documentNo: d.DocNum,
    postingDate: formatDate(d.DocDate),
    bpCode: d.CardCode ?? "",
    total: d.DocTotal,
    currency: d.DocCurrency ?? "AUD",
    remarks: d.Comments ?? "",
  }));
};




export const getDraftByDocEntry = async (docEntry: number) => {
  const res = await apiClient.get(`api/Documents/drafts/${docEntry}`);
  console.log("getDraftByDocEntry res:", res.data);
  return res.data; // seedha draft object (DocObjectCode, CardCode, DocumentLines...)
};
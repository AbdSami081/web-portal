import apiClient from "@/lib/apiClient";

export interface SaveDraftToDocumentPayload {
  Document: {
    DocEntry: number;
    DocDueDate?: string;
    DocObjectCode?: string;
    RequriedDate?: string;
  };
}

/** Service Layer treats extra document fields as a draft update before posting; omit them when converting an approved draft unchanged. */
export function buildSaveDraftToDocumentPayload(draftEntry: number, requiredDate?: string): SaveDraftToDocumentPayload {
  return {
    Document: {
      DocEntry: draftEntry,
      ...(requiredDate && { RequriedDate: requiredDate }),
    },
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


const normalizeDraftObjectCode = (code: string): string =>
  (code || "")
    .trim()
    .toLowerCase()
    .replace(/^o/, "")
    .replace(/s$/, "");

const DRAFT_DOC_DEFS: Record<string, { name: string; numericType: number }> = {
  quotation: { name: "Sales Quotation", numericType: 23 },
  order: { name: "Sales Order", numericType: 17 },
  deliverynote: { name: "Delivery", numericType: 15 },
  invoice: { name: "A/R Invoice", numericType: 13 },
  return: { name: "Sales Return", numericType: 16 },
  returnrequest: { name: "Sales Return Request", numericType: 234000031 },
  creditnote: { name: "A/R Credit Memo", numericType: 14 },
  downpayment: { name: "A/R Down Payment Invoice", numericType: 203 },

  purchaserequest: { name: "Purchase Request", numericType: 1470000113 },
  purchasequotation: { name: "Purchase Quotation", numericType: 54 },
  purchaseorder: { name: "Purchase Order", numericType: 22 },
  purchasedeliverynote: { name: "Goods Receipt PO", numericType: 20 },
  purchaseinvoice: { name: "A/P Invoice", numericType: 18 },
  purchasereturnrequest: { name: "Goods Return Request", numericType: 234000032 },
  purchasereturn: { name: "Goods Return", numericType: 21 },
  purchasecreditnote: { name: "A/P Credit Memo", numericType: 19 },

  inventorytransferrequest: { name: "Inventory Transfer Request", numericType: 1250000001 },
  stocktransfer: { name: "Inventory Transfer", numericType: 67 },
  inventorygenexit: { name: "Goods Issue", numericType: 60 },
  inventorygenentry: { name: "Goods Receipt", numericType: 59 },
  productionorder: { name: "Production Order", numericType: 202 },
};

export const getDraftDocName = (objectCode: string): string => {
  const def = DRAFT_DOC_DEFS[normalizeDraftObjectCode(objectCode)];
  return def?.name ?? objectCode;
};

export const getDraftNumericType = (objectCode: string): number | null => {
  const def = DRAFT_DOC_DEFS[normalizeDraftObjectCode(objectCode)];
  return def?.numericType ?? null;
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
  if (typeof res.data === "string") {
    try {
      return JSON.parse(res.data);
    } catch {
      return null;
    }
  }
  return res.data;
};

export const getPostedDocumentForDraft = async (
  draftId: number
): Promise<{ docEntry: number } | null> => {
  if (!draftId || draftId <= 0) return null;
  const res = await apiClient.get(`api/Draft/PostedDocument/${draftId}`);
  const docEntry = Number(res.data?.docEntry ?? res.data?.DocEntry ?? 0);
  return Number.isFinite(docEntry) && docEntry > 0 ? { docEntry } : null;
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
    document: getDraftDocName(d.DocObjectCode),
    documentNo: d.DocNum,
    postingDate: formatDate(d.DocDate),
    bpCode: d.CardCode ?? "",
    total: d.DocTotal,
    currency: d.DocCurrency ?? "AUD",
    remarks: d.Comments ?? "",
  }));
};
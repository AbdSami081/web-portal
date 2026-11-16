import { getMenuInfoByObjectCode } from "@/lib/menu-lookup";
import { clearDocNavParams, stageDocNavParams } from "@/lib/docNavParams";
import { getPostedDocumentForDraft } from "@/api+/sap/draft/draftService";

export type PostedDraftInfo = {
  docEntry?: number;
  docNum?: number;
};

function readNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function parseSaveDraftToDocumentResult(result: unknown): PostedDraftInfo {
  if (result == null) return {};

  let node: unknown = result;
  if (typeof node === "object" && node !== null && "data" in (node as object)) {
    node = (node as { data: unknown }).data;
  }

  if (typeof node === "string") {
    try {
      node = JSON.parse(node);
    } catch {
      return {};
    }
  }

  if (typeof node === "object" && node !== null && "data" in (node as object)) {
    const inner = (node as { data: unknown }).data;
    if (typeof inner === "string") {
      try {
        node = JSON.parse(inner);
      } catch {
        return {};
      }
    } else {
      node = inner;
    }
  }

  if (typeof node !== "object" || node === null) return {};
  const o = node as Record<string, unknown>;
  return {
    docEntry: readNumber(o.DocEntry),
    docNum: readNumber(o.DocNum),
  };
}

export function navigateAfterDraftConversion(
  router: { replace: (href: string) => void },
  docType: number,
  posted: PostedDraftInfo
) {
  const menu = getMenuInfoByObjectCode(docType);
  if (!menu?.url) return;

  clearDocNavParams();
  stageDocNavParams(menu.url, {
    docType: String(docType),
    docEntry: posted.docEntry ? String(posted.docEntry) : undefined,
    approvalStatus: "arsGenerated",
  });
  router.replace(menu.url);
}

export function isDraftModulePath(pathname: string): boolean {
  return pathname.toLowerCase().includes("/draft");
}

export function isClosedDraftDocument(documentData: Record<string, unknown> | null | undefined): boolean {
  const status = String(documentData?.DocumentStatus ?? documentData?.DocStatus ?? "")
    .trim()
    .toLowerCase();
  return status === "bost_close" || status === "c" || status === "closed";
}

/** Closed drafts and WP status P are already posted SAP documents. */
export async function withResolvedPostedDocument(
  documentData: Record<string, unknown>,
  draftEntry: number
): Promise<Record<string, unknown>> {
  const wpStatus = String(documentData.U_WP_ApprStatus ?? "").trim().toUpperCase();
  const alreadyPosted = readNumber(documentData.U_WP_PostedDocEntry);
  if (alreadyPosted) return documentData;
  if (wpStatus !== "P" && !isClosedDraftDocument(documentData)) return documentData;
  if (draftEntry <= 0) return documentData;

  try {
    const posted = await getPostedDocumentForDraft(draftEntry);
    if (!posted?.docEntry) return documentData;
    return {
      ...documentData,
      U_WP_PostedDocEntry: posted.docEntry,
      U_WP_ApprStatus: "P",
      AuthorizationStatus: "dasGenerated",
    };
  } catch {
    return documentData;
  }
}

/** When the draft was already created in SAP, open the real document on the module route. */
export function redirectIfWpGeneratedDraft(
  router: { replace: (href: string) => void },
  pathname: string,
  docType: number,
  documentData: Record<string, unknown> | null | undefined
): boolean {
  if (!documentData || !isDraftModulePath(pathname)) return false;

  const wpStatus = String(documentData.U_WP_ApprStatus ?? "").trim().toUpperCase();
  const auth = String(documentData.AuthorizationStatus ?? "").trim().toLowerCase();
  const postedEntry = readNumber(documentData.U_WP_PostedDocEntry);
  const generated =
    wpStatus === "P" ||
    auth === "dasgenerated" ||
    isClosedDraftDocument(documentData);
  if (!generated || !postedEntry) return false;

  navigateAfterDraftConversion(router, docType, { docEntry: postedEntry });
  return true;
}

export function finishDraftSubmitNavigation(
  pathname: string,
  router: { replace: (href: string) => void },
  docType: number,
  result: unknown,
  onReset: () => void
): boolean {
  if (!isDraftModulePath(pathname)) return false;

  const posted = parseSaveDraftToDocumentResult(result);
  if (posted.docEntry || posted.docNum) {
    navigateAfterDraftConversion(router, docType, posted);
    onReset();
    return true;
  }

  const menu = getMenuInfoByObjectCode(docType);
  if (menu?.url) {
    clearDocNavParams();
    router.replace(menu.url);
    onReset();
    return true;
  }

  return false;
}

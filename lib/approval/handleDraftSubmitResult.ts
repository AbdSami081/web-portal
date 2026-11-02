import { getDraftDocument } from "@/api+/sap/draft/draftService";
import { stageDocNavParams } from "@/lib/docNavParams";
import { isCustomApprovalEngineResult } from "@/lib/approval/postSubmitApproval";

/** Load SL draft into store and stage URL nav params after an approval draft create. */
export async function handleApprovalDraftSubmitResult(options: {
  result: Record<string, unknown>;
  docType: number;
  pathname: string;
  loadFromDocument: (doc: unknown, type?: number) => void;
}): Promise<{ isDraft: boolean; isWp: boolean; draftEntry: number }> {
  const isDraft =
    options.result?.IsDraft === true ||
    options.result?.IsDraft === "tYES" ||
    options.result?.IsDraft === "Y";
  const draftEntry = Number(options.result?.DraftEntry ?? options.result?.DocEntry ?? 0);
  const isWp = isCustomApprovalEngineResult(options.result);

  if (!isDraft || draftEntry <= 0) {
    return { isDraft: false, isWp: false, draftEntry: 0 };
  }

  try {
    const draft = await getDraftDocument(draftEntry);
    if (draft) {
      options.loadFromDocument({ ...draft, DocEntry: draftEntry, IsDraft: true }, options.docType);
    }
  } catch (err) {
    console.error("Failed to load approval draft after submit", err);
  }

  stageDocNavParams(options.pathname, {
    draftEntry: String(draftEntry),
    docType: String(options.docType),
    draft: "Y",
    approvalStatus: isWp ? "pending" : "arspending",
  });

  return { isDraft: true, isWp, draftEntry };
}

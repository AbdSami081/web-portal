export type MessageDocumentLink = {
  objectType: string;
  objectEntry?: string;
  draftEntry?: string;
  isDraft: boolean;
  sourceDraftNumber?: number | null;
  approvalRequestCode?: number;
  cardType?: string | null;
  isProductionLinked?: boolean | null;
  approvalStatus?: string;
};

function cleanKey(v?: string | number | null): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = v.toString().trim().split(/\s+/)[0];
  return s || undefined;
}

function readPositive(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function isGeneratedApprovalStatus(status: string): boolean {
  const s = status.trim().toLowerCase();
  return (
    s.includes("generated") ||
    s === "dasgenerated" ||
    s === "ardgenerated" ||
    s === "arsgenerated"
  );
}

function isApprovedNotGenerated(status: string): boolean {
  const s = status.trim().toLowerCase();
  return s.includes("approved") && !isGeneratedApprovalStatus(s);
}

function isPendingApprovalStatus(status: string): boolean {
  const s = status.trim().toLowerCase();
  return s.includes("pending") || s === "w";
}

/**
 * Messages / alerts: open draft route only when approved but not yet posted; otherwise open the live document route.
 */
export function resolveMessageDocumentLink(input: {
  objectType: string;
  draftEntry?: string | null;
  objectEntry?: string | null;
  approvalStatus?: string | null;
  postedDocEntry?: number | string | null;
  sourceDraftNumber?: number | null;
  approvalRequestCode?: number;
  cardType?: string | null;
  isProductionLinked?: boolean | null;
}): MessageDocumentLink | null {
  const objectType = input.objectType;
  const draftKey = cleanKey(input.draftEntry);
  const objectKey = cleanKey(input.objectEntry);
  const postedEntry = readPositive(input.postedDocEntry);
  const status = (input.approvalStatus || "").trim();
  const statusLower = status.toLowerCase();

  const base = {
    objectType,
    sourceDraftNumber: input.sourceDraftNumber,
    approvalRequestCode: input.approvalRequestCode,
    cardType: input.cardType,
    isProductionLinked: input.isProductionLinked,
  };

  if (postedEntry > 0 || isGeneratedApprovalStatus(statusLower)) {
    const docEntry = postedEntry > 0 ? String(postedEntry) : objectKey;
    if (!docEntry || readPositive(docEntry) <= 0) {
      if (draftKey) {
        return {
          ...base,
          isDraft: true,
          draftEntry: draftKey,
          approvalStatus: status || undefined,
        };
      }
      return null;
    }
    return {
      ...base,
      isDraft: false,
      objectEntry: docEntry,
      approvalStatus: "arsGenerated",
    };
  }

  if (draftKey && isPendingApprovalStatus(statusLower)) {
    return {
      ...base,
      isDraft: true,
      draftEntry: draftKey,
      approvalStatus: status || undefined,
    };
  }

  if (draftKey && isApprovedNotGenerated(statusLower)) {
    return {
      ...base,
      isDraft: true,
      draftEntry: draftKey,
      approvalStatus: status || undefined,
    };
  }

  if (objectKey && readPositive(objectKey) > 0) {
    return {
      ...base,
      isDraft: false,
      objectEntry: objectKey,
      approvalStatus: status || undefined,
    };
  }

  if (draftKey) {
    return {
      ...base,
      isDraft: true,
      draftEntry: draftKey,
      approvalStatus: status || undefined,
    };
  }

  return null;
}

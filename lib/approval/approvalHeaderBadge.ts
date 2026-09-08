import { DocNavParams } from "@/lib/docNavParams";

export type ApprovalHeaderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "generated";

export interface ApprovalHeaderBadges {
  showDraft: boolean;
  status: ApprovalHeaderStatus | null;
}

const APPROVED = new Set([
  "arsapproved",
  "ardapproved",
  "approved",
]);

const REJECTED = new Set([
  "arsrejected",
  "ardrejected",
  "arsnotapproved",
  "ardnotapproved",
  "rejected",
  "notapproved",
  "arscancelled",
  "arscanceled",
  "ardcancelled",
  "ardcanceled",
  "arscomplete",
]);

const PENDING = new Set([
  "arspending",
  "ardpending",
  "pending",
]);

const GENERATED = new Set([
  "arsgenerated",
  "ardgenerated",
  "dasgenerated",
  "generated",
]);

export function resolveApprovalHeaderBadges(
  docNav: DocNavParams
): ApprovalHeaderBadges {
  const status = (docNav.approvalStatus || "").trim().toLowerCase();

  const hasApprovalContext =
    !!status || !!docNav.approvalRequestCode;

  let resolved: ApprovalHeaderStatus | null = null;

  if (APPROVED.has(status)) {
    resolved = "approved";
  } else if (REJECTED.has(status)) {
    resolved = "rejected";
  } else if (PENDING.has(status)) {
    resolved = "pending";
  } else if (GENERATED.has(status)) {
    resolved = "generated";
  } else if (hasApprovalContext && !!docNav.draftEntry) {
    resolved = "pending";
  } else if (hasApprovalContext && !!docNav.docEntry) {
    resolved = "approved";
  }

  const showDraft =
    hasApprovalContext &&
    (!!docNav.draftEntry || docNav.draft === "1");

  return {
    showDraft,
    status: resolved,
  };
}

export function mapAuthorizationStatus(
  auth?: string | null
): ApprovalHeaderStatus | null {
  const s = (auth || "").trim().toLowerCase();

  if (s === "daspending") {
    return "pending";
  }

  if (s === "dasapproved") {
    return "approved";
  }

  if (s === "dasrejected") {
    return "rejected";
  }

  if (s === "dasgenerated") {
    return "generated";
  }

  return null;
}

export function isAuthorizationWithout(
  auth?: string | null
): boolean {
  return (
    (auth || "").trim().toLowerCase() === "daswithout"
  );
}

export function resolveDocAuthStatus(doc: any): string {
  const raw = (
    doc?.AuthorizationStatus ??
    doc?.DocumentApprovalStatus ??
    ""
  )
    .toString()
    .trim();

  if (raw) {
    return raw;
  }

  const draftKey = Number(
    doc?.DraftKey ??
      doc?.DraftEntry ??
      doc?.DraftKeyEntry ??
      -1
  );

  if (Number.isFinite(draftKey) && draftKey > 0) {
    return "dasApproved";
  }

  return "";
}

import { DocNavParams } from "@/lib/docNavParams";

export type ApprovalHeaderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "canceled"
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

/** Prefer the draft's live AuthorizationStatus over the status stored when the draft was first opened. */
export function resolveLiveApprovalStatus(
  navStatus?: string | null,
  authorizationStatus?: string | null
): string {
  const mapped = mapAuthorizationStatus(authorizationStatus);
  if (mapped === "approved") return "arsapproved";
  if (mapped === "rejected") return "arsrejected";
  if (mapped === "pending") return "arspending";
  if (mapped === "generated") return "arsgenerated";
  return (navStatus || "").trim().toLowerCase();
}

export function approvalFlagsFromStatus(
  status: string,
  hasDraft: boolean,
  hasRequestCode: boolean
) {
  const statusStr = (status || "").trim().toLowerCase();
  const isApprovedDraft =
    statusStr === "arsapproved" || statusStr === "ardapproved" || statusStr === "approved";
  const isRejectedApproval =
    statusStr === "arsrejected" ||
    statusStr === "ardrejected" ||
    statusStr === "arsnotapproved" ||
    statusStr === "ardnotapproved" ||
    statusStr === "rejected" ||
    statusStr === "notapproved" ||
    statusStr === "arscancelled" ||
    statusStr === "arscanceled" ||
    statusStr === "ardcancelled" ||
    statusStr === "ardcanceled" ||
    statusStr === "arscomplete";
  const isPendingApproval =
    (statusStr === "arspending" ||
      statusStr === "ardpending" ||
      statusStr === "pending" ||
      (!statusStr && hasRequestCode && hasDraft)) &&
    hasDraft;

  return { isApprovedDraft, isRejectedApproval, isPendingApproval };
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

  if (s === "dascanceled" || s === "dascancelled") {
    return "canceled";
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

export function isWpGeneratedStatus(
  authorizationStatus?: string | null,
  wpApprStatus?: string | null
): boolean {
  const wp = (wpApprStatus || "").trim().toUpperCase();
  if (wp === "P") return true;
  return mapAuthorizationStatus(authorizationStatus) === "generated";
}

export function resolveWorkflowHeaderBadges(input: {
  authWithout: boolean;
  documentLoaded: boolean;
  authBadge: ApprovalHeaderStatus | null;
  headerBadges: ApprovalHeaderBadges;
  wpApprStatus?: string | null;
  authorizationStatus?: string | null;
  approvalApplies: boolean;
  hasNavApproval: boolean;
  loadedDraftData: unknown;
  isPostedLoaded: boolean;
}): {
  draftBadgeVisible: boolean;
  statusBadge: ApprovalHeaderStatus | null;
} {
  const generated =
    input.documentLoaded &&
    (isWpGeneratedStatus(input.authorizationStatus, input.wpApprStatus) ||
      (input.isPostedLoaded && input.headerBadges.status === "generated"));

  if (generated) {
    return {
      draftBadgeVisible: false,
      statusBadge: "generated",
    };
  }

  const draftBadgeVisible =
    !input.authWithout &&
    !input.isPostedLoaded &&
    input.headerBadges.status !== "generated" &&
    (input.approvalApplies ||
      input.hasNavApproval ||
      input.headerBadges.showDraft ||
      !!input.loadedDraftData);

  const statusBadge =
    input.authWithout || !input.documentLoaded
      ? null
      : (input.authBadge ?? input.headerBadges.status);

  return { draftBadgeVisible, statusBadge };
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
    return "dasGenerated";
  }

  return "";
}

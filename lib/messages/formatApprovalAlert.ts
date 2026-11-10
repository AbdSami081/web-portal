import { getMenuInfoByObjectCode } from "@/lib/menu-lookup";
import type { SAPMessage } from "@/api+/sap/notification";
import type { AlertDocumentSource } from "@/lib/messages/resolveMessageDocumentLink";

export type AlertDecision = "Approved" | "Rejected";

export type ApprovalAlertFields = AlertDocumentSource & {
  subject?: string | null;
  text?: string | null;
};

export type ApprovalAlertText = {
  decision: AlertDecision | null;
  documentLabel: string;
  documentNumber: string;
  title: string;
  description: string;
};

function positiveToken(value: unknown): string {
  if (value === undefined || value === null) return "";
  const raw = String(value).trim().split(/\s+/)[0];
  if (!raw) return "";
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.trunc(n));
}

export function alertDecisionLabel(
  status?: string | null,
  subject?: string | null,
  text?: string | null
): AlertDecision | null {
  const statusKey = (status || "").trim().toLowerCase();
  if (statusKey === "n" || statusKey === "arsnotapproved" || statusKey === "ardnotapproved" || statusKey === "rejected" || statusKey === "notapproved") {
    return "Rejected";
  }
  if (statusKey === "y" || statusKey === "arsapproved" || statusKey === "ardapproved" || statusKey === "approved") {
    return "Approved";
  }

  const blob = `${subject || ""} ${text || ""}`.toLowerCase();
  if (blob.includes("not approved") || blob.includes("notapproved") || blob.includes("reject")) return "Rejected";
  if (blob.includes("approved") && !blob.includes("generated")) return "Approved";
  return null;
}

export function alertDocumentNumber(source: AlertDocumentSource): string {
  return (
    positiveToken(source.sourceDraftNumber) ||
    positiveToken(source.objectEntry) ||
    positiveToken(source.draftEntry)
  );
}

export function alertDocumentLabel(source: AlertDocumentSource): string {
  let code = source.objectType != null ? String(source.objectType) : "";
  if (!code || code === "112") {
    code = source.draftType != null ? String(source.draftType) : code;
  }
  const menu = code
    ? getMenuInfoByObjectCode(code, {
        cardType: source.cardType,
        isProductionLinked: source.isProductionLinked,
      })
    : undefined;
  const number = alertDocumentNumber(source);
  if (menu?.title && number) return `${menu.title} #${number}`;
  if (menu?.title) return menu.title;
  if (number) return `Document #${number}`;
  return "";
}

export function formatApprovalAlert(source: ApprovalAlertFields): ApprovalAlertText {
  const decision = alertDecisionLabel(source.approvalStatus, source.subject, source.text);
  const documentLabel = alertDocumentLabel(source);
  const documentNumber = alertDocumentNumber(source);
  const subject = (source.subject || "").trim();
  const text = (source.text || "").trim();

  if (decision && documentLabel) {
    const title = `${documentLabel} was ${decision}`;
    const sentence = `${title}.`;
    return {
      decision,
      documentLabel,
      documentNumber,
      title,
      description: text && text !== sentence && text !== title ? text : sentence,
    };
  }

  if (decision && subject && !/approved|reject/i.test(subject)) {
    const title = `${subject} was ${decision}`;
    return {
      decision,
      documentLabel,
      documentNumber,
      title,
      description: text || `${title}.`,
    };
  }

  return {
    decision,
    documentLabel,
    documentNumber,
    title: subject || documentLabel || "New alert",
    description: text,
  };
}

export function alertFieldsFromSapMessage(
  msg: Partial<SAPMessage> & { Code?: number; DraftType?: string }
): ApprovalAlertFields {
  const objectType = msg.ObjectType && String(msg.ObjectType) !== "112" ? msg.ObjectType : msg.DraftType || msg.ObjectType;
  return {
    subject: msg.Subject,
    text: msg.Text,
    objectType,
    draftType: msg.DraftType,
    draftEntry: msg.DraftEntry,
    objectEntry: msg.ObjectEntry,
    approvalStatus: msg.ApprovalStatus,
    postedDocEntry: msg.PostedDocEntry,
    sourceDraftNumber: msg.SourceDraftNumber,
    approvalRequestCode: msg.ApprovalRequestCode,
    cardType: msg.CardType,
    isProductionLinked: msg.IsProductionLinked,
  };
}

export function buildMessageAlertHref(messageCode: string | number, source: ApprovalAlertFields): string {
  const params = new URLSearchParams();
  params.set("messageCode", String(messageCode));
  if (source.objectType != null && `${source.objectType}` !== "") params.set("objectType", String(source.objectType));
  if (source.draftType != null && `${source.draftType}` !== "") params.set("draftType", String(source.draftType));
  if (source.draftEntry != null && `${source.draftEntry}`.trim() !== "") params.set("draftEntry", String(source.draftEntry).trim());
  if (source.objectEntry != null && `${source.objectEntry}`.trim() !== "") params.set("objectEntry", String(source.objectEntry).trim());
  if (source.approvalStatus) params.set("approvalStatus", source.approvalStatus);
  if (source.postedDocEntry != null && `${source.postedDocEntry}` !== "") params.set("postedDocEntry", String(source.postedDocEntry));
  if (source.sourceDraftNumber != null && source.sourceDraftNumber > 0) params.set("sourceDraftNumber", String(source.sourceDraftNumber));
  if (source.approvalRequestCode != null && source.approvalRequestCode > 0) params.set("approvalRequestCode", String(source.approvalRequestCode));
  if (source.cardType) params.set("cardType", source.cardType);
  if (source.isProductionLinked === true) params.set("isProductionLinked", "1");
  if (source.isProductionLinked === false) params.set("isProductionLinked", "0");
  return `/dashboard/messages?${params.toString()}`;
}

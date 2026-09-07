import { ApprovalTemplate } from "@/types/template.type";

export const APPROVED_DOC_EDIT_BLOCKED_MSG =
  "Approved documents can only be created, not edited. Please contact your administrator.";

type ApprovalDoc = Record<string, any>;

function num(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function pick(doc: ApprovalDoc, ...keys: string[]): number | null {
  for (const k of keys) {
    if (doc[k] !== undefined && doc[k] !== null && doc[k] !== "") return num(doc[k]);
  }
  return null;
}

function resolveDocValue(conditionType: string, doc: ApprovalDoc): number | null {
  const c = (conditionType || "").toLowerCase();

  if (c.includes("discount")) return pick(doc, "DiscountPercent", "discountPercent");
  if (c.includes("beforediscount") || c.includes("beforetax") || c.includes("grossvalue")) {
    return pick(doc, "TotalBeforeDiscount", "totalBeforeDiscount");
  }
  if (c.includes("total") || c.includes("amount") || c.includes("value")) {
    return pick(doc, "DocTotal", "docTotal", "TotalBeforeDiscount");
  }
  return null;
}

function compare(actual: number, operationType: string, target: number): boolean {
  const o = (operationType || "").toLowerCase();

  if (o.includes("greaterorequal") || o.includes("greaterthanorequal")) return actual >= target;
  if (o.includes("lessorequal") || o.includes("lessthanorequal")) return actual <= target;
  if (o.includes("notequal")) return actual !== target;
  if (o.includes("greater")) return actual > target;
  if (o.includes("less")) return actual < target;
  if (o.includes("equal")) return actual === target;
  return true;
}

function templateStillMet(template: ApprovalTemplate, doc: ApprovalDoc): boolean {
  if ((template.UseTerms ?? "").toLowerCase() !== "tyes") return true;
  if (Array.isArray(template.ApprovalTemplateQueries) && template.ApprovalTemplateQueries.length > 0) return true;

  const terms = template.ApprovalTemplateTerms ?? [];
  if (terms.length === 0) return true;

  for (const term of terms) {
    const actual = resolveDocValue(term.ConditionType, doc);
    if (actual === null) return true;
    if (compare(actual, term.OperationType, num(term.Value))) return true;
  }
  return false;
}

export function stillMeetsApprovalCondition(
  templates: ApprovalTemplate[] | null | undefined,
  doc: ApprovalDoc
): boolean {
  if (!templates || templates.length === 0) return true;
  return templates.some((t) => templateStillMet(t, doc));
}

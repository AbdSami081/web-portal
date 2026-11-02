export function isCustomApprovalEngineResult(result: unknown): boolean {
  if (!result || typeof result !== "object") return false;
  const r = result as Record<string, unknown>;
  return r.ApprovalEngine === "CUSTOM" || r.Engine === "CUSTOM";
}

export function getApprovalBadgeFromResult(result: unknown): "SAP" | "WP" | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  if (r.ApprovalBadge === "WP" || isCustomApprovalEngineResult(result)) return "WP";
  if (r.IsDraft) return "SAP";
  return null;
}

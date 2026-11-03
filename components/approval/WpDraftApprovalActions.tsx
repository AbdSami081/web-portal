"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { restoreWpDraft } from "@/api+/sap/Templates/approvalTemplate";
import type { ApprovalHeaderStatus } from "@/lib/approval/approvalHeaderBadge";

export function WpDraftApprovalActions({
  engine,
  status,
  draftEntry,
}: {
  engine?: string | null;
  status: ApprovalHeaderStatus | null;
  draftEntry?: number | null;
}) {
  const [busy, setBusy] = useState(false);
  if (engine !== "WP" || !draftEntry || draftEntry <= 0 || status !== "canceled") return null;

  const run = async () => {
    setBusy(true);
    try {
      const result = await restoreWpDraft(draftEntry);
      toast.success(result?.Message || "Approval updated.");
      window.location.reload();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { Message?: string; message?: string } } })?.response?.data;
      toast.error(data?.Message || data?.message || "Approval update failed.");
      setBusy(false);
    }
  };

  return (
    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={run}>
      Restore
    </Button>
  );
}

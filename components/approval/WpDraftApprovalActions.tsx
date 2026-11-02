"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelWpDraft, restoreWpDraft } from "@/api+/sap/Templates/approvalTemplate";
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
  if (engine !== "WP" || !draftEntry || draftEntry <= 0 || !status) return null;
  if (status !== "pending" && status !== "canceled") return null;

  const run = async (action: "cancel" | "restore") => {
    setBusy(true);
    try {
      const result =
        action === "cancel"
          ? await cancelWpDraft(draftEntry)
          : await restoreWpDraft(draftEntry);
      toast.success(result?.Message || "Approval updated.");
      window.location.reload();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { Message?: string; message?: string } } })?.response?.data;
      toast.error(data?.Message || data?.message || "Approval update failed.");
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex gap-1 align-middle">
      {status === "pending" && (
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => run("cancel")}>
          Cancel
        </Button>
      )}
      {status === "canceled" && (
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => run("restore")}>
          Restore
        </Button>
      )}
    </span>
  );
}

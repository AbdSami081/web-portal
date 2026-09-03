"use client";

import React from "react";
import { SearchCode, Loader2 } from "lucide-react";
import { useFmsContext } from "@/hooks/useFMS";

interface Props {
  /** The target form field this FMS rule populates (e.g. "Comments", "U_Brand"). */
  field: string;
  className?: string;
  /** Icon size in px. */
  size?: number;
  /**
   * When provided, the resolved value is handed here instead of being written to
   * the React-Hook-Form field. Use for line rows: onApply={(v) => updateLine(id, { [field]: v })}
   */
  onApply?: (value: string) => void;
  /** Extra key/value context merged into the query params (e.g. the current line). */
  context?: Record<string, string>;
}

/**
 * Search icon shown next to a field when an FMS (User-Defined Values) rule is
 * configured for it. Click — or press Shift+F2 while focused in the field — to
 * run the configured query and populate the field.
 */
export function FmsFieldButton({ field, className = "", size = 14, onApply, context }: Props) {
  const { hasFMS, triggerFMS, runFmsForTarget } = useFmsContext();
  const [busy, setBusy] = React.useState(false);

  if (!hasFMS(field)) return null;

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (onApply) {
        await runFmsForTarget(field, context, onApply);
      } else {
        await triggerFMS(field);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      title="Run formatted search (Shift+F2)"
      aria-label={`Run formatted search for ${field}`}
      onClick={run}
      className={`inline-flex items-center justify-center rounded-md p-1 text-slate-600 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${className}`}
    >
      {busy ? (
        <Loader2 style={{ width: size, height: size }} className="animate-spin text-blue-700" />
      ) : (
        <SearchCode style={{ width: size, height: size }} />
      )}
    </button>
  );
}

/**
 * Attach to a field's onKeyDown to trigger its FMS rule with Shift+F2.
 * Usage: onKeyDown={fmsKeyDown("Comments", triggerFMS)}
 */
export function fmsKeyDown(
  field: string,
  triggerFMS: (f: string) => Promise<void> | void
) {
  return (e: React.KeyboardEvent) => {
    if (e.shiftKey && e.key === "F2") {
      e.preventDefault();
      void triggerFMS(field);
    }
  };
}

export default FmsFieldButton;

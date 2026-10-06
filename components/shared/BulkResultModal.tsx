"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export type BulkResultStatus = "success" | "error" | "warning";

export interface BulkResultRow {
  label: string;
  status: BulkResultStatus;
  detail?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  rows: BulkResultRow[];
}

const STATUS_CONFIG: Record<BulkResultStatus, { icon: typeof CheckCircle2; text: string; dot: string }> = {
  success: { icon: CheckCircle2, text: "text-emerald-600", dot: "bg-emerald-500" },
  error: { icon: XCircle, text: "text-red-600", dot: "bg-red-500" },
  warning: { icon: AlertTriangle, text: "text-amber-600", dot: "bg-amber-500" },
};

export function BulkResultModal({ open, onClose, title, rows }: Props) {
  const successCount = rows.filter((r) => r.status === "success").length;
  const warningCount = rows.filter((r) => r.status === "warning").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] flex flex-col p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 text-xs font-semibold px-0.5 shrink-0">
          {successCount > 0 && (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {successCount} succeeded
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {warningCount} skipped
            </span>
          )}
          {errorCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {errorCount} failed
            </span>
          )}
        </div>

        <ScrollArea className="flex-1 border rounded-md min-h-0 mt-1">
          <div className="divide-y">
            {rows.map((row, i) => {
              const cfg = STATUS_CONFIG[row.status];
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-start gap-2 px-3 py-2 text-sm">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.text}`} />
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">{row.label}</div>
                    {row.detail && <div className="text-xs text-slate-500">{row.detail}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

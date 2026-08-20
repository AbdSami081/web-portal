"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApprovalTemplate } from "@/types/template.type";

interface RequestDocumentGenerationModalProps {
  open: boolean;
  onClose: () => void;
  templates: ApprovalTemplate[];
  /** Called with the per-template remarks. The caller performs the actual document
   *  submission (which triggers SAP's native approval request creation). */
  onConfirm?: (remarksMap: Record<number, string>) => void | Promise<void>;
}

export function RequestDocumentGenerationModal({
  open,
  onClose,
  templates,
  onConfirm,
}: RequestDocumentGenerationModalProps) {
  const [remarksMap, setRemarksMap] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (templates && templates.length > 0) {
      const initial: Record<number, string> = {};
      templates.forEach((t) => {
        initial[t.Code] = t.Remarks || "";
      });
      setRemarksMap(initial);
    }
  }, [templates]);

  const handleRemarkChange = (code: number, val: string) => {
    setRemarksMap((prev) => ({ ...prev, [code]: val }));
  };

  const handleOk = async () => {
    setIsSubmitting(true);
    try {
      if (onConfirm) {
        await onConfirm(remarksMap);
      }
      onClose();
    } catch (error: any) {
      console.error("Submit document for approval error:", error);
      const data = error?.response?.data;
      const msg = data?.Message || error?.message || "Failed to submit document for approval.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border border-neutral-200 shadow-lg rounded-lg bg-white">
        <DialogHeader className="px-5 py-3 border-b border-neutral-200 bg-neutral-900 text-white flex flex-col justify-between">
          <DialogTitle className="text-sm font-bold text-white tracking-wide">
            Request for Document Generation
          </DialogTitle>
          <DialogDescription className="sr-only">
            Request approval for document generation
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-3 text-[12px] text-neutral-800">
          <div className="border border-neutral-200 rounded bg-white overflow-hidden">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-2 px-3 border-r border-neutral-200 w-10 text-center">#</th>
                  <th className="py-2 px-3 border-r border-neutral-200 w-1/2">
                    Approval Template
                  </th>
                  <th className="py-2 px-3 flex items-center justify-between">
                    <span>Remarks</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {templates.map((tpl, index) => (
                  <tr
                    key={tpl.Code || index}
                    className="hover:bg-neutral-50/80 transition-colors"
                  >
                    <td className="py-1.5 px-3 border-r border-neutral-200 text-center font-medium text-neutral-500 bg-neutral-50/50">
                      {index + 1}
                    </td>
                    <td className="py-1.5 px-3 border-r border-neutral-200 text-neutral-900 font-medium">
                      {tpl.Name}
                    </td>
                    <td className="py-1 px-1.5">
                      <div className="flex items-center border border-neutral-300 rounded bg-white focus-within:ring-1 focus-within:ring-neutral-900 focus-within:border-neutral-900">
                        <Input
                          value={remarksMap[tpl.Code] ?? ""}
                          onChange={(e) =>
                            handleRemarkChange(tpl.Code, e.target.value)
                          }
                          disabled={isSubmitting}
                          className="h-8 border-0 bg-transparent text-[12px] px-2 focus-visible:ring-0 rounded-none shadow-none text-neutral-900 placeholder:text-neutral-400"
                          placeholder="Enter remarks..."
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 3 - templates.length) }).map(
                  (_, i) => (
                    <tr key={`empty-${i}`} className="h-8">
                      <td className="border-r border-neutral-200 bg-neutral-50/30"></td>
                      <td className="border-r border-neutral-200"></td>
                      <td></td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="p-3 px-5 bg-neutral-50 border-t border-neutral-200 flex flex-row justify-end items-center gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300 h-8 px-4 text-[12px] font-medium rounded shadow-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleOk}
            disabled={isSubmitting}
            className="bg-neutral-900 hover:bg-neutral-800 text-white h-8 px-5 text-[12px] font-medium rounded shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-white" />
                Submitting...
              </>
            ) : (
              "OK"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { DOCUMENT_SPECIAL_RIGHTS_ACTIONS } from "@/lib/config/rightsConfig";
import { DocumentRightsChecklist } from "@/components/shared/DocumentRightsChecklist";

interface Props {
  open: boolean;
  onClose: () => void;
  menuId: string;
  documentType?: number | string;
  documentTitle: string;
  user: { empId: string; fullName: string };
  actions?: readonly string[];
}

export function DocumentSpecialRightsModal({
  open,
  onClose,
  menuId,
  documentType,
  documentTitle,
  user,
  actions = DOCUMENT_SPECIAL_RIGHTS_ACTIONS,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white border-zinc-200 shadow-2xl rounded-2xl max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            Special Rights — {documentTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed">
            Configure which document actions <span className="font-bold text-slate-900">{user.fullName}</span> (ID: {user.empId}) can perform.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <DocumentRightsChecklist
            menuId={menuId}
            documentType={documentType}
            user={user}
            actions={actions}
            onSaved={onClose}
          />
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} className="h-9 px-4 text-xs font-bold border-slate-200">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

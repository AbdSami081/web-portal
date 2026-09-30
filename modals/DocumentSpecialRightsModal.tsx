"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  getDocumentRights,
  saveDocumentRights,
  DOCUMENT_SPECIAL_RIGHTS_ACTIONS,
} from "@/api+/sap/authorization/authorizationService";

const ACTION_LABELS: Record<string, string> = {
  Print: "Print",
  FMS: "FMS",
  FieldInspector: "Field Inspector",
  RelationshipMap: "Relationship Map",
  CloseDocument: "Close Document",
  Bell: "Bell / Notifications",
};

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    getDocumentRights(menuId, user.empId)
      // Rows in @SP_WP__DOC_Rights are now DENIALS, not grants — rights are
      // allowed by default, so a checkbox is "checked" (has the right)
      // whenever the action is NOT in the stored (denied) list.
      .then((deniedActions) => setSelectedActions(actions.filter((a) => !deniedActions.includes(a))))
      .catch((error: any) =>
        toast.error(error?.response?.data?.message || "Failed to load document rights")
      )
      .finally(() => setLoading(false));
  }, [open, menuId, user.empId]);

  const toggleAction = (action: string) => {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist the complement: unchecked boxes are the explicit denials we store.
      const deniedActions = actions.filter((a) => !selectedActions.includes(a));
      await saveDocumentRights(menuId, documentType, user.empId, deniedActions);
      toast.success("Document rights saved successfully");
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save document rights");
    } finally {
      setSaving(false);
    }
  };

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

        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {actions.map((action) => (
              <label
                key={action}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"
              >
                <span className="text-sm font-bold text-slate-700">{ACTION_LABELS[action] || action}</span>
                <Checkbox
                  checked={selectedActions.includes(action)}
                  onCheckedChange={() => toggleAction(action)}
                  className="h-4 w-4 border-slate-400 data-[state=checked]:bg-slate-900 border-2 rounded"
                />
              </label>
            ))}
          </div>
        )}

        <DialogFooter className="pt-2 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={saving} className="h-9 px-4 text-xs font-bold border-slate-200">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="h-9 px-6 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  getDocumentRights,
  saveDocumentRights,
} from "@/api+/sap/authorization/authorizationService";
import { DOCUMENT_SPECIAL_RIGHTS_ACTIONS, ACTION_LABELS } from "@/lib/config/rightsConfig";

export { ACTION_LABELS };

interface Props {
  menuId: string;
  documentType?: number | string;
  user: { empId: string; fullName: string };
  actions?: readonly string[];
  onSaved?: () => void;
}

export function DocumentRightsChecklist({
  menuId,
  documentType,
  user,
  actions = DOCUMENT_SPECIAL_RIGHTS_ACTIONS,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    getDocumentRights(menuId, user.empId)
      .then((deniedActions) => setSelectedActions(actions.filter((a) => !deniedActions.includes(a))))
      .catch((error: any) =>
        toast.error(error?.response?.data?.message || "Failed to load document rights")
      )
      .finally(() => setLoading(false));
  }, [menuId, user.empId]);

  const toggleAction = (action: string) => {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const deniedActions = actions.filter((a) => !selectedActions.includes(a));
      await saveDocumentRights(menuId, documentType, user.empId, deniedActions);
      toast.success("Document rights saved successfully");
      onSaved?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save document rights");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-1">
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

      <Button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 h-9 px-6 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm disabled:opacity-50"
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Changes
      </Button>
    </div>
  );
}

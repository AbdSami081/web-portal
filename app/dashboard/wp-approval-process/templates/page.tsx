"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { WpApprovalProcessShell } from "@/components/administration/wp-approval-process/WpApprovalProcessShell";
import {
  deleteTemplate,
  fetchTemplates,
  updateTemplate,
} from "@/api+/sap/approval-process/approvalProcessService";
import { getApiErrorMessage } from "@/lib/approval-process/apiErrors";
import { WP_TEMPLATES_LIST_SUBTITLE } from "@/lib/approval-process/page-copy";
import type { WpApprovalTemplate } from "@/types/approval-process/wp-approval.types";

export default function WpTemplatesListPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WpApprovalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await fetchTemplates());
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load approval templates."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleNew = () => {
    router.push("/dashboard/wp-approval-process/templates/new");
  };

  const handleActiveChange = async (template: WpApprovalTemplate, active: "Y" | "N") => {
    try {
      await updateTemplate({ ...template, active });
      setTemplates((current) =>
        current.map((row) => (row.code === template.code ? { ...row, active } : row))
      );
      toast.success(active === "Y" ? "Template is active." : "Template is inactive and will not apply to documents.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update template status."));
    }
  };

  const handleDelete = async (code: string) => {
    try {
      await deleteTemplate(code);
      toast.success("Template deleted.");
      load();
    } catch {
      toast.error("Failed to delete template.");
    }
  };

  return (
    <WpApprovalProcessShell
      title="Approval Templates"
      subtitle={WP_TEMPLATES_LIST_SUBTITLE}
      actions={
        <Button size="sm" onClick={handleNew} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      }
    >
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.code}>
                    <TableCell className="font-mono text-xs text-slate-600">{t.code}</TableCell>
                    <TableCell className="font-medium text-slate-800">{t.templateName}</TableCell>
                    <TableCell>{t.conds === "Y" ? "Yes" : "No"}</TableCell>
                    <TableCell>{t.priority}</TableCell>
                    <TableCell>
                      <Select
                        value={t.active === "N" ? "N" : "Y"}
                        onValueChange={(value) => handleActiveChange(t, value as "Y" | "N")}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Active</SelectItem>
                          <SelectItem value="N">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" asChild>
                        <Link
                          href={`/dashboard/wp-approval-process/templates/${encodeURIComponent(t.code)}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(t.code)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </WpApprovalProcessShell>
  );
}

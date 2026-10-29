"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import {
  FmsConfigDto,
  getApprovalFmsConfigs,
  deleteFmsConfig,
} from "@/api+/sap/fms/fmsService";
import { getTemplateDocuments } from "@/api+/sap/Templates/approvalTemplate";
import { ApprovalTemplate } from "@/types/template.type";
import { SERVER_MENUS, collectLeafItems } from "@/lib/menu-data";
import FMSSetupModal from "@/modals/FMSSetupModal";

const DOC_TYPE_OPTIONS = collectLeafItems(SERVER_MENUS).filter(
  (item) => item.objectCode !== undefined && item.objectCode !== null
);

export default function ApprovalTemplatePage() {
  const [rules, setRules] = useState<FmsConfigDto[]>([]);
  const [templates, setTemplates] = useState<ApprovalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDocType, setEditingDocType] = useState<number>(0);

  const docTypeLabel = useMemo(() => {
    const map = new Map<string, string>();
    DOC_TYPE_OPTIONS.forEach((d) => map.set(String(d.objectCode), d.title));
    return (docType: number) => map.get(String(docType)) ?? `DocType ${docType}`;
  }, []);

  const templateLabel = useMemo(() => {
    const map = new Map<number, string>();
    templates.forEach((t) => map.set(t.Code, t.Name));
    return (code?: number) => (code ? map.get(code) ?? `Template ${code}` : "—");
  }, [templates]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await getApprovalFmsConfigs();
      setRules(data);
    } catch {
      toast.error("Failed to load approval rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
    getTemplateDocuments().then(setTemplates).catch(() => setTemplates([]));
  }, []);

  const handleNew = () => {
    setEditingDocType(0);
    setModalOpen(true);
  };

  const handleDelete = async (code: string) => {
    try {
      await deleteFmsConfig(code);
      toast.success("Approval rule deleted.");
      loadRules();
    } catch {
      toast.error("Failed to delete approval rule.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase text-slate-800">Approval Template</h1>
            <p className="text-xs text-slate-500">
              Route documents to a SAP approval template based on a query.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleNew} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Rule
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading rules...</span>
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <p className="text-sm font-medium text-slate-600">No approval rules defined</p>
            <p className="text-xs mt-1">Click "New Rule" to route a document type to a template.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules
                  .slice()
                  .sort((a, b) => a.docType - b.docType || (a.priority ?? 0) - (b.priority ?? 0))
                  .map((rule) => (
                    <TableRow key={rule.code}>
                      <TableCell className="font-medium text-slate-800">{docTypeLabel(rule.docType)}</TableCell>
                      <TableCell>{templateLabel(rule.templateCode)}</TableCell>
                      <TableCell>
                        {rule.apprUserIds ? (
                          <Badge variant="outline" className="text-[10px]">
                            {rule.apprUserIds.split(",").filter(Boolean).length} user(s)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">All users</Badge>
                        )}
                      </TableCell>
                      <TableCell>{rule.priority ?? 0}</TableCell>
                      <TableCell>
                        <Badge className={rule.isActive === "Y" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                          {rule.isActive === "Y" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingDocType(rule.docType);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(rule.code)}
                          className="text-red-500 hover:text-red-600"
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

      <FMSSetupModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          loadRules();
        }}
        docType={editingDocType}
        purpose="approval"
      />
    </div>
  );
}

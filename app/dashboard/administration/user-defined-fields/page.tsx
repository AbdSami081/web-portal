"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SERVER_MENUS, collectLeafItems } from "@/lib/menu-data";
import { getFieldCatalog } from "@/lib/config/fieldManifest";
import {
  deleteFmsConfig,
  getFmsConfigs,
  getFmsFields,
  getFmsQueries,
  saveFmsConfig,
  type FmsConfigDto,
} from "@/api+/sap/fms/fmsService";

type FieldRow = {
  name: string;
  title: string;
  scope: "H" | "L" | "F" | "UDF";
};

type Assignment = {
  configCode: string;
  queryCode: string;
  triggerType: "Manual" | "Auto";
  triggerField: string;
  existingQuery: boolean;
};

const FOOTER_FIELDS = new Set([
  "Comments",
  "TotalBeforeDiscount",
  "DiscountPercent",
  "DiscountSum",
  "TotalFreight",
  "Rounding",
  "TaxTotal",
  "DocTotal",
  "DownPaymentPercentage",
  "DownPaymentAmount",
]);

const KEEP = "__keep__";
const NONE = "__none__";

const DOCUMENTS = collectLeafItems(SERVER_MENUS).filter(
  (item) => item.objectCode !== undefined && item.objectCode !== null && item.url.startsWith("/dashboard/")
);

function scopeOf(name: string, area: "header" | "line"): FieldRow["scope"] {
  if (area === "line") return "L";
  return FOOTER_FIELDS.has(name) ? "F" : "H";
}

function scopeLabel(scope: string) {
  if (scope === "L") return "Line";
  if (scope === "F") return "Footer";
  if (scope === "UDF") return "UDF";
  return "Header";
}

export default function UserDefinedFieldsPage() {
  const searchParams = useSearchParams();
  const initialDoc = searchParams.get("docType") ?? "";
  const initialMenu = DOCUMENTS.find((item) => String(item.objectCode) === initialDoc)?.id ?? "";
  const [menuId, setMenuId] = useState(initialMenu);
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [queries, setQueries] = useState<FmsConfigDto[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedDocument = useMemo(
    () => DOCUMENTS.find((item) => item.id === menuId) ?? null,
    [menuId]
  );

  useEffect(() => {
    getFmsQueries().then(setQueries).catch(() => setQueries([]));
  }, []);

  useEffect(() => {
    if (!selectedDocument) {
      setFields([]);
      setAssignments({});
      return;
    }
    const code = Number(selectedDocument.objectCode);
    let cancelled = false;
    setLoading(true);
    Promise.all([getFmsFields(code), getFmsConfigs(code)])
      .then(([apiFields, configs]) => {
        if (cancelled) return;
        const catalog = getFieldCatalog(selectedDocument.url, selectedDocument.objectCode);
        const rows = new Map<string, FieldRow>();
        catalog?.header.forEach((field) => {
          rows.set(field.key, { name: field.key, title: field.title || field.key, scope: scopeOf(field.key, "header") });
        });
        catalog?.line.forEach((field) => {
          rows.set(field.key, { name: field.key, title: field.title || field.key, scope: "L" });
        });
        apiFields.forEach((field) => {
          const scope = field.fieldType === "L" || field.fieldType === "F" || field.fieldType === "UDF"
            ? field.fieldType
            : "H";
          rows.set(field.name, { name: field.name, title: field.title || field.name, scope });
        });

        const queryCodes = new Set(queries.map((query) => query.code));
        const next: Record<string, Assignment> = {};
        configs.forEach((config) => {
          if (!config.targetField) return;
          const linked = config.apprUserIds && queryCodes.has(config.apprUserIds);
          next[config.targetField] = {
            configCode: config.code,
            queryCode: linked ? config.apprUserIds! : KEEP,
            triggerType: config.triggerType === "Auto" ? "Auto" : "Manual",
            triggerField: config.triggerField || "",
            existingQuery: !linked && !!config.queryText,
          };
          if (!rows.has(config.targetField)) {
            rows.set(config.targetField, {
              name: config.targetField,
              title: config.fieldTitle || config.targetField,
              scope: config.fieldScope === "L" || config.fieldScope === "F" || config.fieldScope === "UDF"
                ? config.fieldScope
                : "H",
            });
          }
        });
        setFields([...rows.values()]);
        setAssignments(next);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load document fields.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDocument, queries]);

  const updateAssignment = (field: string, patch: Partial<Assignment>) => {
    setAssignments((current) => ({
      ...current,
      [field]: {
        configCode: current[field]?.configCode ?? "",
        queryCode: current[field]?.queryCode ?? NONE,
        triggerType: current[field]?.triggerType ?? "Manual",
        triggerField: current[field]?.triggerField ?? "",
        existingQuery: current[field]?.existingQuery ?? false,
        ...patch,
      },
    }));
  };

  const save = async () => {
    if (!selectedDocument) return;
    const code = Number(selectedDocument.objectCode);
    setSaving(true);
    try {
      for (const field of fields) {
        const assignment = assignments[field.name];
        if (!assignment) continue;
        if (assignment.queryCode === KEEP) continue;
        if (!assignment.queryCode || assignment.queryCode === NONE) {
          if (assignment.configCode) await deleteFmsConfig(assignment.configCode);
          continue;
        }
        const query = queries.find((item) => item.code === assignment.queryCode);
        if (!query) continue;
        await saveFmsConfig({
          code: assignment.configCode,
          docType: code,
          targetField: field.name,
          fieldTitle: field.title,
          fieldScope: field.scope,
          queryText: query.queryText,
          triggerType: assignment.triggerType,
          triggerField: assignment.triggerType === "Auto" ? assignment.triggerField : "",
          isActive: "Y",
          isForApproval: "F",
          apprUserIds: query.code,
        });
      }
      toast.success("Field assignments saved.");
      const configs = await getFmsConfigs(code);
      setAssignments((current) => {
        const next = { ...current };
        configs.forEach((config) => {
          if (!config.targetField || !next[config.targetField]) return;
          next[config.targetField] = {
            ...next[config.targetField],
            configCode: config.code,
            existingQuery: false,
          };
        });
        return next;
      });
    } catch {
      toast.error("Failed to save field assignments.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-base font-semibold text-slate-900">User-Defined Values</h1>
        <Button type="button" onClick={save} disabled={!selectedDocument || saving || loading}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <label className="w-28 text-sm text-slate-700" htmlFor="udf-document">
            Document
          </label>
          <Select value={menuId || undefined} onValueChange={setMenuId}>
            <SelectTrigger id="udf-document" className="h-9 w-80">
              <SelectValue placeholder="Select a document" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENTS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedDocument ? (
          <p className="text-sm text-slate-500">Select a document to load its fields.</p>
        ) : loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto rounded border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="w-72">Query</TableHead>
                  <TableHead className="w-44">Refresh</TableHead>
                  <TableHead className="w-56">When field changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field) => {
                  const assignment = assignments[field.name];
                  const queryValue = assignment?.queryCode || NONE;
                  return (
                    <TableRow key={field.name}>
                      <TableCell>
                        <div className="text-sm text-slate-900">{field.title}</div>
                        <div className="font-mono text-[11px] text-slate-500">{field.name}</div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{scopeLabel(field.scope)}</TableCell>
                      <TableCell>
                        <Select
                          value={queryValue}
                          onValueChange={(value) => updateAssignment(field.name, { queryCode: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="No query" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>No query</SelectItem>
                            {assignment?.existingQuery ? (
                              <SelectItem value={KEEP}>Current field query</SelectItem>
                            ) : null}
                            {queries.map((query) => (
                              <SelectItem key={query.code} value={query.code}>
                                {query.fieldTitle || query.name || "Query"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={assignment?.triggerType ?? "Manual"}
                          onValueChange={(value) =>
                            updateAssignment(field.name, { triggerType: value === "Auto" ? "Auto" : "Manual" })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Manual">Manual</SelectItem>
                            <SelectItem value="Auto">When field changes</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {assignment?.triggerType === "Auto" ? (
                          <Select
                            value={assignment.triggerField || undefined}
                            onValueChange={(value) => updateAssignment(field.name, { triggerField: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {fields
                                .filter((item) => item.name !== field.name)
                                .map((item) => (
                                  <SelectItem key={item.name} value={item.name}>
                                    {item.title}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-slate-400">Shift+F2</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

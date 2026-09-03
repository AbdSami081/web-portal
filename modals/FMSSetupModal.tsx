"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  Plus,
  Save,
  Info,
  CheckCircle2,
  XCircle,
  SearchCode,
  Search,
  Zap,
  Code2,
  Play,
  FileCode,
  Layers,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  FmsConfigDto,
  FmsExecuteResult,
  FmsFieldOption,
  getFmsConfigs,
  getFmsFields,
  saveFmsConfig,
  deleteFmsConfig,
  testFmsQuery,
} from "@/api+/sap/fms/fmsService";
import { useFmsStore } from "@/stores/useFmsStore";

const COMMON_PARAMS = [
  "CardCode",
  "CardName",
  "DocDate",
  "DocDueDate",
  "DocNum",
  "DocEntry",
  "DocTotal",
  "ItemCode",
  "Quantity",
  "Price",
  "WhsCode",
  "SlpCode",
  "U_Branch",
  "Currency",
];

const COMMON_TRIGGER_FIELDS = [
  "CardCode",
  "DocDate",
  "DocDueDate",
  "Comments",
  "ItemCode",
  "Quantity",
  "Price",
];

const SCOPE_META: Record<string, { label: string; cls: string; full: string }> = {
  H: { label: "H", full: "Header", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  L: { label: "L", full: "Line", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  F: { label: "F", full: "Footer", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  UDF: { label: "UDF", full: "User-Defined Field", cls: "bg-violet-100 text-violet-700 border-violet-200" },
};

const normalizeScope = (s?: string | null): "H" | "L" | "F" | "UDF" => {
  const u = (s ?? "").trim().toUpperCase();
  return u === "L" || u === "F" || u === "UDF" ? (u as any) : "H";
};

function ScopeBadge({ scope, className = "" }: { scope?: string | null; className?: string }) {
  const meta = SCOPE_META[normalizeScope(scope)];
  return (
    <span
      title={meta.full}
      className={`inline-flex items-center rounded border px-1 text-[9px] font-bold leading-4 ${meta.cls} ${className}`}
    >
      {meta.label}
    </span>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  docType: number;
  docTypeName?: string;
  defaultTargetField?: string;
  availableFields?: Array<{ name: string; title: string }>;
}

const FMSSetupModal: React.FC<Props> = ({
  open,
  onClose,
  docType,
  docTypeName,
  defaultTargetField,
  availableFields = [],
}) => {
  const { setConfigs } = useFmsStore();

  const [configs, setLocalConfigs] = useState<FmsConfigDto[]>([]);
  const [fetchedFields, setFetchedFields] = useState<FmsFieldOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<FmsExecuteResult | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const [targetField, setTargetField] = useState(defaultTargetField ?? "");
  const [fieldTitle, setFieldTitle] = useState("");
  const [fieldScope, setFieldScope] = useState<"H" | "L" | "F" | "UDF">("H");
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [queryText, setQueryText] = useState("");
  const [triggerType, setTriggerType] = useState<"Manual" | "Auto">("Manual");
  const [triggerField, setTriggerField] = useState("");
  const [testContext, setTestContext] = useState<Record<string, string>>({});

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFmsConfigs(docType);
      setLocalConfigs(data);
      setConfigs(docType, data);
    } catch {
      toast.error("Failed to load FMS configurations.");
    } finally {
      setLoading(false);
    }
  }, [docType, setConfigs]);

  useEffect(() => {
    if (open) {
      loadConfigs();
      getFmsFields(docType)
        .then(setFetchedFields)
        .catch(() => setFetchedFields([]));
      resetForm();
      if (defaultTargetField) setTargetField(defaultTargetField);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge explicitly-passed fields with the API list (@WP_FIELDS_CFG + real UDFs),
  // de-duplicated by field name.
  const fieldOptions: FmsFieldOption[] = React.useMemo(() => {
    const seen = new Set<string>();
    const out: FmsFieldOption[] = [];
    for (const f of [...availableFields, ...fetchedFields]) {
      const key = f.name?.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(f as FmsFieldOption);
    }
    return out;
  }, [availableFields, fetchedFields]);

  const selectedOption = fieldOptions.find((f) => f.name === targetField);

  const resetForm = () => {
    setSelectedCode(null);
    setTargetField(defaultTargetField ?? "");
    setFieldTitle("");
    setFieldScope("H");
    setQueryText("");
    setTriggerType("Manual");
    setTriggerField("");
    setTestResult(null);
    setTestContext({});
  };

  const loadIntoForm = (config: FmsConfigDto) => {
    setSelectedCode(config.code);
    setTargetField(config.targetField);
    setFieldTitle(config.fieldTitle);
    setFieldScope(normalizeScope(config.fieldScope));
    setQueryText(config.queryText);
    setTriggerType(config.triggerType === "Auto" ? "Auto" : "Manual");
    setTriggerField(config.triggerField ?? "");
    setTestResult(null);
  };

  const pickField = (opt: FmsFieldOption) => {
    setTargetField(opt.name);
    if (!fieldTitle || fieldTitle === targetField) setFieldTitle(opt.title || opt.name);
    if (opt.fieldType) setFieldScope(normalizeScope(opt.fieldType));
    setFieldPickerOpen(false);
  };

  const queryParams = [
    ...new Set(
      [...queryText.matchAll(/[:$@]([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1])
    ),
  ];

  const handleTest = async () => {
    if (!queryText.trim()) {
      toast.warning("Enter a query to test.");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testFmsQuery({ queryText, formContext: testContext });
      setTestResult(res);
      if (!res.success) {
        toast.error(res.errorMessage || "Query execution failed.");
      } else {
        toast.success("Query executed successfully.");
      }
    } catch (e: any) {
      const errMsg =
        e?.response?.data?.ErrorMessage ||
        e?.response?.data?.errorMessage ||
        (typeof e?.response?.data === "string" ? e?.response?.data : null) ||
        e?.message ||
        "Test failed.";
      toast.error(errMsg);
      setTestResult({
        success: false,
        errorMessage: errMsg,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!targetField.trim()) {
      toast.warning("Target field is required.");
      return;
    }
    if (!queryText.trim()) {
      toast.warning("SQL query is required.");
      return;
    }

    setSaving(true);
    try {
      const payload: FmsConfigDto = {
        code: selectedCode ?? "",
        name: fieldTitle || targetField,
        docType,
        targetField,
        fieldTitle: fieldTitle || targetField,
        fieldScope,
        queryText,
        triggerType,
        triggerField: triggerType === "Auto" ? triggerField : null,
        isActive: "Y",
      };
      const res = await saveFmsConfig(payload);
      toast.success(
        `FMS configuration ${selectedCode ? "updated" : "saved"} successfully.`
      );
      await loadConfigs();
      setSelectedCode(res.code);
    } catch (e: any) {
      const errMsg =
        e?.response?.data?.ErrorMessage ||
        e?.response?.data?.errorMessage ||
        (typeof e?.response?.data === "string" ? e?.response?.data : null) ||
        e?.message ||
        "Failed to save configuration.";
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    try {
      await deleteFmsConfig(code);
      toast.success("FMS configuration deleted.");
      await loadConfigs();
      if (selectedCode === code) resetForm();
    } catch {
      toast.error("Failed to delete configuration.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="!max-w-5xl sm:max-w-5xl w-[95vw] h-[88vh] max-h-[880px] p-0 flex flex-col gap-0 overflow-hidden shadow-2xl rounded-2xl border border-slate-200 bg-white">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 via-white to-blue-50/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <SearchCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-slate-800">
                    User-Defined Values (FMS) Setup
                  </DialogTitle>
                  {docTypeName && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-medium text-xs border border-blue-200"
                    >
                      {docTypeName}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Configure SQL-based formatted searches for auto or manual field population.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Sidebar: Configured Rules */}
          <div className="w-80 border-r shrink-0 flex flex-col bg-slate-50/70">
            <div className="p-3.5 border-b flex items-center justify-between bg-white/60">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">
                  Configured Fields
                </span>
                <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-semibold text-slate-500">
                  {configs.length}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium"
                onClick={resetForm}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> New Rule
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-16 gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">Loading rules...</span>
                </div>
              ) : configs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-2">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">No FMS Rules Defined</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click &ldquo;New Rule&rdquo; to attach a query to any field.
                  </p>
                </div>
              ) : (
                configs.map((c) => {
                  const isSelected = selectedCode === c.code;
                  return (
                    <div
                      key={c.code}
                      onClick={() => loadIntoForm(c)}
                      className={`group relative flex items-start justify-between p-3 rounded-xl cursor-pointer border transition-all duration-150 ${
                        isSelected
                          ? "bg-white border-blue-400 shadow-sm ring-1 ring-blue-400/30"
                          : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-xs text-slate-800 truncate">
                          {c.fieldTitle || c.targetField}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                          {c.targetField}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          {c.triggerType === "Auto" ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] h-4.5 px-1.5 gap-1 font-normal">
                              <Zap className="w-2.5 h-2.5 text-emerald-600" />
                              Auto: {c.triggerField}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] h-4.5 px-1.5 gap-1 font-normal">
                              <Search className="w-2.5 h-2.5 text-slate-500" />
                              Manual
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.code);
                        }}
                        className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Panel: Editor */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">
            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
              {/* Target & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Target Field <span className="text-red-500">*</span>
                  </Label>
                  {fieldOptions.length > 0 ? (
                    <Popover open={fieldPickerOpen} onOpenChange={setFieldPickerOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded={fieldPickerOpen}
                          className="flex w-full h-9 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {targetField ? (
                              <>
                                <ScopeBadge scope={selectedOption?.fieldType ?? fieldScope} />
                                <span className="truncate font-mono text-slate-700">
                                  {targetField}
                                </span>
                                {selectedOption?.title &&
                                  selectedOption.title !== targetField && (
                                    <span className="truncate text-slate-400">
                                      — {selectedOption.title}
                                    </span>
                                  )}
                              </>
                            ) : (
                              <span className="text-slate-400">-- Select Target Field --</span>
                            )}
                          </span>
                          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="p-0 w-[--radix-popover-trigger-width] min-w-[320px]"
                        align="start"
                      >
                        <Command
                          filter={(value, search) =>
                            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                          }
                        >
                          <CommandInput
                            placeholder="Search, or type any field name..."
                            className="text-xs"
                            value={fieldSearch}
                            onValueChange={setFieldSearch}
                          />
                          <CommandList>
                            <CommandEmpty className="py-3 text-center text-xs text-slate-400">
                              No match — type a name and use “Custom” below.
                            </CommandEmpty>
                            {fieldSearch.trim() &&
                              !fieldOptions.some(
                                (f) => f.name.toLowerCase() === fieldSearch.trim().toLowerCase()
                              ) && (
                                <CommandGroup heading="Custom">
                                  <CommandItem
                                    value={`__custom__ ${fieldSearch}`}
                                    onSelect={() => {
                                      const nm = fieldSearch.trim();
                                      setTargetField(nm);
                                      if (!fieldTitle) setFieldTitle(nm);
                                      setFieldPickerOpen(false);
                                    }}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    <ScopeBadge scope={fieldScope} />
                                    <span className="font-mono text-slate-700">
                                      Use “{fieldSearch.trim()}”
                                    </span>
                                    <span className="ml-auto text-[10px] text-slate-400">
                                      set scope below
                                    </span>
                                  </CommandItem>
                                </CommandGroup>
                              )}
                            <CommandGroup heading="Fields">
                              {fieldOptions.map((f) => (
                                <CommandItem
                                  key={f.name}
                                  value={`${f.name} ${f.title}`}
                                  onSelect={() => pickField(f)}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <ScopeBadge scope={f.fieldType} />
                                  <span className="font-mono text-slate-700">{f.name}</span>
                                  {f.title && f.title !== f.name && (
                                    <span className="truncate text-slate-400">— {f.title}</span>
                                  )}
                                  {targetField === f.name && (
                                    <Check className="ml-auto w-3.5 h-3.5 text-blue-600" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Input
                      value={targetField}
                      onChange={(e) => setTargetField(e.target.value)}
                      placeholder="e.g. Comments, U_Brand, DocDueDate"
                      className="h-9 text-xs border-slate-200 focus:border-blue-500 shadow-xs rounded-lg"
                    />
                  )}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[11px] text-slate-400">Scope:</span>
                    {(["H", "L", "F", "UDF"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFieldScope(s)}
                        className={`rounded border px-1.5 text-[10px] font-bold leading-4 transition-colors ${
                          fieldScope === s
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                        }`}
                        title={
                          s === "H" ? "Header field" : s === "L" ? "Line field" : s === "F" ? "Footer field" : "User-defined field"
                        }
                      >
                        {s}
                      </button>
                    ))}
                    <span className="text-[10px] text-slate-400">
                      (H header · L line · F footer · UDF)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    The form field / UDF that receives the result. Any name works — pick from the
                    list or type a custom one. On a document: <b>Alt+Shift+I</b> (or the toolbar
                    “Inspect fields” button) shows field names on hover; <b>Shift+F2</b> in a
                    focused field runs its rule.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Display Label / Title
                  </Label>
                  <Input
                    value={fieldTitle}
                    onChange={(e) => setFieldTitle(e.target.value)}
                    placeholder="e.g. Customer Brand Code"
                    className="h-9 text-xs border-slate-200 focus:border-blue-500 shadow-xs rounded-lg"
                  />
                  <p className="text-[11px] text-slate-400">
                    Human-readable name for this rule.
                  </p>
                </div>
              </div>

              {/* Trigger Options */}
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Execution Trigger Mode
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Manual Card */}
                  <div
                    onClick={() => setTriggerType("Manual")}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      triggerType === "Manual"
                        ? "bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/60"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        triggerType === "Manual"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Manual Execution
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Executed via search icon on field or keyboard shortcut{" "}
                        <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[10px]">
                          Shift+F2
                        </code>
                        .
                      </p>
                    </div>
                  </div>

                  {/* Auto Refresh Card */}
                  <div
                    onClick={() => setTriggerType("Auto")}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      triggerType === "Auto"
                        ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/60"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        triggerType === "Auto"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Auto-Refresh on Field Change
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Automatically runs query and updates target when a source field value changes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auto Trigger Field Selection */}
                {triggerType === "Auto" && (
                  <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-2">
                    <Label className="text-xs font-semibold text-emerald-900">
                      Source Trigger Field (Watch this field for changes)
                    </Label>
                    <Input
                      value={triggerField}
                      onChange={(e) => setTriggerField(e.target.value)}
                      placeholder="e.g. CardCode, ItemCode"
                      className="h-8 text-xs bg-white border-emerald-300 focus:border-emerald-500"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-emerald-800 font-medium mr-1">
                        Quick Pick:
                      </span>
                      {COMMON_TRIGGER_FIELDS.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setTriggerField(f)}
                          className="text-[10px] font-mono bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-md px-2 py-0.5 transition-colors shadow-2xs"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SQL Query */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    SQL Query <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                    <Info className="w-3 h-3 text-slate-400" />
                    SELECT queries only
                  </div>
                </div>

                <div className="relative rounded-xl border border-slate-200 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                  <Textarea
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    rows={6}
                    placeholder={`SELECT "CardName" FROM OCRD WHERE "CardCode" = :CardCode`}
                    className="font-mono text-xs p-3.5 border-0 focus-visible:ring-0 resize-none bg-slate-900 text-emerald-300 leading-relaxed tracking-wide"
                    spellCheck={false}
                  />
                </div>

                {/* Common Params Insert Chips */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Insert Parameter:
                    </span>
                    {COMMON_PARAMS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setQueryText((prev) => prev + `:${p}`)}
                        className="text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 rounded-md px-2 py-0.5 transition-colors"
                      >
                        +{p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Test Values / Parameters Preview */}
              {queryParams.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700">
                      Test Parameter Values
                    </Label>
                    <span className="text-[11px] text-slate-400">
                      Provide sample values to test the query
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {queryParams.map((p) => (
                      <div key={p} className="space-y-1">
                        <span className="text-[11px] font-mono text-slate-600 block">
                          :{p}
                        </span>
                        <Input
                          value={testContext[p] ?? ""}
                          onChange={(e) =>
                            setTestContext((prev) => ({
                              ...prev,
                              [p]: e.target.value,
                            }))
                          }
                          placeholder={`Value for ${p}`}
                          className="h-7 text-xs bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Result Display */}
              {testResult && (
                <div
                  className={`rounded-xl border p-4 text-xs transition-all ${
                    testResult.success
                      ? "bg-emerald-50/60 border-emerald-200"
                      : "bg-red-50/60 border-red-200"
                  }`}
                >
                  {!testResult.success ? (
                    <div className="flex items-start gap-2 text-red-700">
                      <XCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-semibold">Query Failed</p>
                        <p className="text-[11px] mt-0.5 text-red-600">
                          {testResult.errorMessage}
                        </p>
                      </div>
                    </div>
                  ) : testResult.value !== undefined && testResult.value !== null ? (
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-medium">Scalar Result:</span>{" "}
                        <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                          {testResult.value}
                        </strong>
                      </div>
                    </div>
                  ) : testResult.rows && testResult.rows.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          {testResult.rows.length} rows returned (Selection modal will open for user)
                        </span>
                      </div>
                      <div className="overflow-auto max-h-36 rounded-lg border border-emerald-200 bg-white">
                        <table className="w-full text-[11px]">
                          <thead className="sticky top-0 bg-emerald-100/70 text-emerald-950 font-semibold border-b border-emerald-200">
                            <tr>
                              {testResult.columns?.map((c) => (
                                <th key={c} className="px-2.5 py-1.5 text-left font-mono">
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {testResult.rows.slice(0, 10).map((row, i) => (
                              <tr
                                key={i}
                                className="border-b border-emerald-50 hover:bg-emerald-50/50"
                              >
                                {testResult.columns?.map((c) => (
                                  <td key={c} className="px-2.5 py-1 text-slate-700">
                                    {String(row[c] ?? "")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">Query executed but returned 0 rows.</p>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="px-8 py-4 border-t bg-slate-50 flex items-center justify-between shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={testing || !queryText.trim()}
                className="h-9 text-xs gap-2 font-medium bg-white hover:bg-slate-100"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Play className="w-4 h-4 text-blue-600" />
                )}
                Test Query
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-9 text-xs px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-9 text-xs px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm shadow-blue-500/20"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {selectedCode ? "Update Rule" : "Save Configuration"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FMSSetupModal;

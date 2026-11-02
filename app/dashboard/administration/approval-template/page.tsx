"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  getFmsFields,
  getFmsQueries,
  saveFmsConfig,
  testFmsQuery,
  type FmsConfigDto,
  type FmsExecuteResult,
} from "@/api+/sap/fms/fmsService";

type FieldChoice = { name: string; title: string; scope: "H" | "L" | "F" | "UDF" };

const DOCUMENTS = collectLeafItems(SERVER_MENUS).filter(
  (item) => item.objectCode !== undefined && item.objectCode !== null && item.url.startsWith("/dashboard/")
);

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

function SearchSelect({
  placeholder,
  searchPlaceholder,
  emptyText,
  value,
  options,
  onChange,
  disabled,
}: {
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="h-9 w-full justify-between font-normal"
        >
          <span className="truncate">{selected?.label || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const PARAMS = [
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
];

export default function QueryManagerPage() {
  const [queries, setQueries] = useState<FmsConfigDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [queryText, setQueryText] = useState("");
  const [menuId, setMenuId] = useState("");
  const [targetField, setTargetField] = useState("");
  const [fields, setFields] = useState<FieldChoice[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [testResult, setTestResult] = useState<FmsExecuteResult | null>(null);
  const [testContext, setTestContext] = useState<Record<string, string>>({});
  const queryRef = useRef<HTMLTextAreaElement>(null);

  const queryParams = useMemo(() => {
    const names = [...queryText.matchAll(/[:$@]([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) => match[1]);
    return [...new Set(names)];
  }, [queryText]);

  const selectedDocument = useMemo(
    () => DOCUMENTS.find((item) => item.id === menuId) ?? null,
    [menuId]
  );

  const selected = useMemo(
    () => queries.find((q) => q.code === selectedCode) ?? null,
    [queries, selectedCode]
  );

  const load = async () => {
    setLoading(true);
    try {
      setQueries(await getFmsQueries());
    } catch {
      toast.error("Failed to load queries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openQuery = (query: FmsConfigDto) => {
    setSelectedCode(query.code);
    setName(query.fieldTitle || query.name || "");
    setQueryText(query.queryText || "");
    const match = DOCUMENTS.find((item) => String(item.objectCode) === String(query.docType));
    setMenuId(match?.id ?? "");
    setTargetField(query.targetField || "");
    setTestResult(null);
  };

  const startNew = () => {
    setSelectedCode(null);
    setName("");
    setQueryText("");
    setMenuId("");
    setTargetField("");
    setFields([]);
    setTestResult(null);
  };

  useEffect(() => {
    if (!selectedDocument) {
      setFields([]);
      return;
    }
    const code = Number(selectedDocument.objectCode);
    let cancelled = false;
    setFieldsLoading(true);
    getFmsFields(code)
      .then((apiFields) => {
        if (cancelled) return;
        const catalog = getFieldCatalog(selectedDocument.url, selectedDocument.objectCode);
        const rows = new Map<string, FieldChoice>();
        catalog?.header.forEach((field) => {
          rows.set(field.key, {
            name: field.key,
            title: field.title || field.key,
            scope: FOOTER_FIELDS.has(field.key) ? "F" : "H",
          });
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
        setFields([...rows.values()]);
      })
      .catch(() => {
        if (!cancelled) setFields([]);
      })
      .finally(() => {
        if (!cancelled) setFieldsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDocument]);

  const save = async () => {
    const title = name.trim();
    const sql = queryText.trim();
    if (!title) {
      toast.error("Enter a query name.");
      return;
    }
    if (!sql) {
      toast.error("Enter a query.");
      return;
    }
    setSaving(true);
    try {
      const docType = selectedDocument ? Number(selectedDocument.objectCode) : 0;
      const field = fields.find((item) => item.name === targetField);
      const saved = await saveFmsConfig({
        code: selectedCode ?? "",
        name: title,
        docType,
        targetField: field?.name ?? "",
        fieldTitle: title,
        fieldScope: "Q",
        queryText: sql,
        triggerType: "Manual",
        isActive: "Y",
        isForApproval: "N",
      });
      toast.success("Query saved.");
      await load();
      setSelectedCode(saved.code);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: string | { Message?: string } } })?.response?.data;
      const message = typeof data === "string" ? data : data?.Message;
      toast.error(message || "Failed to save the query.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selectedCode) return;
    setSaving(true);
    try {
      await deleteFmsConfig(selectedCode);
      toast.success("Query removed.");
      startNew();
      await load();
    } catch {
      toast.error("Failed to remove the query.");
    } finally {
      setSaving(false);
    }
  };

  const insertToken = (token: string) => {
    setQueryText((prev) => {
      const pattern = new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_])`);
      if (pattern.test(prev)) return prev;
      const el = queryRef.current;
      const start = el?.selectionStart ?? prev.length;
      const end = el?.selectionEnd ?? start;
      const needsGap = start > 0 && !/\s/.test(prev.charAt(start - 1));
      const text = `${needsGap ? " " : ""}${token}`;
      const next = `${prev.slice(0, start)}${text}${prev.slice(end)}`;
      const pos = start + text.length;
      queueMicrotask(() => {
        const node = queryRef.current;
        if (!node) return;
        node.focus();
        node.setSelectionRange(pos, pos);
      });
      return next;
    });
  };

  const readApiMessage = (err: unknown, fallback: string) => {
    const data = (err as { response?: { data?: unknown } })?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      const row = data as Record<string, unknown>;
      const message = row.ErrorMessage ?? row.errorMessage ?? row.detail ?? row.Detail ?? row.Message ?? row.message;
      if (typeof message === "string" && message.trim()) return message;
    }
    return fallback;
  };

  const test = async () => {
    if (!queryText.trim()) {
      toast.error("Enter a query to test.");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const context: Record<string, string> = {};
      queryParams.forEach((param) => {
        context[param] = testContext[param] ?? "";
      });
      setTestResult(await testFmsQuery({ queryText, formContext: context }));
    } catch (err: unknown) {
      const message = readApiMessage(err, "The query could not be tested.");
      setTestResult({ success: false, errorMessage: message });
      toast.error(message);
    } finally {
      setTesting(false);
    }
  };

  const resultColumns = testResult?.columns?.length ? testResult.columns : ["Value"];
  const resultRows =
    testResult?.rows && testResult.rows.length > 0
      ? testResult.rows
      : testResult?.success && testResult.value != null && testResult.value !== ""
        ? [{ [resultColumns[0]]: testResult.value }]
        : [];

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b px-6 py-4">
        <h1 className="text-base font-semibold text-slate-900">Query Manager</h1>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r">
          <div className="border-b p-3">
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={startNew}>
              New query
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {loading ? (
              <div className="flex justify-center py-8 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : queries.length === 0 ? (
              <p className="px-3 py-6 text-sm text-slate-500">No queries saved.</p>
            ) : (
              <ul>
                {queries.map((query) => (
                  <li key={query.code}>
                    <button
                      type="button"
                      onClick={() => openQuery(query)}
                      className={`w-full truncate px-3 py-2 text-left text-sm ${
                        selectedCode === query.code
                          ? "bg-slate-100 font-medium text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {query.fieldTitle || query.name || query.code}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-3 overflow-auto p-6">
          <div className="max-w-3xl space-y-1">
            <label className="text-sm text-slate-700" htmlFor="query-name">
              Name
            </label>
            <Input
              id="query-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm text-slate-700">Document</span>
              <SearchSelect
                placeholder="Select document"
                searchPlaceholder="Search documents..."
                emptyText="No documents found."
                value={menuId}
                options={DOCUMENTS.map((item) => ({
                  value: item.id,
                  label: item.title,
                }))}
                onChange={(value) => {
                  setMenuId(value);
                  setTargetField("");
                }}
              />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-slate-700">Target field</span>
              <SearchSelect
                placeholder={fieldsLoading ? "Loading fields..." : "Select field"}
                searchPlaceholder="Search fields..."
                emptyText={menuId ? "No fields found." : "Select a document first."}
                value={targetField}
                disabled={!menuId || fieldsLoading}
                options={fields.map((field) => ({
                  value: field.name,
                  label: field.title && field.title !== field.name ? `${field.title} (${field.name})` : field.title || field.name,
                }))}
                onChange={(value) => {
                  setTargetField(value);
                  if (!value) return;
                  const token = `:${value}`;
                  const focused = document.activeElement === queryRef.current;
                  setQueryText((prev) => {
                    const tokenPattern = new RegExp(
                      `${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_])`
                    );
                    if (tokenPattern.test(prev)) return prev;
                    if (!prev.trim()) return token;
                    if (!focused && /[:$@][A-Za-z_]/.test(prev)) return prev;
                    return `${prev}${/\s$/.test(prev) ? "" : " "}${token}`;
                  });
                }}
              />
            </div>
          </div>

          <div className="max-w-3xl space-y-1">
            <label className="text-sm text-slate-700" htmlFor="query-text">
              Query
            </label>
            <Textarea
              ref={queryRef}
              id="query-text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder={'SELECT "CardName" FROM OCRD WHERE "CardCode" = :CardCode'}
              className="font-mono text-xs bg-slate-50 text-slate-800"
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {PARAMS.map((param) => (
                <button
                  key={param}
                  type="button"
                  onClick={() => insertToken(`:${param}`)}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700 hover:bg-slate-100"
                >
                  :{param}
                </button>
              ))}
            </div>
          </div>

          {queryParams.length > 0 ? (
            <div className="max-w-3xl space-y-2">
              <p className="text-sm text-slate-700">Parameters</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {queryParams.map((param) => (
                  <div key={param} className="space-y-1">
                    <label className="font-mono text-xs text-slate-600" htmlFor={`param-${param}`}>
                      :{param}
                    </label>
                    <Input
                      id={`param-${param}`}
                      value={testContext[param] ?? ""}
                      onChange={(e) =>
                        setTestContext((prev) => ({
                          ...prev,
                          [param]: e.target.value,
                        }))
                      }
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {testResult ? (
            <div
              className={`max-w-3xl overflow-hidden rounded border ${
                testResult.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
              }`}
            >
              {testResult.success ? (
                resultRows.length > 0 ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-emerald-200 hover:bg-emerald-100">
                          {resultColumns.map((column) => (
                            <TableHead key={column} className="bg-emerald-100 font-mono text-xs text-emerald-950">
                              {column}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultRows.slice(0, 50).map((row, index) => (
                          <TableRow key={index} className="border-emerald-100 bg-white hover:bg-emerald-50">
                            {resultColumns.map((column) => (
                              <TableCell key={column} className="font-mono text-xs text-emerald-950">
                                {String(row[column] ?? "")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-emerald-800">Query returned no rows.</p>
                )
              ) : (
                <p className="px-3 py-2 text-sm text-red-700">{testResult.errorMessage || "Query failed."}</p>
              )}
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={test} disabled={testing}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
            {selected ? (
              <Button type="button" variant="outline" onClick={remove} disabled={saving}>
                Remove
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

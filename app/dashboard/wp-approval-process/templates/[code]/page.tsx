"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { SapUserCombobox } from "@/components/administration/wp-approval-process/SapUserCombobox";
import { SearchableCombobox } from "@/components/administration/wp-approval-process/SearchableCombobox";
import { getDocTypeOptions } from "@/lib/approval-process/doc-type-options";
import { getApiErrorMessage } from "@/lib/approval-process/apiErrors";
import { WP_CONDITION_TYPES, WP_OPERATORS } from "@/lib/approval-process/term-labels";
import {
  WP_APPLY_ON_UPDATE_HELP,
  WP_TEMPLATE_ACTIVE_HELP,
  WP_TAB_DOC_TYPES_HELP,
  WP_TAB_ORIGINATORS_HELP,
  WP_TAB_STAGES_HELP,
  WP_TAB_TERMS_HELP,
  WP_TEMPLATE_EDITOR_SUBTITLE,
} from "@/lib/approval-process/page-copy";
import { isLinkableSapCode, SAP_UDT_CODE_MAX_LENGTH } from "@/lib/approval-process/sap-code-limits";
import {
  createTemplate,
  fetchDocumentTypes,
  fetchFmsLinks,
  fetchOriginators,
  fetchStages,
  fetchTemplate,
  fetchTemplateStages,
  fetchTerms,
  saveDocumentTypes,
  saveFmsLinks,
  saveOriginators,
  saveTemplateStages,
  saveTerms,
  updateTemplate,
} from "@/api+/sap/approval-process/approvalProcessService";
import { getFmsConfigs, getFmsQueries, type FmsConfigDto } from "@/api+/sap/fms/fmsService";
import { getUsers } from "@/api+/sap/authorization/authorizationService";
import { useAuth } from "@/context/authContext";
import type {
  WpApprovalTemplate,
  WpApprovalProcessTab,
} from "@/types/approval-process/wp-approval.types";

type SapUserOption = { userId: number; userName: string; userCode: string };

function emptyHeader(templateCode: string): WpApprovalTemplate {
  return {
    code: templateCode,
    templateName: "",
    conds: "Y",
    active: "Y",
    appOnUpd: "N",
    priority: 100,
    selfAprOk: "N",
  };
}

export default function WpTemplateEditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const code = decodeURIComponent(String(params.code ?? ""));
  const isNew = code === "new";
  const createdCodeRef = useRef("");
  const tabParam = searchParams.get("tab");
  const initialTab: WpApprovalProcessTab =
    tabParam === "fms-queries"
      ? "terms"
      : ((tabParam as WpApprovalProcessTab | null) ?? "general");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);
  const [header, setHeader] = useState<WpApprovalTemplate>(emptyHeader(isNew ? "" : code));
  const [originatorRows, setOriginatorRows] = useState<Awaited<ReturnType<typeof fetchOriginators>>>([]);
  const [stageRows, setStageRows] = useState<Awaited<ReturnType<typeof fetchTemplateStages>>>([]);
  const [docTypeRows, setDocTypeRows] = useState<Awaited<ReturnType<typeof fetchDocumentTypes>>>([]);
  const [termRows, setTermRows] = useState<Awaited<ReturnType<typeof fetchTerms>>>([]);
  const [fmsRows, setFmsRows] = useState<Awaited<ReturnType<typeof fetchFmsLinks>>>([]);
  const [fmsConfigOptions, setFmsConfigOptions] = useState<FmsConfigDto[]>([]);
  const [allStages, setAllStages] = useState<Awaited<ReturnType<typeof fetchStages>>>([]);
  const [sapUsers, setSapUsers] = useState<SapUserOption[]>([]);

  const docTypeOptions = useMemo(() => getDocTypeOptions(), []);

  const templateDocTypes = useMemo(
    () => [...new Set(docTypeRows.map((d) => Number(d.objType)).filter((n) => n > 0))],
    [docTypeRows]
  );

  const fmsConfigByCode = useMemo(() => {
    const map = new Map<string, FmsConfigDto>();
    for (const cfg of fmsConfigOptions) {
      if (cfg.code) map.set(cfg.code, cfg);
    }
    return map;
  }, [fmsConfigOptions]);

  const fmsSelectOptions = useMemo(() => {
    const linkable = fmsConfigOptions.filter((c) => isLinkableSapCode(c.code));
    const options = [...linkable];
    const codes = new Set(options.map((o) => o.code));
    for (const row of fmsRows) {
      if (row.fmsCfgCode && !codes.has(row.fmsCfgCode)) {
        options.push({
          code: row.fmsCfgCode,
          name: row.fmsTitle,
          docType: 0,
          targetField: "",
          fieldTitle: row.fmsTitle || row.fmsCfgCode,
          queryText: "",
          triggerType: "Manual",
          isActive: "Y",
        });
        codes.add(row.fmsCfgCode);
      }
    }
    return options.sort((a, b) =>
      (a.fieldTitle || a.code).localeCompare(b.fieldTitle || b.code, undefined, { sensitivity: "base" })
    );
  }, [fmsConfigOptions, fmsRows]);

  const fmsConfigsTooLong = useMemo(
    () => fmsConfigOptions.filter((c) => c.code && !isLinkableSapCode(c.code)),
    [fmsConfigOptions]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [library, ...lists] = await Promise.all([
          getFmsQueries(),
          ...templateDocTypes.map((dt) => getFmsConfigs(dt)),
        ]);
        const byCode = new Map<string, FmsConfigDto>();
        for (const cfg of [...library, ...lists.flat()]) {
          if (cfg.code && !byCode.has(cfg.code)) byCode.set(cfg.code, cfg);
        }
        if (!cancelled) setFmsConfigOptions([...byCode.values()]);
      } catch {
        if (!cancelled) toast.error("Failed to load queries.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateDocTypes.join(",")]);

  useEffect(() => {
    if (!isNew) return;
    createdCodeRef.current = "";
    setHeader(emptyHeader(""));
    setOriginatorRows([]);
    setStageRows([]);
    setDocTypeRows([]);
    setTermRows([]);
    setFmsRows([]);
    setMissing(false);
  }, [isNew]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (isNew) {
          const [stages, users] = await Promise.all([
            fetchStages(),
            getUsers(user?.companyDB ?? "SBODEMOAU"),
          ]);
          if (cancelled) return;
          setMissing(false);
          setAllStages(stages);
          setSapUsers(
            users
              .filter((u) => u.userId != null)
              .map((u) => ({
                userId: Number(u.userId),
                userCode: u.empId || String(u.userId),
                userName: u.fullName || u.firstName || u.empId || String(u.userId),
              }))
          );
          return;
        }

        const loadCode = code;
        const tpl = await fetchTemplate(loadCode);
        if (!tpl) {
          if (!cancelled) setMissing(true);
          return;
        }
        if (cancelled) return;
        setMissing(false);
        setHeader(tpl);
        const [orig, stg, doc, trm, fms, stages, users] = await Promise.all([
          fetchOriginators(loadCode),
          fetchTemplateStages(loadCode),
          fetchDocumentTypes(loadCode),
          fetchTerms(loadCode),
          fetchFmsLinks(loadCode),
          fetchStages(),
          getUsers(user?.companyDB ?? "SBODEMOAU"),
        ]);
        if (cancelled) return;
        setOriginatorRows(orig);
        setStageRows(stg);
        setDocTypeRows(
          doc.map((d) => ({
            ...d,
            objTypeLabel:
              d.objTypeLabel ||
              docTypeOptions.find((o) => o.objType === d.objType)?.label ||
              d.objType,
          }))
        );
        setTermRows(
          trm.map((t) => ({
            ...t,
            condLabel: t.condLabel || WP_CONDITION_TYPES.find((c) => c.id === t.condId)?.label || "",
            opLabel: t.opLabel || WP_OPERATORS.find((o) => o.code === t.opCode)?.label || "",
          }))
        );
        setFmsRows(fms);
        setAllStages(stages);
        setSapUsers(
          users
            .filter((u) => u.userId != null)
            .map((u) => ({
              userId: Number(u.userId),
              userCode: u.empId || String(u.userId),
              userName: u.fullName || u.firstName || u.empId || String(u.userId),
            }))
        );
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Failed to load template."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, isNew, user?.companyDB, docTypeOptions]);

  if (loading) {
    return (
      <WpApprovalProcessShell title="Loading template…" subtitle={code}>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </WpApprovalProcessShell>
    );
  }

  if (missing) {
    return (
      <WpApprovalProcessShell title="Template not found" subtitle={code}>
        <div className="p-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/wp-approval-process/templates">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to templates
            </Link>
          </Button>
        </div>
      </WpApprovalProcessShell>
    );
  }

  const saveAll = async () => {
    const templateName = header.templateName.trim();
    if (!templateName) {
      toast.error("Enter a template name before saving.");
      return;
    }

    setSaving(true);
    let createdNow = false;
    try {
      let wtmCode = isNew ? createdCodeRef.current : code;
      const payload = { ...header, templateName };
      if (!wtmCode) {
        wtmCode = await createTemplate(payload);
        createdCodeRef.current = wtmCode;
        createdNow = true;
        setHeader({ ...payload, code: wtmCode });
      } else {
        await updateTemplate({ ...payload, code: wtmCode });
      }

      await saveOriginators(
        wtmCode,
        originatorRows.map((r) => ({ ...r, wtmCode }))
      );
      await saveTemplateStages(
        wtmCode,
        stageRows.map((r, i) => ({ ...r, wtmCode, sortId: i + 1 }))
      );
      await saveDocumentTypes(
        wtmCode,
        docTypeRows.map((r) => ({ ...r, wtmCode }))
      );
      await saveTerms(
        wtmCode,
        termRows.map((r) => ({ ...r, wtmCode }))
      );
      const remapped = await saveFmsLinks(
        wtmCode,
        fmsRows.map((r) => {
          const cfg = r.fmsCfgCode ? fmsConfigByCode.get(r.fmsCfgCode) : undefined;
          return {
            ...r,
            wtmCode,
            fmsTitle: r.fmsTitle || cfg?.fieldTitle || cfg?.name || "",
          };
        })
      );
      setFmsRows(await fetchFmsLinks(wtmCode));
      if (createdNow) {
        router.replace(`/dashboard/wp-approval-process/templates/${encodeURIComponent(wtmCode)}`);
      }
      if (remapped.length) {
        const detail = remapped.map((r) => `${r.from} → ${r.to}`).join(", ");
        toast.success(`Template saved. Query copied to short code: ${detail}`);
      } else {
        toast.success("Template saved.");
      }
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          createdNow
            ? "The template was created, but its settings were not saved. Save again to finish."
            : "Failed to save template."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <WpApprovalProcessShell
      title={header.templateName || (isNew ? "New template" : "Template")}
      subtitle={
        isNew
          ? "Set the template name, document types, stages, and queries, then save. Nothing is created until you save."
          : WP_TEMPLATE_EDITOR_SUBTITLE(code, code.length > 20)
      }
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={saveAll} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/wp-approval-process/templates">
              <ArrowLeft className="w-4 h-4 mr-1" /> List
            </Link>
          </Button>
        </div>
      }
    >
      <div className="p-6">
        <Tabs defaultValue={initialTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 p-1">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="originators">Originators</TabsTrigger>
            <TabsTrigger value="stages">Stages</TabsTrigger>
            <TabsTrigger value="document-types">Document Types</TabsTrigger>
            <TabsTrigger value="terms">Terms &amp; queries</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="rounded-xl border bg-white p-6 grid gap-4 md:grid-cols-2 max-w-3xl">
              <div className="space-y-2 md:col-span-2">
                <Label>Template name</Label>
                <Input
                  value={header.templateName}
                  onChange={(e) => setHeader({ ...header, templateName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Use conditions</Label>
                <Select
                  value={header.conds}
                  onValueChange={(v) => setHeader({ ...header, conds: v as "Y" | "N" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y">Yes</SelectItem>
                    <SelectItem value="N">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={header.active === "N" ? "N" : "Y"}
                  onValueChange={(v) => setHeader({ ...header, active: v as "Y" | "N" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y">Active</SelectItem>
                    <SelectItem value="N">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{WP_TEMPLATE_ACTIVE_HELP}</p>
              </div>
              <div className="space-y-2">
                <Label>Apply on update</Label>
                <Select
                  value={header.appOnUpd}
                  onValueChange={(v) => setHeader({ ...header, appOnUpd: v as "Y" | "N" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y">On</SelectItem>
                    <SelectItem value="N">Off</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{WP_APPLY_ON_UPDATE_HELP}</p>
              </div>
              <div className="space-y-2">
                <Label>Allow self-approval</Label>
                <Select
                  value={header.selfAprOk}
                  onValueChange={(v) => setHeader({ ...header, selfAprOk: v as "Y" | "N" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y">Yes</SelectItem>
                    <SelectItem value="N">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority (lower first)</Label>
                <Input
                  type="number"
                  value={header.priority}
                  onChange={(e) =>
                    setHeader({ ...header, priority: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="originators" className="space-y-4">
            <p className="text-xs text-slate-500">{WP_TAB_ORIGINATORS_HELP}</p>
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {originatorRows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <SapUserCombobox
                          users={sapUsers}
                          value={row.userId}
                          onChange={(userId, userName) => {
                            const next = [...originatorRows];
                            next[idx] = { ...row, userId, userName };
                            setOriginatorRows(next);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setOriginatorRows(originatorRows.filter((_, i) => i !== idx))
                          }
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={sapUsers.length === 0}
                onClick={() => {
                  if (!sapUsers.length) return;
                  setOriginatorRows([
                    ...originatorRows,
                    {
                      id: `o-${Date.now()}`,
                      wtmCode: code,
                      userId: sapUsers[0].userId,
                      userName: sapUsers[0].userName,
                    },
                  ]);
                }}
              >
                Add originator
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stages" className="space-y-4">
            <p className="text-xs text-slate-500">{WP_TAB_STAGES_HELP}</p>
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="w-44" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stageRows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.sortId}</TableCell>
                      <TableCell>
                        <SearchableCombobox
                          value={row.wstCode}
                          placeholder="Select stage"
                          searchPlaceholder="Search stages..."
                          emptyText="No stages found."
                          options={(allStages.some((s) => s.code === row.wstCode)
                            ? allStages
                            : [
                                { code: row.wstCode, stageName: row.stageName, maxReqr: 1, maxRejReqr: 1 },
                                ...allStages,
                              ]
                          ).map((s) => ({
                            value: s.code,
                            label: s.stageName || "Untitled stage",
                          }))}
                          onChange={(v) => {
                            const st = allStages.find((s) => s.code === v);
                            const next = [...stageRows];
                            next[idx] = {
                              ...row,
                              wstCode: v,
                              stageName: st?.stageName ?? row.stageName,
                            };
                            setStageRows(next);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="gap-1" asChild>
                            <Link
                              href={`/dashboard/wp-approval-process/stages/${encodeURIComponent(row.wstCode)}`}
                              title="Open this stage"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                              Stage
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStageRows(stageRows.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const st = allStages[0];
                  if (!st) return;
                  setStageRows([
                    ...stageRows,
                    {
                      id: `ts-${Date.now()}`,
                      wtmCode: code,
                      wstCode: st.code,
                      stageName: st.stageName,
                      sortId: stageRows.length + 1,
                    },
                  ]);
                }}
              >
                Add stage
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="document-types" className="space-y-4">
            <p className="text-xs text-slate-500">{WP_TAB_DOC_TYPES_HELP}</p>
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document type</TableHead>
                    <TableHead>ObjType</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docTypeRows.map((row, idx) => (
                    <TableRow key={row.id || `doc-type-row-${idx}`}>
                      <TableCell>
                        <SearchableCombobox
                          value={row.objType}
                          placeholder="Select document"
                          searchPlaceholder="Search documents..."
                          emptyText="No documents found."
                          options={docTypeOptions.map((d) => ({
                            value: d.objType,
                            label: d.label,
                          }))}
                          onChange={(v) => {
                            const opt = docTypeOptions.find((d) => d.objType === v);
                            const next = [...docTypeRows];
                            next[idx] = {
                              ...row,
                              objType: v,
                              objTypeLabel: opt?.label ?? v,
                            };
                            setDocTypeRows(next);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {row.objType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDocTypeRows(docTypeRows.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const d = docTypeOptions[0];
                  if (!d) return;
                  setDocTypeRows([
                    ...docTypeRows,
                    {
                      id: `d-${Date.now()}`,
                      wtmCode: code,
                      objType: d.objType,
                      objTypeLabel: d.label,
                    },
                  ]);
                }}
              >
                Add document type
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="space-y-6">
            <p className="text-xs text-slate-500">{WP_TAB_TERMS_HELP}</p>
            {header.conds !== "Y" ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                This template uses <strong>Use conditions = No</strong> on General, so these rules are stored but not
                evaluated until you switch to Yes.
              </p>
            ) : null}

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Numeric checks</h3>
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Condition</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {termRows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Select
                          value={String(row.condId)}
                          onValueChange={(v) => {
                            const c = WP_CONDITION_TYPES.find((x) => String(x.id) === v);
                            const next = [...termRows];
                            next[idx] = {
                              ...row,
                              condId: Number(v),
                              condLabel: c?.label ?? row.condLabel,
                            };
                            setTermRows(next);
                          }}
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WP_CONDITION_TYPES.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={String(row.opCode)}
                          onValueChange={(v) => {
                            const op = WP_OPERATORS.find((x) => String(x.code) === v);
                            const next = [...termRows];
                            next[idx] = {
                              ...row,
                              opCode: Number(v),
                              opLabel: op?.label ?? row.opLabel,
                            };
                            setTermRows(next);
                          }}
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WP_OPERATORS.map((op) => (
                              <SelectItem key={op.code} value={String(op.code)}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.opValue}
                          onChange={(e) => {
                            const next = [...termRows];
                            next[idx] = { ...row, opValue: e.target.value };
                            setTermRows(next);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setTermRows(termRows.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setTermRows([
                  ...termRows,
                  {
                    id: `t-${Date.now()}`,
                    wtmCode: code,
                    condId: WP_CONDITION_TYPES[0].id,
                    condLabel: WP_CONDITION_TYPES[0].label,
                    opCode: WP_OPERATORS[2].code,
                    opLabel: WP_OPERATORS[2].label,
                    opValue: "",
                  },
                ])
              }
            >
              Add numeric check
            </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Approval queries
              </h3>
              {fmsConfigOptions.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Save a query in Query Manager, then select it here.
                </p>
              ) : null}
              {fmsConfigsTooLong.length > 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {fmsConfigsTooLong.length} quer
                  {fmsConfigsTooLong.length === 1 ? "y has" : "ies have"} a code longer than {SAP_UDT_CODE_MAX_LENGTH}{" "}
                  characters. Saving copies the query to a new short code automatically.
                </p>
              ) : null}
              <div className="rounded-xl border bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fmsRows.map((row, idx) => {
                      const selected = row.fmsCfgCode ? fmsConfigByCode.get(row.fmsCfgCode) : undefined;
                      const description =
                        selected?.fieldTitle ||
                        selected?.name ||
                        row.fmsTitle ||
                        (row.fmsCfgCode ? "—" : "");
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="min-w-[280px]">
                            <Select
                              value={row.fmsCfgCode || undefined}
                              onValueChange={(fmsCode) => {
                                const cfg =
                                  fmsConfigByCode.get(fmsCode) ??
                                  fmsSelectOptions.find((c) => c.code === fmsCode);
                                const next = [...fmsRows];
                                next[idx] = {
                                  ...row,
                                  fmsCfgCode: fmsCode,
                                  fmsTitle: cfg?.fieldTitle || cfg?.name || row.fmsTitle,
                                };
                                setFmsRows(next);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select query" />
                              </SelectTrigger>
                              <SelectContent>
                                {fmsSelectOptions.map((cfg) => (
                                  <SelectItem key={cfg.code} value={cfg.code}>
                                    {cfg.fieldTitle || cfg.name || cfg.targetField || "Query"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{description}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setFmsRows(fmsRows.filter((_, i) => i !== idx))}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setFmsRows([
                    ...fmsRows,
                    {
                      id: `f-${Date.now()}`,
                      wtmCode: code,
                      fmsCfgCode: "",
                      fmsTitle: "",
                    },
                  ])
                }
              >
                Add query
              </Button>
            </div>

          </TabsContent>
        </Tabs>
      </div>
    </WpApprovalProcessShell>
  );
}

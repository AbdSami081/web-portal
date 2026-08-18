"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/authContext";
import { 
  getReportFolders, 
  importReport, 
  getReportParameters,
  ReportFolderItem 
} from "@/api+/sap/reporting/reportingService";
import { getUserAccess } from "@/api+/sap/authorization/authorizationService";
import { getAccessToken } from "@/api+/sap/auth/authService";
import { SERVER_MENUS } from "@/lib/menu-data";
import { toast } from "sonner";
import { 
  Loader2, 
  Search, 
  Settings2,
  FolderOpen,
  ChevronRight,
  FileCode,
  ChevronDown,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const ALL_REPORTING_DOCS = SERVER_MENUS.flatMap(
  (group) =>
    (group.items ?? [])
      .filter((item) => item.isReporting === true)
      .map((item) => ({
        id: item.id,
        label: item.title,
        value: String(item.objectCode),
      }))
);

export default function ReportsManagePage() {
  const { user: currentUser } = useAuth();
  const [folders, setFolders] = useState<ReportFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [allowedDocuments, setAllowedDocuments] = useState<{ id: string; label: string; value: string }[]>([]);

  useEffect(() => {
    const fetchAllowedDocs = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        const empId = decoded.sub || decoded.nameid;
        const companyDB = decoded.CompanyDB || decoded.companyDB || "SBODemoAU";

        if (!empId) return;

        const access = await getUserAccess(empId, companyDB);
        
        const allowedIds = new Set(
          access.flatMap(a => [
            String(a.moduleId || "").trim().toLowerCase(),
            String(a.componentId || "").trim().toLowerCase()
          ].filter(Boolean))
        );

        const hasAllAccess = allowedIds.has("all");
        const filtered = ALL_REPORTING_DOCS.filter((doc) =>
          hasAllAccess || allowedIds.has(doc.id.toLowerCase())
        );
        setAllowedDocuments(filtered);
      } catch (error) {
        console.error("Failed to load user access for dropdown", error);
      }
    };
    fetchAllowedDocs();
  }, [currentUser]);
  
  const [selectedItems, setSelectedItems] = useState<Set<ReportFolderItem>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const [showParamModal, setShowParamModal] = useState(false);
  const [pendingImportPayloads, setPendingImportPayloads] = useState<any[]>([]);
  const [paramConfigs, setParamConfigs] = useState<Record<string, { componentType: string }>>({});
  const [fetchingParams, setFetchingParams] = useState(false);

  const [classifications, setClassifications] = useState<Record<string, {
    docType: "Report" | "Layout";
    objectCode: string;
    isDefault: boolean;
  }>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const folderData = await getReportFolders();
        setFolders(folderData);
      } catch (error) {
        console.error("Data Load Error:", error);
        toast.error("Failed to load management data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getClassification = (fileName: string) => {
    return classifications[fileName] ?? {
      docType: "Report" as const,
      objectCode: "",
      isDefault: false,
    };
  };

  const setClassification = (fileName: string, patch: Partial<ReturnType<typeof getClassification>>) => {
    setClassifications(prev => ({
      ...prev,
      [fileName]: { ...getClassification(fileName), ...patch },
    }));
  };

  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpandedFolders(next);
  };

  const toggleSelection = (item: ReportFolderItem, isChecked: boolean) => {
    const next = new Set(selectedItems);
    if (isChecked) next.add(item);
    else next.delete(item);
    setSelectedItems(next);
  };

  const handleImport = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select at least one report");
      return;
    }

    setFetchingParams(true);
    try {
      const payloads: any[] = [];
      const initialConfigs: any = { ...paramConfigs };
      
      for (const item of Array.from(selectedItems)) {
        const cls = getClassification(item.name);
        const paramsData = await getReportParameters(item.path);
        const paramsArray = Object.entries(paramsData || {}).map(([name, type]) => {
          const typeStr = String(type);
          return {
            name,
            type: typeStr,
            // Auto-select the Date picker for date-kind parameters so date
            // filters don't end up as plain text inputs.
            componentType: /date/i.test(typeStr) ? "Date" : "Input",
          };
        });
        
        payloads.push({
          reportName: item.name.replace(".rpt", ""),
          fileName: item.name,
          filePath: item.path,
          userCode: currentUser?.empId || "",
          userName: currentUser?.userName || "",
          parameters: paramsArray,
          docType: cls.docType,
          module: "",
          objectCode: cls.objectCode,
          isDefault: cls.isDefault ? "Y" : "N",
        });

        paramsArray.forEach(p => {
          const configKey = `${item.name}_${p.name}`;
          if (!initialConfigs[configKey]) {
            initialConfigs[configKey] = { componentType: p.componentType };
          }
        });
      }

      setPendingImportPayloads(payloads);
      setParamConfigs(initialConfigs);

      const hasParams = payloads.some(p => p.parameters.length > 0);
      if (hasParams) {
        setShowParamModal(true);
      } else {
        await doImport(payloads);
      }
    } catch (error: any) {
      console.error("Import Error:", error);
      toast.error("Import failed");
    } finally {
      setFetchingParams(false);
    }
  };

  const doImport = async (payloads: any[]) => {
    const response = await importReport(payloads);
    
    if (response.skipped > 0 && response.imported > 0) {
      toast.info(`Imported ${response.imported} reports. ${response.skipped} were already assigned.`);
    } else if (response.skipped > 0 && response.imported === 0) {
      if (payloads.length === 1) {
        toast.info(`Report "${payloads[0].reportName}" is already assigned.`);
      } else {
        toast.info("All selected reports are already assigned.");
      }
    } else {
      toast.success("Reports Imported Successfully");
    }
    
    setSelectedItems(new Set());
    setClassifications({});
  };

  const confirmImportWithParams = async () => {
    setImporting(true);
    try {
      const finalPayloads = pendingImportPayloads.map(payload => ({
        ...payload,
        parameters: payload.parameters.map((p: any) => ({
          name: p.name,
          type: p.type,
          componentType: paramConfigs[`${payload.fileName}_${p.name}`]?.componentType || "Input",
        })),
      }));

      await doImport(finalPayloads);
      setShowParamModal(false);
    } catch (error: any) {
      console.error("Import Error:", error);
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  const renderFolderItem = (item: ReportFolderItem, depth = 0) => {
    const isExpanded = expandedFolders.has(item.path);
    const isFile = item.type === "file";
    const isSelected = selectedItems.has(item);

    if (isFile && !item.name.toLowerCase().endsWith(".rpt")) return null;

    return (
      <div key={item.path} className="select-none">
        <div 
          onClick={() => {
            if (isFile) toggleSelection(item, !isSelected);
            else toggleFolder(item.path);
          }}
          className={cn(
            "flex items-center gap-2 py-2 px-4 cursor-pointer hover:bg-slate-100 transition-colors rounded-sm text-[13px] min-w-0",
            isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600",
            depth > 0 && "ml-4 border-l border-slate-100"
          )}
        >
          {isFile ? (
            <input 
              type="checkbox" 
              className="h-3.5 w-3.5 mr-1 accent-blue-600"
              checked={isSelected}
              onChange={(e) => {
                toggleSelection(item, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : null}

          {isFile ? (
            <FileCode className={cn("h-4 w-4 shrink-0", isSelected ? "text-blue-600" : "text-slate-400")} />
          ) : (
            isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          
          {!isFile && <FolderOpen className="h-4 w-4 text-amber-500 fill-amber-500/20 shrink-0" />}
          <span className="truncate" title={item.name}>{item.name}</span>
        </div>

        {isExpanded && item.children && (
          <div className="mt-1">
            {item.children.map(child => renderFolderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      <header className="flex h-14 items-center justify-between border-b px-6 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <Settings2 className="h-5 w-5 text-slate-400" />
          <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Report Management</h1>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Step 1: Browse Server Folders */}
        <aside className="w-[450px] border-r flex flex-col bg-slate-50/20">
          <div className="p-4 border-b bg-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Directory</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search local reports..." 
                className="pl-10 h-10 text-xs border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
            {folders.map(item => renderFolderItem(item))}
          </div>
        </aside>

        {/* Step 2: Classify & Import */}
        <main className="flex-1 flex flex-col bg-white overflow-y-auto">
          {selectedItems.size === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <FolderOpen className="h-16 w-16 text-slate-100 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Select Reports to Import</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed">
                Check one or more <code>.rpt</code> files from the server directory to initiate the batch import process.
              </p>
            </div>
          ) : (
            <div className="p-8 space-y-6 max-w-4xl w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ready to Import</p>
                  <h2 className="text-2xl font-black text-slate-900">{selectedItems.size} Report{selectedItems.size > 1 ? "s" : ""} Selected</h2>
                </div>
                <Button 
                  onClick={handleImport}
                  disabled={importing || fetchingParams}
                  className="h-10 bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-semibold px-6"
                >
                  {fetchingParams ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </div>
                  ) : importing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </div>
                  ) : (
                    `Import ${selectedItems.size} Report${selectedItems.size > 1 ? "s" : ""}`
                  )}
                </Button>
              </div>

              {/* Per-report classification */}
              <div className="space-y-4">
                {Array.from(selectedItems).map((item) => {
                  const cls = getClassification(item.name);
                  return (
                    <div key={item.path} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      {/* Report header */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <FileCode className="h-4 w-4 text-blue-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{item.path}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold border",
                            cls.docType === "Layout"
                              ? "border-violet-300 text-violet-700 bg-violet-50"
                              : "border-blue-300 text-blue-700 bg-blue-50"
                          )}
                        >
                          {cls.docType}
                        </Badge>
                      </div>

                      {/* Classification fields */}
                      <div className="grid grid-cols-2 gap-4 p-4">
                        {/* Doc Type */}
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</Label>
                          <Select
                            value={cls.docType}
                            onValueChange={(v) => setClassification(item.name, { docType: v as "Report" | "Layout" })}
                          >
                            <SelectTrigger className="h-9 text-xs border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Report">Report</SelectItem>
                              <SelectItem value="Layout">Layout</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Document Type — only for Layout, from SERVER_MENUS */}
                        {cls.docType === "Layout" && (
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Document</Label>
                            <Select
                              value={cls.objectCode || "__none__"}
                              onValueChange={(v) => setClassification(item.name, { objectCode: v === "__none__" ? "" : v })}
                            >
                              <SelectTrigger className="h-9 text-xs border-slate-200">
                                <SelectValue placeholder="Select document" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">— Select Document —</SelectItem>
                                {allowedDocuments.map((doc) => (
                                  <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Is Default — only for Layout */}
                        {cls.docType === "Layout" && (
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Default Layout</Label>
                            <div className="flex items-center gap-2 h-9">
                              <Switch
                                checked={cls.isDefault}
                                onCheckedChange={(v) => setClassification(item.name, { isDefault: v })}
                                id={`default-${item.name}`}
                              />
                              <label htmlFor={`default-${item.name}`} className="text-xs text-slate-600 flex items-center gap-1 cursor-pointer">
                                <Star className={cn("h-3 w-3", cls.isDefault ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                                {cls.isDefault ? "Yes — default layout" : "No"}
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Parameter Configuration Modal */}
      <Dialog open={showParamModal} onOpenChange={setShowParamModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-lg shadow-2xl border border-slate-300">
          <div className="p-6 border-b border-slate-300 bg-slate-50/80">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Configure Report Parameters
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Define the component type for parameters found in the selected reports.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-white space-y-8">
            {pendingImportPayloads.filter(p => p.parameters.length > 0).map((report, rIndex) => (
              <div key={rIndex} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                  <FileCode className="w-5 h-5 text-slate-600" />
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-700">
                    {report.reportName}
                  </h3>
                  <Badge variant="outline" className="ml-auto text-[10px] border-slate-300">
                    {report.parameters.length} Parameters
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {report.parameters.map((param: any, pIndex: any) => {
                    const configKey = `${report.fileName}_${param.name}`;
                    return (
                      <div key={pIndex} className="p-4 rounded-lg border border-slate-300 bg-white shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                          <span className="text-sm font-bold text-slate-800 truncate max-w-[150px]" title={param.name}>
                            {param.name}
                          </span>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {param.type}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Input Type</Label>
                          <Select 
                            value={paramConfigs[configKey]?.componentType || "Input"} 
                            onValueChange={(val) => setParamConfigs(prev => ({
                              ...prev,
                              [configKey]: { ...prev[configKey], componentType: val }
                            }))}
                          >
                            <SelectTrigger className="h-9 bg-white border-slate-300 text-xs focus:ring-slate-400">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Input" className="text-xs">Standard Input</SelectItem>
                              <SelectItem value="Date" className="text-xs">Date Picker</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-300 flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowParamModal(false)}
              className="px-6 font-bold text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmImportWithParams}
              disabled={importing}
              className="px-8 bg-slate-900 hover:bg-black text-white font-bold shadow-md transition-all active:scale-95"
            >
              {importing ? "Importing..." : "Confirm Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

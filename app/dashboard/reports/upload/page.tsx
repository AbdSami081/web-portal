"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/authContext";
import { getReportFolders, importReport, ReportFolderItem } from "@/api+/sap/reporting/reportingService";
import { toast } from "sonner";
import { 
  Loader2, 
  Search, 
  FileJson, 
  Settings2,
  FolderOpen,
  ChevronRight,
  Database,
  FileCode,
  UserCheck,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsManagePage() {
  const { user: currentUser } = useAuth();
  const [folders, setFolders] = useState<ReportFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selection State
  const [selectedItems, setSelectedItems] = useState<Set<ReportFolderItem>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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

    setImporting(true);
    try {
      const payloads = Array.from(selectedItems).map(item => {
        const pathParts = item.path.split('/').filter(Boolean);
        const moduleName = pathParts[0] || "General";
        const subModule = pathParts.length > 2 ? pathParts[1] : undefined;
        
        let objectCode = "";
        const targetName = (subModule || moduleName).toLowerCase();
        const parentName = moduleName.toLowerCase();
        
        if (targetName.includes("quotation")) objectCode = "23";
        else if (targetName.includes("sale") && targetName.includes("order")) objectCode = "17";
        else if (targetName.includes("purchase") && targetName.includes("order")) objectCode = "22";
        else if (targetName.includes("delivery")) objectCode = "15";
        else if (targetName.includes("invoice") && (targetName.includes("ap") || parentName.includes("purchase"))) objectCode = "18";
        else if (targetName.includes("invoice") && (targetName.includes("ar") || parentName.includes("sale"))) objectCode = "13";
        else if (targetName.includes("goods receipt po") || targetName.includes("grpo")) objectCode = "20";
        else if (targetName.includes("return") && parentName.includes("sale")) objectCode = "16";
        else if (targetName.includes("production")) objectCode = "202";
        else if (targetName.includes("inventory transfer") || targetName.includes("transfer")) objectCode = "67";
        else if (targetName.includes("goods receipt") || targetName.includes("receipt")) objectCode = "59";
        else if (targetName.includes("goods issue") || targetName.includes("issue")) objectCode = "60";
        else if (targetName.includes("business partner") || targetName.includes("bp")) objectCode = "2";
        else if (targetName.includes("item") || targetName.includes("master")) objectCode = "4";
        
        // If not recognized, we can send "0" or leave empty
        if (!objectCode) objectCode = "0";

        return {
          reportName: item.name.replace(".rpt", ""),
          module: objectCode,  // now passing the number instead of string
          subModule: subModule,
          fileName: item.name,
          filePath: item.path,
          userCode: currentUser?.empId || "",
          userName: currentUser?.userName || ""
        };
      });

      await importReport(payloads);

      toast.success("Reports Imported Successfully", {
        description: `Imported ${selectedItems.size} reports.`
      });
      
      setSelectedItems(new Set());
    } catch (error) {
      // Error handled by interceptor
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
            "flex items-center gap-2 py-2 px-4 cursor-pointer hover:bg-slate-100 transition-colors rounded-sm text-[13px]",
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
          <span>{item.name}</span>
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

        {/* Step 2: Import Action */}
        <main className="flex-1 flex flex-col bg-white">
          {selectedItems.size === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <FolderOpen className="h-16 w-16 text-slate-100 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Select Reports to Import</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed">
                Check one or more <code>.rpt</code> files from the server directory to initiate the batch import process.
              </p>
            </div>
          ) : (
            <div className="flex-1 p-12 max-w-4xl w-full mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Database className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Selected Components</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedItems.size} Reports Selected</h2>
                <div className="max-h-[300px] overflow-y-auto border rounded-xl bg-slate-50/50 p-4 space-y-3">
                  {Array.from(selectedItems).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm">
                      <FileCode className="h-5 w-5 text-blue-600 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{item.name}</span>
                        <span className="text-xs text-slate-500 font-mono truncate">{item.path}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6 max-w-md">
                <div className="pt-2">
                  <Button 
                    onClick={handleImport}
                    disabled={importing}
                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-semibold"
                  >
                    {importing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing {selectedItems.size} Reports...
                      </div>
                    ) : (
                      `Import ${selectedItems.size} Selected Reports`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


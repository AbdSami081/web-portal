"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/authContext";
import { uploadReport, downloadReport } from "@/api+/sap/reporting/reportingService";
import { toast } from "sonner";
import { 
  Loader2, 
  Search, 
  FileUp, 
  Settings2,
  Terminal,
  ChevronRight,
  Database
} from "lucide-react";
import { SERVER_MENUS } from "@/lib/menu-data";
import { cn } from "@/lib/utils";

export default function ReportsUploadPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedObjectCode, setSelectedObjectCode] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const modules = useMemo(() => {
    const list: { title: string; objectCode: string; category: string }[] = [];
    SERVER_MENUS.forEach((menu) => {
      if (["Sales", "Inventory", "Production"].includes(menu.title) && menu.items) {
          menu.items.forEach((item) => {
            if (item.objectCode && (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.objectCode.toString().includes(searchQuery))) {
              list.push({
                title: item.title,
                objectCode: item.objectCode.toString(),
                category: menu.title
              });
            }
          });
      }
    });
    return list;
  }, [searchQuery]);

  const categories = useMemo(() => {
    const groups: Record<string, typeof modules> = {};
    modules.forEach(m => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return Object.entries(groups);
  }, [modules]);

  const selectedModule = useMemo(() => {
    return modules.find(m => m.objectCode === selectedObjectCode);
  }, [modules, selectedObjectCode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".rpt")) {
        toast.error("Format mismatch: Select a Crystal Report binary (.rpt)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObjectCode || !selectedFile || !user) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("File", selectedFile);
      formData.append("U_EmployeeId", user.empId);
      formData.append("U_EmployeeName", user.userName);
      formData.append("U_ObjectCode", selectedObjectCode);

      await uploadReport(formData);
      toast.success("Deployment Successful", {
        description: `Source mapped to ${selectedModule?.title}`
      });

      setSelectedFile(null);
      setSelectedObjectCode("");
      const fileInput = document.getElementById("rpt-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      // apiClient handles logs
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Console Header */}
      <header className="flex h-14 items-center justify-between border-b px-6 shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <Settings2 className="h-5 w-5 text-slate-400" />
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Report Management</h1>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Module Navigator - No Cards, Just Structure */}
        <aside className="w-80 border-r flex flex-col bg-slate-50/30">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Find modules..."
                className="w-full bg-white border border-slate-200 pl-9 h-9 rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {categories.map(([category, items]) => (
              <div key={category} className="mb-6">
                <h2 className="px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{category} Modules</h2>
                <div className="space-y-px">
                  {items.map((item) => (
                    <button
                      key={item.objectCode}
                      onClick={() => setSelectedObjectCode(item.objectCode)}
                      className={cn(
                        "w-full flex items-center justify-between px-6 py-2.5 text-xs transition-colors group relative",
                        selectedObjectCode === item.objectCode 
                          ? "bg-blue-50/80 text-blue-700 font-bold" 
                          : "text-slate-600 hover:bg-slate-100/80"
                      )}
                    >
                      <span>{item.title}</span>
                      {selectedObjectCode === item.objectCode && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600" />
                      )}
                      <ChevronRight className={cn(
                        "h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity",
                        selectedObjectCode === item.objectCode ? "opacity-100 text-blue-600" : "text-slate-400"
                      )} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Action Workspace */}
        <main className="flex-1 overflow-y-auto bg-white flex flex-col">
          {!selectedObjectCode ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 border rounded-xl flex items-center justify-center mb-4 bg-slate-50">
                <Terminal className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Select Module</p>
              <p className="text-[12px] text-slate-500 max-w-xs leading-relaxed">
                Choose a module from the list to upload and map its specific report binary.
              </p>
            </div>
          ) : (
            <div className="flex-1 max-w-2xl w-full mx-auto p-12 space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
              <header className="space-y-4">

                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selectedModule?.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Select the <code>.rpt</code> file to associate with this module.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="rpt-upload" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Select Report binary (.RPT)
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative group">
                      <Input
                        id="rpt-upload"
                        type="file"
                        accept=".rpt"
                        onChange={handleFileChange}
                        className="h-11 border-slate-200 shadow-none focus-visible:ring-slate-900 cursor-pointer file:font-bold file:text-[10px] file:uppercase file:bg-slate-100 file:border-r file:border-slate-200 file:-ml-3 file:mr-4 file:px-4"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    disabled={loading || !selectedFile}
                    className="h-12 px-10 bg-slate-900 hover:bg-black text-white font-bold text-[11px] uppercase tracking-widest transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading Asset...
                      </>
                    ) : (
                      <>
                        <FileUp className="mr-2 h-4 w-4" />
                        Upload and Map Report
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Loader2, 
  Search,
  Users,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Eye
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { getUsers, OhemUser } from "@/api+/sap/authorization/authorizationService";
import { getReports, saveReportAccess, getAuthorizedReports, ReportData } from "@/api+/sap/reporting/reportingService";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export default function ReportAccessPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<OhemUser[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<OhemUser | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentUser?.companyDB) return;
    const fetchData = async () => {
      try {
        const [u, r] = await Promise.all([
          getUsers(currentUser.companyDB),
          getReports(undefined, currentUser.companyDB)
        ]);
        setUsers(u);
        const importedReports = Array.isArray(r)
          ? r.filter(item => String(item.U_DocType ?? "report").toLowerCase() === "report")
          : [];
        setReports(importedReports);
      } catch (error) {
        toast.error("Failed to load access data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser?.companyDB]);

  useEffect(() => {
    if (selectedUser) {
      const fetchPermissions = async () => {
        try {
          const authReports = await getAuthorizedReports(selectedUser.empId);

          const mapping: Record<string, boolean> = {};

          authReports.forEach((r: any) => {
            const reportCode = String(r.U_ReportCode || r.Code || "").trim();
            if (reportCode) {
              mapping[reportCode] = true;
            }
          });

          setPermissions(mapping);
        } catch (error) {
          setPermissions({});
        }
      };

      fetchPermissions();
    } else {
      setPermissions({});
    }
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.empId.toString().includes(userSearch)
    );
  }, [users, userSearch]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => 
      r.Name?.toLowerCase().includes(reportSearch.toLowerCase()) || 
      r.U_FileName?.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.U_ActualFileName?.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.Code?.toLowerCase().includes(reportSearch.toLowerCase())
    );
  }, [reports, reportSearch]);

  const togglePermission = (reportCode: string) => {
    if (!reportCode) return;
    setPermissions(prev => ({
      ...prev,
      [reportCode]: !prev[reportCode]
    }));
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      const selectedReportCodes = Object.entries(permissions)
        .filter(([_, isSelected]) => isSelected)
        .map(([code]) => code);

      await saveReportAccess({
        userCode: String(selectedUser.empId),
        reportCodes: selectedReportCodes
      });

      toast.success("Permissions Synchronized", {
        description: `Access updated for ${selectedUser.fullName}`
      });
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message || "Unknown error occurred";
      toast.error("Failed to save permissions", {
        description: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      <header className="flex h-14 items-center justify-between border-b px-6 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <ShieldCheck className="h-5 w-5 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Report Access</h2>
        </div>
        {selectedUser && (
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-md px-6 shadow-sm"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-2" />}
            Save Changes
          </Button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* User Sidebar */}
        <aside className="w-80 border-r flex flex-col bg-slate-50/30">
          <div className="p-4 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                placeholder="Search users..." 
                className="pl-9 h-9 text-[11px] border-slate-200"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map(u => (
              <button
                key={u.empId}
                onClick={() => setSelectedUser(u)}
                className={cn(
                  "w-full px-6 py-4 text-left transition-all border-b last:border-0",
                  selectedUser?.empId === u.empId 
                    ? "bg-white border-l-4 border-l-blue-600 shadow-sm" 
                    : "hover:bg-slate-100/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold",
                    selectedUser?.empId === u.empId ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {u.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className={cn("text-xs font-bold", selectedUser?.empId === u.empId ? "text-blue-700" : "text-slate-700")}>{u.fullName}</p>
                    <p className="text-[10px] text-slate-400">Employee ID: {u.empId}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Rights Configuration Area */}
        <main className="flex-1 bg-white flex flex-col overflow-hidden">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Users className="h-12 w-12 text-slate-100 mb-4" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select an Identity</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Access Control for {selectedUser.fullName}</h3>
                  <p className="text-xs text-slate-500">Configure visibility and printing permissions for imported reports.</p>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    placeholder="Search available reports..." 
                    className="pl-9 h-9 text-xs border-slate-200"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="max-w-5xl mx-auto grid grid-cols-1 gap-4">
                  {filteredReports.map(report => {
                    const reportCode = String(report.U_ReportCode || report.Code || "").trim();
                    const reportTitle = report.Name || report.U_FileName || `Report ${reportCode}`;
                    const isChecked = Boolean(permissions[reportCode]);
                    return (
                      <div key={reportCode || report.Code} className="group border rounded-xl p-4 flex items-center justify-between hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/50 transition-all bg-white">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center border group-hover:bg-blue-50 group-hover:border-blue-100">
                            <FileText className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{reportTitle}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-slate-500">{report.U_ExtType || ".rpt"}</span>
                              {report.U_FilePath ? `${report.U_FilePath}\\` : ""}{report.U_FileName}
                              {report.U_UserCode && (
                                <span className="text-slate-400 text-[10px]">
                                  (Uploaded by: {report.U_UserCode})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 px-4">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              Grant Access
                            </p>
                            <Switch 
                              checked={isChecked}
                              onCheckedChange={() => togglePermission(reportCode)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

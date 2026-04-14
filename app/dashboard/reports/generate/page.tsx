"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Loader2, 
  Search, 
  FileText,
  Printer,
  Download,
  Filter,
  BarChart3,
  CalendarDays,
  User,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { getAuthorizedReports, downloadReport, ReportData } from "@/api+/sap/reporting/reportingService";
import { cn } from "@/lib/utils";

export default function ReportGeneratePage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.empId) {
      const fetchReports = async () => {
        try {
          const data = await getAuthorizedReports(user.empId);
          setReports(data);
        } catch (error) {
          toast.error("Could not load authorized reports");
        } finally {
          setLoading(false);
        }
      };
      fetchReports();
    }
  }, [user]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => 
      r.Name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.U_FileName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reports, searchQuery]);

  const handlePrint = async (report: ReportData) => {
    if (!report.Code) return;
    
    setPrintingId(report.Code);
    try {
      await downloadReport({
        reportCode: report.Code,
        reportPath: report.U_FilePath,
        parameters: {
          UserCode: user?.empId,
          PrintDate: new Date().toISOString()
        }
      });
      toast.success("Generation Initiated", {
        description: `Processing ${report.Name || report.U_FileName}`
      });
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setPrintingId(null);
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
    <div className="flex flex-col min-h-screen bg-slate-50/50 font-sans">
      <header className="flex h-16 items-center justify-between border-b px-8 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">Reporting Hub</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Authorized Intelligence Access</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Filter reports..." 
              className="pl-10 h-10 text-xs border-slate-200 bg-slate-50 focus-visible:bg-white transition-all shadow-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto w-full">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-center">
            <div className="h-20 w-20 bg-white rounded-3xl border flex items-center justify-center mb-6 shadow-sm">
              <FileText className="h-8 w-8 text-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
            <p className="text-sm text-slate-500 max-w-xs mt-3 leading-relaxed font-medium">
              We couldn't find any reports authorized for your identity. Please contact your system administrator to assign reporting rights.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredReports.map(report => (
              <div 
                key={report.Code} 
                className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-blue-200 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <FileText className="h-6 w-6 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <div className="flex gap-2">
                    <span className="h-6 px-2.5 rounded-full bg-slate-100 text-[9px] font-bold text-slate-500 flex items-center uppercase">
                      {report.U_ExtType || ".rpt"}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 mb-8">
                  <h3 className="font-black text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                    {report.Name || report.U_FileName}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    Source manifest located at {report.U_FilePath}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-50 mt-auto grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold">LIVE SYNC</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 justify-end">
                    <User className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">SECURE</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-2 pt-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <Button 
                    onClick={() => handlePrint(report)}
                    disabled={!!printingId}
                    className="flex-1 h-10 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl"
                  >
                    {printingId === report.Code ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Printer className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-200">
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

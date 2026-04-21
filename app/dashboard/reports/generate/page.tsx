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
  BarChart3,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { getAuthorizedReports, getReports, downloadReport, ReportData } from "@/api+/sap/reporting/reportingService";
import ReportViewer from "@/components/reporting/ReportViewer";
import { cn } from "@/lib/utils";

type SortOrder = "asc" | "desc";

export default function ReportGeneratePage() {
  const { user } = useAuth();
  
  // State
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Viewer State
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [selectedReportName, setSelectedReportName] = useState("");

  useEffect(() => {
    if (user?.empId) {
      const fetchReports = async () => {
        setLoading(true);
        try {
          const [allReports, rights] = await Promise.all([
            getReports(),
            getAuthorizedReports(user.empId)
          ]);

          const authorizedCodes = new Set(
            rights.map((r: any) => String(r.U_ReportCode || r.u_reportcode || r.Code || "").trim().toLowerCase())
          );

          const filtered = allReports.filter(report => {
            const reportCode = String(report.Code || "").trim().toLowerCase();
            return authorizedCodes.has(reportCode);
          });

          setReports(filtered);
        } catch (error) {
          toast.error("Could not load authorized reports");
        } finally {
          setLoading(false);
        }
      };
      fetchReports();
    }
  }, [user]);

  const sortedAndFilteredReports = useMemo(() => {
    let result = reports.filter(r => 
      r.Name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.U_FileName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      const nameA = (a.Name || a.U_FileName || "").toLowerCase();
      const nameB = (b.Name || b.U_FileName || "").toLowerCase();
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    return result;
  }, [reports, searchQuery, sortOrder]);

  const handleGenerate = async (report: ReportData) => {
    if (!report.Code) return;
    
    setPrintingId(report.Code);
    setSelectedReportName(report.U_FileName || "Report");
    
    try {
      const pdfUrl = await downloadReport({
        ReportFileName: "PNLREPORT",
        Parameters: {
          FromDate: "2025-08-04",
          ToDate: "2026-08-04"
        }
      });
      
      setViewerUrl(pdfUrl);
    } catch (error) {
      toast.error("Generation Failed", {
        description: "Check reporting service logs"
      });
    } finally {
      setPrintingId(null);
    }
  };

  const toggleSort = () => setSortOrder(prev => prev === "asc" ? "desc" : "asc");

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6 animate-pulse">
          Synchronizing Authorized Records
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-w-0 bg-white font-sans">
      
      {/* HEADER */}
      <header className="flex shrink-0 h-14 items-center justify-between border-b px-6 bg-slate-50/50 sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <FileText className="h-5 w-5 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Report Generation</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Search reports..." 
              className="pl-9 w-64 h-9 text-[11px] border-slate-200 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0 w-full max-w-[1600px] mx-auto overflow-hidden">
        {viewerUrl ? (
          <div className="flex-1 m-6 bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
            <ReportViewer 
              url={viewerUrl} 
              title={selectedReportName}
              onClose={() => {
                setViewerUrl(null);
                URL.revokeObjectURL(viewerUrl);
              }} 
            />
          </div>
        ) : (
          <div className="p-6 overflow-y-auto">
            {sortedAndFilteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center mb-6">
              <FileText className="h-8 w-8 text-slate-200" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No Reports Found</h2>
            <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
              No reports matching your criteria or authorization.
            </p>
          </div>
        ) : (
          <div className={cn(
            "gap-4",
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col"
          )}>
            {sortedAndFilteredReports.map(report => (
              <div 
                key={report.Code} 
                className={cn(
                  "group relative bg-white border border-slate-200 rounded-xl transition-all hover:border-blue-200 hover:shadow-sm flex flex-col",
                  viewMode === "grid" ? "p-5" : "p-3 flex-row items-center justify-between"
                )}
              >
                <div className={cn("flex items-start gap-4", viewMode === "grid" ? "flex-col mb-6" : "flex-row items-center")}>
                  <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center border group-hover:bg-blue-50 transition-colors">
                    <FileText className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate w-55 group-hover:text-blue-700 transition-colors">
                      {report.U_FileName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="h-5 px-2 rounded bg-slate-100 text-[9px] font-bold text-slate-500 flex items-center uppercase tracking-wider">
                        {report.U_ExtType || ".rpt"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={cn("flex gap-2", viewMode === "grid" ? "mt-auto" : "ml-4")}>
                  <Button 
                    onClick={() => handleGenerate(report)}
                    disabled={!!printingId}
                    className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-md px-4"
                  >
                    {printingId === report.Code ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Printer className="h-3.5 w-3.5 mr-2" />
                        GENERATE
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        )}
      </main>
    </div>
  );
}

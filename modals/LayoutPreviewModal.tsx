"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Loader2, Printer, Star } from "lucide-react";
import { getLayouts, downloadReport, ReportData } from "@/api+/sap/reporting/reportingService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReportParameterModal from "@/modals/ReportParameterModal";
import ReportViewer from "@/components/reporting/ReportViewer";

interface LayoutPreviewModalProps {
  open: boolean;
  onClose: () => void;
  objectCode: number | string;
  docEntry: number;
  schemaName?: string;
}

const LayoutPreviewModal: React.FC<LayoutPreviewModalProps> = ({
  open,
  onClose,
  objectCode,
  docEntry,
  schemaName,
}) => {
  const [layouts, setLayouts] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<ReportData | null>(null);
  const [printing, setPrinting] = useState(false);
  const [showParamModal, setShowParamModal] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open && objectCode) {
      loadLayouts();
    } else {
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
        setViewerUrl(null);
      }
    }
  }, [open, objectCode]);

  const loadLayouts = async () => {
    setLoading(true);
    setSelectedLayout(null);
    try {
      const data = await getLayouts(objectCode);
      setLayouts(data);
      const defaultLayout = data.find((l) => l.U_IsDefault === "Y");
      if (defaultLayout) setSelectedLayout(defaultLayout);
    } catch {
      toast.error("Failed to load layouts");
    } finally {
      setLoading(false);
    }
  };

  const printLayoutDirect = async (
    layout: ReportData,
    customParamValues: Record<string, any>
  ) => {
    try {
      setPrinting(true);

      const parameters: Record<string, any> = { "DocKey@": docEntry };
      if (schemaName) parameters["Schema@"] = schemaName;

      (layout.Parameters || []).forEach((p) => {
        const paramNameLower = p.U_ParamName.toLowerCase();
        if (paramNameLower === "dockey@") {
          parameters[p.U_ParamName] = docEntry;
        } else if (paramNameLower === "schema@") {
          parameters[p.U_ParamName] = schemaName || "";
        } else {
          parameters[p.U_ParamName] = customParamValues[p.U_ParamName] !== undefined
            ? customParamValues[p.U_ParamName]
            : "";
        }
      });

      const pdfUrl = await downloadReport({
        FilePath: layout.U_FilePath + "\\" + layout.U_ActualFileName,
        ReportFileName: layout.U_FileName,
        FileType: 0,
        Parameters: parameters,
      });

      setViewerUrl(pdfUrl);
      setViewerTitle(layout.U_FileName || layout.Name || "Report Preview");
    } catch {
      toast.error("Failed to generate report.");
    } finally {
      setPrinting(false);
    }
  };

  const handlePrint = async () => {
    if (!selectedLayout) {
      toast.warning("Please select a layout to print.");
      return;
    }

    const systemParams = ["dockey@", "objectid@", "schema@"];
    const customParams = (selectedLayout.Parameters || []).filter(
      (p) => !systemParams.includes(p.U_ParamName.toLowerCase())
    );

    if (customParams.length > 0) {
      const initialValues: Record<string, any> = {};
      customParams.forEach((p) => {
        initialValues[p.U_ParamName] = "";
      });
      setParamValues(initialValues);
      setShowParamModal(true);
      return;
    }

    await printLayoutDirect(selectedLayout, {});
  };

  const handleParamSubmit = async () => {
    if (!selectedLayout) return;

    const systemParams = ["dockey@", "objectid@", "schema@"];
    const customParams = (selectedLayout.Parameters || []).filter(
      (p) => !systemParams.includes(p.U_ParamName.toLowerCase())
    );

    const hasEmpty = customParams.some(
      (p) => !String(paramValues[p.U_ParamName] || "").trim()
    );

    if (hasEmpty) {
      toast.error("Please fill all parameter values");
      return;
    }

    setShowParamModal(false);
    await printLayoutDirect(selectedLayout, paramValues);
  };

  const handleViewerClose = () => {
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    setViewerUrl(null);
  };

  // Portal-based full-screen viewer — renders directly on body, avoids all Dialog transform conflicts
  const viewerPortal =
    mounted && viewerUrl
      ? createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "white",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="flex-1 m-6 bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
              <ReportViewer
                url={viewerUrl}
                title={viewerTitle}
                onClose={handleViewerClose}
              />
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {viewerPortal}

      {/* Layout selector dialog — hidden while viewer is open */}
      <Dialog open={open && !viewerUrl} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col p-0 rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white font-bold flex items-center gap-2 text-base">
                <Printer className="h-5 w-5 text-blue-400" />
                Select Layout to Print
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Choose a print layout for document #{docEntry}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Layout List */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm">Loading layouts...</span>
              </div>
            )}

            {!loading && layouts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                <FileText className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium">No layouts found for this document type.</p>
              </div>
            )}

            {!loading &&
              layouts.map((layout) => {
                const isDefault = layout.U_IsDefault === "Y";
                const isSelected = selectedLayout?.Code === layout.Code;

                return (
                  <button
                    key={layout.Code}
                    onClick={() => setSelectedLayout(layout)}
                    className={cn(
                      "w-full text-left rounded-lg border px-4 py-3 transition-all duration-150",
                      "flex items-center justify-between gap-3 group",
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-400"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
                          isSelected ? "bg-blue-100" : "bg-slate-100"
                        )}
                      >
                        <FileText
                          className={cn(
                            "h-5 w-5",
                            isSelected ? "text-blue-600" : "text-slate-500"
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-semibold truncate",
                            isSelected ? "text-blue-900" : "text-slate-800"
                          )}
                        >
                          {layout.U_FileName || layout.Name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {layout.U_ActualFileName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDefault && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-2 py-0 bg-amber-100 text-amber-700 border border-amber-200 gap-1"
                        >
                          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                          Default
                        </Badge>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {layouts.length} layout{layouts.length !== 1 ? "s" : ""} available
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={!selectedLayout || printing}
                className="bg-slate-900 hover:bg-black text-white font-semibold gap-2 transition-all active:scale-95"
              >
                {printing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="h-3.5 w-3.5" />
                    Print Layout
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>

        {selectedLayout && (
          <ReportParameterModal
            open={showParamModal}
            onClose={() => setShowParamModal(false)}
            selectedReport={{
              ...selectedLayout,
              Parameters: (selectedLayout.Parameters || []).filter(
                (p) =>
                  !["dockey@", "objectid@", "schema@"].includes(
                    p.U_ParamName.toLowerCase()
                  )
              ),
            }}
            paramValues={paramValues}
            setParamValues={setParamValues}
            generating={printing}
            onSubmit={handleParamSubmit}
          />
        )}
      </Dialog>
    </>
  );
};

export default LayoutPreviewModal;

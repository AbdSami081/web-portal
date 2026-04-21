"use client";

import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Printer, 
  Loader2,
  Maximize,
  RotateCw,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Import react-pdf styles
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Setup the worker for react-pdf (Modern pdfjs versions use .mjs)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ReportViewerProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export default function ReportViewer({ url, title, onClose }: ReportViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.contentWindow?.print();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title || "Report"}.pdf`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/5 backdrop-blur-sm overflow-hidden">
      {/* TOOLBAR */}
      <div className="flex items-center justify-between px-6 h-14 bg-white border-b z-20">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate max-w-[300px]">
              {title || "Report Preview"}
            </h3>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border">
          <div className="flex items-center px-1 border-r border-slate-200">
             <Button variant="ghost" size="icon" onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))} disabled={pageNumber <= 1} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4 text-slate-500" />
             </Button>
             <span className="text-[11px] font-bold text-slate-600 px-3 min-w-[80px] text-center">
                {pageNumber} / {numPages || "?"}
             </span>
             <Button variant="ghost" size="icon" onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || prev))} disabled={pageNumber >= (numPages || 1)} className="h-8 w-8">
                <ChevronRight className="h-4 w-4 text-slate-500" />
             </Button>
          </div>

          <div className="flex items-center gap-1 px-1 border-r border-slate-200">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
              <ZoomOut className="h-4 w-4 text-slate-500" />
            </Button>
            <span className="text-[10px] font-bold text-slate-400 min-w-[40px] text-center uppercase tracking-widest">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
              <ZoomIn className="h-4 w-4 text-slate-500" />
            </Button>
          </div>

          <div className="flex items-center gap-1 px-1">
            <Button variant="ghost" size="icon" onClick={handleRotate} className="h-8 w-8 text-slate-400">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrint} className="h-8 w-8 text-slate-400">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="h-9 w-9 border hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* PDF VIEWER AREA */}
      <div className="flex-1 overflow-auto bg-slate-100 custom-scrollbar text-center">
        <div className="inline-block m-8 relative shadow-lg rounded-sm bg-white border text-left">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center p-40">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-6 animate-pulse">
                  Rendering Document...
                </p>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              rotate={rotation}
              className="transition-transform duration-300 ease-out"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}

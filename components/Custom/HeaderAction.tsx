"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FilePlus2, Keyboard, Loader2, Printer, GitFork, SearchCode, TextCursorInput } from "lucide-react";
import { toast } from "sonner";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { HeaderModalAction } from "../header-modal-action";
import { KeyboardShortcutsContent } from "../keyboard-shortcuts-content";
import { useAuth } from "@/context/authContext";
import { clearDocNavParams } from "@/lib/docNavParams";
import LayoutPreviewModal from "@/modals/LayoutPreviewModal";
import FMSSetupModal from "@/modals/FMSSetupModal";
import { useRelationshipMapStore } from "@/stores/useRelationshipMapStore";
import { getMenuUrlsByObjectCode } from "@/lib/menu-lookup";

interface Props {
  DocEntry: number;
  objectCode: number; // SAP UDO Object Code e.g. DocumentType enum value
  schemaName?: string;
  reset: (values: any) => void;
  defaultValues: any;
  resetStore: () => void;
}

const HeaderActions: React.FC<Props> = ({
  DocEntry,
  objectCode,
  schemaName,
  reset,
  defaultValues,
  resetStore,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [layoutModalOpen, setLayoutModalOpen] = useState(false);
  const [fmsModalOpen, setFmsModalOpen] = useState(false);
  const { isOpen: isRelMapOpen, openMap, closeMap } = useRelationshipMapStore();

  const activeSchema = schemaName || user?.companyDB || "";
  const isProduction =
    objectCode === 202 ||
    pathname?.toLowerCase().includes("/production");

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === "F2") {
        e.preventDefault();
        e.stopPropagation();
        setFmsModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNewDocument = () => {
    clearDocNavParams();
    const validUrls = getMenuUrlsByObjectCode(objectCode);
    if (validUrls.length > 0 && pathname && !validUrls.includes(pathname)) {
      router.push(validUrls[0]);
      return;
    }

    if (typeof window !== "undefined" && window.location.search) {
     router.replace(pathname || window.location.pathname);
    }
    reset({
      ...defaultValues,
      DocNum: 0,
      DocEntry: 0,
    } as any);
    resetStore();
  };

  const handlePrintClick = () => {
    if (!DocEntry || DocEntry === 0) {
      toast.warning("Please open or save a document before printing.");
      return;
    }
    setLayoutModalOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-1.5">

          {/* New Document */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleNewDocument}
                className="h-8 w-8 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all"
              >
                <FilePlus2 className="w-4 h-4 text-slate-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">New Document</TooltipContent>
          </Tooltip>

          {/* Print / Layout Selector */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handlePrintClick}
                disabled={!DocEntry || DocEntry === 0}
                className="h-8 w-8 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-40"
              >
                <Printer className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Print Layout</TooltipContent>
          </Tooltip>

          {/* Relationship Map */}
          {!isProduction && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (isRelMapOpen) {
                      closeMap();
                    } else {
                      openMap(objectCode, DocEntry);
                    }
                  }}
                  disabled={!DocEntry || DocEntry === 0}
                  className={`h-8 w-8 transition-all disabled:opacity-40 ${
                    isRelMapOpen
                      ? "bg-sky-100 border-sky-400 text-sky-700 shadow-inner"
                      : "border-slate-200 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600"
                  }`}
                >
                  <GitFork className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isRelMapOpen ? "Back to Document" : "Relationship Map"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* FMS / User-Defined Values Setup */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFmsModalOpen(true)}
                className="h-8 w-8 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
              >
                <SearchCode className="w-4 h-4 text-slate-600 hover:text-blue-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">FMS Setup (Alt+Shift+F2)</TooltipContent>
          </Tooltip>

          {/* Field name inspector toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.dispatchEvent(new CustomEvent("fms:toggle-inspector"))}
                className="h-8 w-8 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
              >
                <TextCursorInput className="w-4 h-4 text-slate-600 hover:text-blue-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Inspect field names (Alt+Shift+I)</TooltipContent>
          </Tooltip>

        </div>
      </TooltipProvider>

      {/* Keyboard Shortcuts */}
      <HeaderModalAction
        triggerIcon={Keyboard}
        triggerTooltip="Shortcut Keys"
        modalTitle="Keyboard Shortcuts"
        modalDescription="Quick reference for available keyboard shortcuts in the portal."
      >
        <KeyboardShortcutsContent />
      </HeaderModalAction>

      {/* Layout Preview Modal */}
      <LayoutPreviewModal
        open={layoutModalOpen}
        onClose={() => setLayoutModalOpen(false)}
        objectCode={objectCode}
        docEntry={DocEntry}
        schemaName={activeSchema}
      />

      {/* FMS Setup Modal */}
      <FMSSetupModal
        open={fmsModalOpen}
        onClose={() => setFmsModalOpen(false)}
        docType={objectCode}
      />
    </>
  );
};

export default HeaderActions;
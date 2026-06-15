"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilePlus2, Keyboard, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { HeaderModalAction } from "../header-modal-action";
import { KeyboardShortcutsContent } from "../keyboard-shortcuts-content";
import LayoutPreviewModal from "@/modals/LayoutPreviewModal";

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
  const [layoutModalOpen, setLayoutModalOpen] = useState(false);

  const handleNewDocument = () => {
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
        schemaName={schemaName}
      />
    </>
  );
};

export default HeaderActions;
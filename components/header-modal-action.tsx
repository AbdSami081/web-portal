"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface HeaderModalActionProps {
  triggerIcon: React.ComponentType<any>;
  triggerTooltip: string;
  modalTitle: string;
  modalDescription?: string;
  children: React.ReactNode;
  buttonClassName?: string;
}

export const HeaderModalAction: React.FC<HeaderModalActionProps> = ({
  triggerIcon: TriggerIcon,
  triggerTooltip,
  modalTitle,
  modalDescription,
  children,
  buttonClassName,
}) => {
  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 h-8 w-8 transition-all active:scale-95 shadow-xs hover:border-slate-300",
                  buttonClassName
                )}
              >
                <TriggerIcon className="w-4 h-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-slate-900 text-white border-slate-800 font-semibold shadow-md animate-in fade-in-0 zoom-in-95 duration-200"
          >
            {triggerTooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-xl border border-slate-100 bg-white/95 backdrop-blur-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            {modalTitle}
          </DialogTitle>
          {modalDescription && (
            <DialogDescription className="text-sm text-slate-500">
              {modalDescription}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

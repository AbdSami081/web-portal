import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BaseWidgetProps {
  id?: string;
  title: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export function BaseWidget({
  id,
  title,
  isLoading = false,
  isEmpty = false,
  className,
  contentClassName,
  children,
}: BaseWidgetProps) {
  return (
    <div
      id={id}
      className={cn(
        "flex flex-col h-full rounded-xl border border-border bg-card shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground truncate">
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className={cn("flex-1 overflow-hidden relative p-4", contentClassName)}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {isEmpty && !isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            No data available
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

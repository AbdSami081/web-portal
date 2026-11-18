"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface CopyDownFieldProps {
  children: React.ReactElement;
  onCopyDown: () => void;
  disabled?: boolean;
}

export function CopyDownField({ children, onCopyDown, disabled }: CopyDownFieldProps) {
  if (disabled) return children;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onCopyDown}>Copy to lines below</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  hasValue: boolean;
  onSearch: () => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "ghost" | "outline";
}

export function FieldLookupButton({
  hasValue,
  onSearch,
  onClear,
  disabled,
  className = "h-6 w-6 shrink-0",
  variant = "ghost",
}: Props) {
  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      className={className}
      onClick={hasValue ? onClear : onSearch}
      disabled={disabled}
      title={hasValue ? "Clear" : "Search"}
    >
      {hasValue ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
    </Button>
  );
}

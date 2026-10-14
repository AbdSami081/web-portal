import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Loader2, Printer, Settings2 } from "lucide-react";
import { searchParameterValues } from "@/api+/sap/reporting/reportingService";

interface ReportParameterModalProps {
  open: boolean;
  onClose: () => void;
  selectedReport: any;
  database?: string;
  paramValues: Record<string, any>;
  setParamValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  generating: boolean;
  onSubmit: () => void;
}

interface ParamValueOption {
  Value: string;
  Description?: string;
}

const PAGE_SIZE = 20;

// Dropdown for a Searchable parameter (CrystalReportService's SQL-literal resolver —
// a parameter literally named e.g. "@Select * From OITM") whose source table can hold
// thousands of rows. U_ParamValues is only a capped first page of PAGE_SIZE; typing
// here re-queries the live SearchParameterValues endpoint, and "Next" fetches the
// following page instead of assuming the initial page was the complete list.
function SearchableParamDropdown({
  paramName,
  initialValues,
  filePath,
  database,
  value,
  onChange,
}: {
  paramName: string;
  initialValues: ParamValueOption[];
  filePath: string;
  database?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ParamValueOption[]>(initialValues);
  const [offset, setOffset] = useState(initialValues.length);
  const [hasMore, setHasMore] = useState(initialValues.length >= PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = items.find((v) => v.Value === value);

  const runSearch = async (searchText: string) => {
    if (!filePath) return;
    setLoading(true);
    try {
      const result = await searchParameterValues(filePath, paramName, database, searchText, 0, PAGE_SIZE);
      setItems(result.values || []);
      setOffset((result.values || []).length);
      setHasMore(result.hasMore);
    } catch {
      // Leave whatever was already showing rather than clearing it on a failed search.
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 300);
  };

  const loadMore = async () => {
    if (!filePath) return;
    setLoading(true);
    try {
      const result = await searchParameterValues(filePath, paramName, database, query, offset, PAGE_SIZE);
      const fresh = result.values || [];
      setItems((prev) => [...prev, ...fresh]);
      setOffset((prev) => prev + fresh.length);
      setHasMore(result.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between h-10 text-sm font-normal border-slate-300 text-slate-700"
        >
          <span className="truncate">
            {selected ? selected.Description || selected.Value : value || "Select a value"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] max-w-[90vw] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={query}
            onValueChange={handleQueryChange}
          />
          <CommandList>
            {!loading && items.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {items.map((v, idx) => (
              <CommandItem
                key={`${v.Value}-${idx}`}
                value={v.Value}
                onSelect={() => {
                  onChange(v.Value);
                  setOpen(false);
                }}
              >
                {v.Description || v.Value}
              </CommandItem>
            ))}
            {hasMore && (
              <div className="p-1 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-blue-600 hover:bg-blue-50"
                  disabled={loading}
                  onClick={loadMore}
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Next
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const ReportParameterModal = ({
  open,
  onClose,
  selectedReport,
  database,
  paramValues,
  setParamValues,
  generating,
  onSubmit,
}: ReportParameterModalProps) => {
  const filePath = selectedReport?.U_FilePath && selectedReport?.U_ActualFileName
    ? `${selectedReport.U_FilePath}\\${selectedReport.U_ActualFileName}`
    : "";

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-lg shadow-2xl border border-slate-300">

        <div className="p-6 border-b border-slate-200 bg-slate-50/80">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-600" />
              Report Parameters
            </DialogTitle>

            <DialogDescription className="text-slate-600 text-xs mt-1">
              Fill in the required parameters for{" "}
              <span className="font-bold text-slate-800">
                {selectedReport?.U_FileName}
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-5">
          {selectedReport?.Parameters?.map((param: any, idx: number) => {
            // Radix Select throws if an item's value is "" (reserved to mean "clear/
            // placeholder"), and a dropdown's list of values can legitimately contain a
            // blank/NULL entry (e.g. a query row with no CardName). Drop those before
            // rendering instead of crashing the whole parameter popup.
            const validValues = (param.U_ParamValues || []).filter(
              (v: any) => v?.Value !== undefined && v?.Value !== null && String(v.Value).trim() !== ""
            );

            return (
            <div key={idx} className="space-y-2">

              <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                {param.U_ParamName}

                <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded normal-case tracking-normal">
                  {param.U_ParamType}
                </span>
              </Label>

              {param.U_ComponentType === "Dropdown" && param.Searchable ? (
                <SearchableParamDropdown
                  paramName={param.U_ParamName}
                  initialValues={validValues}
                  filePath={filePath}
                  database={database}
                  value={paramValues[param.U_ParamName] || ""}
                  onChange={(value) =>
                    setParamValues((prev) => ({
                      ...prev,
                      [param.U_ParamName]: value,
                    }))
                  }
                />
              ) : param.U_ComponentType === "Dropdown" && validValues.length > 0 ? (
                <Select
                  value={paramValues[param.U_ParamName] || ""}
                  onValueChange={(value) =>
                    setParamValues((prev) => ({
                      ...prev,
                      [param.U_ParamName]: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-10 text-sm border-slate-300 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder={`Select ${param.U_ParamName}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {validValues.map((v: any, vIdx: number) => (
                      <SelectItem key={vIdx} value={v.Value}>
                        {v.Description || v.Value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : param.U_ComponentType === "Date" ? (
                <Input
                  type="date"
                  value={paramValues[param.U_ParamName] || ""}
                  onChange={(e) =>
                    setParamValues((prev) => ({
                      ...prev,
                      [param.U_ParamName]: e.target.value,
                    }))
                  }
                  className="h-10 text-sm border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <Input
                  type={
                    param.U_ParamType?.toLowerCase().includes("number")
                      ? "number"
                      : "text"
                  }
                  placeholder={`Enter ${param.U_ParamName}`}
                  value={paramValues[param.U_ParamName] || ""}
                  onChange={(e) =>
                    setParamValues((prev) => ({
                      ...prev,
                      [param.U_ParamName]: e.target.value,
                    }))
                  }
                  className="h-10 text-sm border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
            );
          })}
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">

          <Button
            variant="ghost"
            onClick={onClose}
            className="px-5 font-bold text-slate-600 hover:bg-slate-200"
          >
            Cancel
          </Button>

          <Button
            onClick={onSubmit}
            disabled={generating}
            className="px-6 bg-slate-900 hover:bg-black text-white font-bold shadow-md transition-all active:scale-95"
          >
            {generating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Generate Report
              </div>
            )}
          </Button>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportParameterModal;

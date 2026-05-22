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
import { Loader2, Printer, Settings2 } from "lucide-react";

interface ReportParameterModalProps {
  open: boolean;
  onClose: () => void;
  selectedReport: any;
  paramValues: Record<string, any>;
  setParamValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  generating: boolean;
  onSubmit: () => void;
}

const ReportParameterModal = ({
  open,
  onClose,
  selectedReport,
  paramValues,
  setParamValues,
  generating,
  onSubmit,
}: ReportParameterModalProps) => {
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
          {selectedReport?.Parameters?.map((param: any, idx: number) => (
            <div key={idx} className="space-y-2">
              
              <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                {param.U_ParamName}

                <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded normal-case tracking-normal">
                  {param.U_ParamType}
                </span>
              </Label>

              {param.U_ComponentType === "Date" ? (
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
          ))}
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
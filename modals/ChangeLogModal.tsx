"use client";

import React, { useEffect, useState } from "react";
import { Check, History, Maximize2, Minimize2 } from "lucide-react";
import { getChangeLogEntries, type ChangeLogEntry } from "@/api+/sap/common/changeLogService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChangeLogModalProps {
  open: boolean;
  onClose: () => void;
  objectCode: number;
}

const columns: { key: keyof ChangeLogEntry; label: string }[] = [
  { key: "instance", label: "Instance" },
  { key: "objectCode", label: "Object Code" },
  { key: "updated", label: "Updated" },
  { key: "updatedByUserCode", label: "Updated By - User Code" },
  { key: "updatedByUserName", label: "Updated By - User Name" },
  { key: "updatedOnAt", label: "Updated On/At" },
  { key: "created", label: "Created" },
  { key: "createdByUserCode", label: "Created By - User Code" },
  { key: "createdByUserName", label: "Created By - User Name" },
  { key: "createdOnAt", label: "Created On/At" },
];

const ChangeLogModal: React.FC<ChangeLogModalProps> = ({
  open,
  onClose,
  objectCode,
}) => {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<number | null>(null);
  const [showDifferences, setShowDifferences] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntries([]);
      return;
    }

    let isCurrentRequest = true;
    setEntries([]);
    setSelectedInstance(null);
    setShowDifferences(false);

    getChangeLogEntries(objectCode)
      .then((result) => {
        if (!isCurrentRequest) return;
        setEntries(result);
        setSelectedInstance(result[0]?.instance ?? null);
      })
      .catch((error) => {
        if (!isCurrentRequest) return;
        console.error("Failed to load change log:", error);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [open, objectCode]);

  const closeModal = () => {
    setShowDifferences(false);
    setIsExpanded(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent
        className={`z-[100] flex max-h-[90vh] ${
          isExpanded
            ? "w-[96vw] max-w-[1200px] sm:max-w-[1200px]"
            : "w-[82vw] max-w-[960px] sm:max-w-[960px]"
        } flex-col gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-2xl`}
      >
        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 pr-8 text-left text-base font-semibold text-slate-900">
            <History className="h-4 w-4 text-slate-600" />
            Change Log
          </DialogTitle>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-label={isExpanded ? "Restore modal width" : "Expand modal width"}
          title={isExpanded ? "Restore modal width" : "Expand modal width"}
          className="absolute right-12 top-3 z-20 h-8 w-8 border-slate-200 bg-white"
        >
          {isExpanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>

        <div className="min-h-[280px] flex-1 overflow-auto bg-white p-3">
          <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
              <tr>
                <th className="w-9 border border-slate-200 px-2 py-2 font-semibold">
                  #
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap border border-slate-200 px-2 py-2 font-semibold"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr
                  key={entry.instance}
                  onClick={() => {
                    setSelectedInstance(entry.instance);
                    setShowDifferences(false);
                  }}
                  className={`cursor-pointer ${
                    selectedInstance === entry.instance
                      ? "bg-blue-50 text-slate-900"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <td className="border border-slate-200 px-2 py-2 text-slate-500">
                    {index + 1}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap border border-slate-200 px-2 py-2"
                    >
                      {entry[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {Array.from({ length: 10 }, (_, index) => (
                <tr key={`empty-${index}`} aria-hidden="true" className="h-7 bg-white">
                  <td className="border border-slate-200 px-2 py-1.5" />
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap border border-slate-200 px-2 py-1.5"
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {showDifferences && (
            <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              Showing mock change-log instance {selectedInstance}. The supplied
              sample contains header history only; field-level differences are
              not included.
            </div>
          )}
        </div>
<div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center">
  <div className="flex w-full gap-2">
    <Button
      type="button"
      onClick={closeModal}
      className="min-w-20 ml-auto bg-slate-900 text-white hover:bg-slate-800"
    >
      <Check className="mr-1 h-4 w-4" />
      OK
    </Button>
  </div>
</div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeLogModal;

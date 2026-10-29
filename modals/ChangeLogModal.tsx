"use client";

import React, { useMemo, useState } from "react";
import { Check, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChangeLogEntry {
  instance: number;
  objectCode: number;
  updated: string;
  updatedByUserCode: string;
  updatedByUserName: string;
  updatedOn: string;
  created: string;
  createdByUserCode: string;
  createdByUserName: string;
  createdOn: string;
}

interface ChangeLogModalProps {
  open: boolean;
  onClose: () => void;
  objectCode: number;
}

const mockChangeLogPayload = (objectCode: number): ChangeLogEntry[] => [
  {
    instance: 1,
    objectCode,
    updated: "28.10.26",
    updatedByUserCode: "Dev01",
    updatedByUserName: "Development",
    updatedOn: "28.10.26 17:41:28",
    created: "28.10.26",
    createdByUserCode: "Dev01",
    createdByUserName: "Development",
    createdOn: "28.10.26 17:41:28",
  },
  {
    instance: 2,
    objectCode,
    updated: "28.10.26",
    updatedByUserCode: "Dev01",
    updatedByUserName: "Development",
    updatedOn: "28.10.26 17:41:41",
    created: "28.10.26",
    createdByUserCode: "Dev01",
    createdByUserName: "Development",
    createdOn: "28.10.26 17:41:28",
  },
];

const columns: { key: keyof ChangeLogEntry; label: string }[] = [
  { key: "instance", label: "Instance" },
  { key: "objectCode", label: "Object Code" },
  { key: "updated", label: "Updated" },
  { key: "updatedByUserCode", label: "Updated By - User Code" },
  { key: "updatedByUserName", label: "Updated By - User Name" },
  { key: "updatedOn", label: "Updated On/At" },
  { key: "created", label: "Created" },
  { key: "createdByUserCode", label: "Created By - User Code" },
  { key: "createdByUserName", label: "Created By - User Name" },
  { key: "createdOn", label: "Created On/At" },
];

const ChangeLogModal: React.FC<ChangeLogModalProps> = ({
  open,
  onClose,
  objectCode,
}) => {
  const entries = useMemo(() => mockChangeLogPayload(objectCode), [objectCode]);
  const [selectedInstance, setSelectedInstance] = useState<number | null>(1);
  const [showDifferences, setShowDifferences] = useState(false);

  const closeModal = () => {
    setShowDifferences(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent className="z-[100] flex max-h-[90vh] w-[96vw] max-w-[1200px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1200px]">
        <DialogHeader className="border-b bg-slate-800 px-5 py-3 text-white">
          <DialogTitle className="text-left text-base font-medium text-white">
            Change Log
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[280px] flex-1 overflow-auto p-3">
          <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
              <tr>
                <th className="w-9 border border-slate-300 px-2 py-1.5 font-medium">
                  #
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap border border-slate-300 px-2 py-1.5 font-medium"
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
                      ? "bg-blue-100"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-500">
                    {index + 1}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap border border-slate-300 px-2 py-1.5"
                    >
                      {entry[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {Array.from({ length: 10 }, (_, index) => (
                <tr key={`empty-${index}`} aria-hidden="true" className="h-7 bg-slate-50">
                  <td className="border border-slate-300 px-2 py-1.5" />
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap border border-slate-300 px-2 py-1.5"
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

        <div className="flex flex-col-reverse gap-2 border-t bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button type="button" onClick={closeModal} className="min-w-20">
              <Check className="mr-1 h-4 w-4" />
              OK
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="min-w-20"
            >
              Cancel
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={selectedInstance === null}
            onClick={() => setShowDifferences((shown) => !shown)}
            className="sm:ml-auto"
          >
            <Columns3 className="mr-2 h-4 w-4" />
            {showDifferences ? "Hide Differences" : "Show Differences"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeLogModal;

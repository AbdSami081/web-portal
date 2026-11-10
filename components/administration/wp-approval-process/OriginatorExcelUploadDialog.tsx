"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SapUserOption } from "@/components/administration/wp-approval-process/SapUserCombobox";
import {
  matchOriginatorUserCodes,
  readOriginatorExcelFile,
} from "@/lib/approval-process/parse-originator-excel";

const EXAMPLE_CODES = ["USR001", "USR002", "USR003", "USR004"];

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function OriginatorExcelUploadDialog({
  open,
  onOpenChange,
  users,
  selectedIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: SapUserOption[];
  selectedIds: number[];
  onAdd: (users: SapUserOption[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const usersRef = useRef(users);
  const selectedIdsRef = useRef(selectedIds);
  usersRef.current = users;
  selectedIdsRef.current = selectedIds;
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const resetFeedback = () => {
    setFileError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetFeedback();
      setReading(false);
    }
    onOpenChange(next);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setFileError(null);
    try {
      const rows = await readOriginatorExcelFile(file);
      const match = matchOriginatorUserCodes(rows, usersRef.current, selectedIdsRef.current);
      if (match.added.length > 0) onAdd(match.added);

      const rejected = [...match.unmatched, ...match.invalid];
      if (rejected.length > 0) {
        const addedNote =
          match.added.length > 0
            ? `Added ${countLabel(match.added.length, "originator", "originators")}. `
            : "";
        toast.error(`${addedNote}These user codes could not be added: ${rejected.join(", ")}`, {
          duration: Math.min(15000, 6000 + rejected.length * 400),
        });
      } else if (match.added.length > 0) {
        toast.success(`Added ${countLabel(match.added.length, "originator", "originators")}.`);
      } else if (match.duplicates.length > 0) {
        toast.message("Those users are already in the list.");
      } else {
        toast.error("No user codes were found in the first column.");
      }
      handleOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "This file could not be read.";
      setFileError(message);
      toast.error(message);
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload originators from Excel</DialogTitle>
          <DialogDescription>
            The file is read in the browser and matched to the users already loaded on this page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-slate-600">
          <ol className="list-decimal space-y-1 pl-4">
            <li>Create an Excel file (.xlsx or .xls) and put the codes on the first sheet.</li>
            <li>Type UserCode in the first cell of the first column.</li>
            <li>List one user code in each row directly underneath that header.</li>
            <li>Save the file, then choose it with Upload Excel.</li>
          </ol>
          <p>Only the first column is read. Other columns are ignored.</p>

          <div className="overflow-hidden rounded-md border border-slate-300 text-xs shadow-sm">
            <div className="grid grid-cols-[36px_1fr_1fr] bg-[#217346] text-white">
              <div className="px-1 py-1" />
              <div className="border-l border-white/25 px-2 py-1 text-center font-semibold">A</div>
              <div className="border-l border-white/25 px-2 py-1 text-center font-semibold">B</div>
            </div>
            <div className="grid grid-cols-[36px_1fr_1fr] border-t border-slate-200 bg-emerald-50 font-semibold text-slate-800">
              <div className="bg-slate-100 px-1 py-1.5 text-center text-slate-500">1</div>
              <div className="border-l border-slate-200 px-2 py-1.5">UserCode</div>
              <div className="border-l border-slate-200 bg-slate-50 px-2 py-1.5 font-normal text-slate-400">
                ignored
              </div>
            </div>
            {EXAMPLE_CODES.map((code, index) => (
              <div
                key={code}
                className="grid grid-cols-[36px_1fr_1fr] border-t border-slate-200 text-slate-800"
              >
                <div className="bg-slate-100 px-1 py-1.5 text-center text-slate-500">{index + 2}</div>
                <div className="border-l border-slate-200 bg-emerald-50/60 px-2 py-1.5 font-mono">{code}</div>
                <div className="border-l border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-300">—</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Column A must start with the UserCode header. Each code below it is matched to a user. Duplicate
            codes and users already selected are skipped.
          </p>
        </div>

        {fileError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{fileError}</p>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
          }}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={reading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={reading || users.length === 0}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {reading ? "Reading…" : "Upload Excel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

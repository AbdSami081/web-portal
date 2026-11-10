"use client";

import { useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import { toast } from "sonner";

import { copyUserFieldAccess } from "@/api+/sap/administration/administrationService";
import type { OhemUser } from "@/api+/sap/authorization/authorizationService";
import { clearFieldAccessCache } from "@/lib/field-access/fieldAccessState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function userCodeOf(user: OhemUser) {
  return String(user.empId ?? user.userCode ?? "").trim();
}

export function CopyFieldAccessDialog({
  open,
  onOpenChange,
  users,
  sourceUserCode,
  sourceUserName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: OhemUser[];
  sourceUserCode: string;
  sourceUserName: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [copying, setCopying] = useState(false);

  const targets = useMemo(
    () => users.filter((user) => userCodeOf(user) && userCodeOf(user) !== sourceUserCode),
    [users, sourceUserCode]
  );

  const visibleUsers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return targets;
    return targets.filter((user) => {
      const code = userCodeOf(user).toLowerCase();
      const name = (user.fullName ?? "").toLowerCase();
      return code.includes(value) || name.includes(value);
    });
  }, [targets, query]);

  const close = (next: boolean) => {
    if (!next) {
      setSelected([]);
      setQuery("");
      setCopying(false);
    }
    onOpenChange(next);
  };

  const toggle = (code: string) => {
    setSelected((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    );
  };

  const copyAccess = async () => {
    if (!sourceUserCode || selected.length === 0) return;
    setCopying(true);
    try {
      const result = await copyUserFieldAccess(sourceUserCode, selected);
      if (result.sourceRowCount === 0) {
        toast.error(`${sourceUserName} has no field access to copy. No permissions were changed.`);
        return;
      }
      clearFieldAccessCache(selected);
      toast.success(
        `Copied field access from ${sourceUserName} to ${result.targetCount} ${
          result.targetCount === 1 ? "user" : "users"
        }.`
      );
      close(false);
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: string } | string } })?.response?.data;
      const message =
        typeof response === "string"
          ? response
          : response?.message || "Failed to copy field access.";
      toast.error(message);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy authorization</DialogTitle>
          <DialogDescription>
            Copy {sourceUserName}&apos;s field access to the selected users.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users..."
              className="h-9 pl-9 text-xs"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border">
            {visibleUsers.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-400">No users found.</p>
            ) : (
              visibleUsers.map((user) => {
                const code = userCodeOf(user);
                const checked = selected.includes(code);
                return (
                  <label
                    key={code}
                    className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-0 hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(code)}
                      aria-label={`Select ${user.fullName || code}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {user.fullName || code}
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">{code}</span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={copying}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" disabled={copying || selected.length === 0} onClick={() => void copyAccess()}>
            <Copy className="h-4 w-4" />
            {copying ? "Copying..." : "Copy Authorization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

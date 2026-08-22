"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useBranchStore } from "@/stores/useBranchStore";
import { cn } from "@/lib/utils";
import { Building2, Check } from "lucide-react";

export function BranchSelectionModal() {
  const { needsBranchSelection, assignedBranches, suggestedDefaultBranch, setSessionDefaultBranch, setNeedsBranchSelection } = useBranchStore();
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (!needsBranchSelection) return;
    const suggested = assignedBranches.find((b) => b.BPLID === suggestedDefaultBranch);
    if (suggested) {
      setSelected(suggested.BPLID);
    } else if (assignedBranches.length === 1) {
      setSelected(assignedBranches[0].BPLID);
    }
  }, [needsBranchSelection, assignedBranches, suggestedDefaultBranch]);

  if (!needsBranchSelection) return null;

  const handleConfirm = () => {
    if (selected === null) return;
    setSessionDefaultBranch(selected);
  };

  const handleCancel = () => {
    setNeedsBranchSelection(false);
  };

  return (
    <Dialog open={needsBranchSelection}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl p-0 gap-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-5 border-b space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 shrink-0">
              <Building2 className="size-4 text-primary" />
            </div>
            <DialogTitle className="text-base">Select Default Branch</DialogTitle>
          </div>
          <DialogDescription className="pl-[42px]">
            Choose the branch you want to work in for this session.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-80">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 pl-6">#</TableHead>
                <TableHead>Branch Code</TableHead>
                <TableHead>Branch Name</TableHead>
                <TableHead className="text-right pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedBranches.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    No branches assigned.
                  </TableCell>
                </TableRow>
              ) : (
                assignedBranches.map((b, idx) => {
                  const isSelected = selected === b.BPLID;
                  return (
                    <TableRow
                      key={b.BPLID}
                      onClick={() => setSelected(b.BPLID)}
                      className={cn(
                        "cursor-pointer",
                        isSelected && "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <TableCell className="pl-6 text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{b.BPLID}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          {isSelected && <Check className="size-4 text-primary shrink-0" />}
                          {b.BPLName}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {b.Disabled === "tYES" ? (
                          <Badge variant="destructive">Inactive</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected === null}>
            Set as Default
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

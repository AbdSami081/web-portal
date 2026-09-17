import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUoMStore, UoM } from "@/stores/useUoMStore";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (uom: UoM) => void;
}

export function UoMSelectorDialog({ open, onClose, onSelect }: Props) {
  const { uoms, isLoading, loadUoMs } = useUoMStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      loadUoMs();
    }
  }, [open, loadUoMs]);

  const handleSelect = (uom: UoM) => {
    onSelect(uom);
    handleClose();
  };

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  const filteredUoMs = useMemo(() => {
    const term = search.toLowerCase();
    return uoms.filter(
      (u) => u.Code.toLowerCase().includes(term) || u.Name.toLowerCase().includes(term)
    );
  }, [uoms, search]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Unit of Measure</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Search units..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-72 border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={2} className="p-4 text-center">Loading units...</td>
                </tr>
              ) : filteredUoMs.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-4 text-center">No units found.</td>
                </tr>
              ) : (
                filteredUoMs.map((u) => (
                  <tr
                    key={u.AbsEntry}
                    onClick={() => handleSelect(u)}
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="p-2 font-medium">{u.Code}</td>
                    <td className="p-2 text-muted-foreground">{u.Name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollArea>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

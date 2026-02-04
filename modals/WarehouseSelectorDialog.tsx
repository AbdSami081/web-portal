import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Warehouse } from "@/types/warehouse/warehouse";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { getwarehouses } from "@/api+/sap/master-data/warehouses";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (warehouse: Warehouse) => void;
}

export function WarehouseSelectorDialog({ open, onClose, onSelect }: Props) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchWarehousesData = async () => {
    setLoading(true);
    try {
      const res = await getwarehouses();
      setWarehouses(res);
    } catch (error) {
      console.error("Failed to fetch warehouses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchWarehousesData();
    }
  }, [open]);

  const handleSelect = (warehouse: Warehouse) => {
    onSelect(warehouse);
    handleClose();
  };

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  const filteredWarehouses = warehouses.filter((w) =>
    w.WhsCode.toLowerCase().includes(search.toLowerCase()) ||
    w.WhsName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Warehouse</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Search warehouses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" onClick={fetchWarehousesData}>
            Refresh
          </Button>
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
              {loading ? (
                <tr>
                  <td colSpan={2} className="p-4 text-center">Loading warehouses...</td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-4 text-center">No warehouses found.</td>
                </tr>
              ) : (
                filteredWarehouses.map((w) => (
                  <tr
                    key={w.WhsCode}
                    onClick={() => handleSelect(w)}
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="p-2 font-medium">{w.WhsCode}</td>
                    <td className="p-2 text-muted-foreground">{w.WhsName}</td>
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

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Item } from "@/types/sales/Item.type";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { getItemsList } from "@/api+/sap/master-data/items";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectItems: (items: Item[]) => void;
  multiple?: boolean;
}

export function ItemSelectorDialog({ open, onClose, onSelectItems, multiple = true }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );

  const top = 20;

  const fetchItems = async (search: string, page: number, append = true) => {
    setLoading(true);
    const skip = (page - 1) * top;
    try {
      const res = await getItemsList(search, skip, top);
      setItems((prev) => (append ? [...prev, ...res] : res));
      setHasMore(res.length === top);
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setItems([]);
    setPage(1);
    fetchItems(value, 1, false);
  }, 500);

  useEffect(() => {
    if (page > 1) fetchItems(search, page);
  }, [page]);

  const handleLoadMore = () => {
    if (hasMore && !loading) setPage((prev) => prev + 1);
  };

  const handleConfirm = () => {
    const selectedItems = items.filter((i) =>
      selectedCodes.includes(i.itemCode)
    );
    setSubmitting(true);
    setTimeout(() => {
      onSelectItems(selectedItems);
      handleClose();
      setSubmitting(false);
    }, 0);
  };

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (open && !hasFetchedRef.current) {
      fetchItems("", 1, false);
      hasFetchedRef.current = true;
    }
  }, [open]);

  const handleClose = () => {
    setSelectedCodes([]);
    setSearch("");
    setItems([]);
    setPage(1);
    setHasMore(true);
    setLastSelectedIndex(null);
    hasFetchedRef.current = false;
    onClose();
  };

  const handleRowClick = (
    idx: number,
    itemCode: string,
    e: React.MouseEvent
  ) => {
    let newSelectedCodes = [...selectedCodes];

    if (!multiple) {
      newSelectedCodes = [itemCode];
    } else if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, idx);
      const end = Math.max(lastSelectedIndex, idx);
      const rangeItems = items.slice(start, end + 1).map((i) => i.itemCode);
      newSelectedCodes = Array.from(new Set([...newSelectedCodes, ...rangeItems]));
    } else {
      if (newSelectedCodes.includes(itemCode)) {
        newSelectedCodes = newSelectedCodes.filter((c) => c !== itemCode);
      } else {
        newSelectedCodes.push(itemCode);
      }
      setLastSelectedIndex(idx);
    }

    setSelectedCodes(newSelectedCodes);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl w-full mt-10 mb-10"
        style={{ maxHeight: "none" }}
      >
        <DialogHeader>
          <DialogTitle>Select Items</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debouncedSearch(e.target.value);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchItems(search, 1, false)}
          >
            Refresh
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedCodes.length === 0}
          >
            {submitting ? `Adding...` : multiple ? `Add ${selectedCodes.length} Item(s)` : `Select Item`}
          </Button>
        </div>

        <ScrollArea className="h-80 border rounded">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {multiple && <th className="p-2 text-left w-10">Select</th>}
                <th className="p-2 text-left">Item Code</th>
                <th className="p-2 text-left">Item Description</th>
                <th className="p-2 text-left">In Stock</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedCodes.includes(item.itemCode) ? "bg-blue-100" : ""
                    }`}
                  onClick={(e) => handleRowClick(idx, item.itemCode, e)}
                  onDoubleClick={() => !multiple && handleConfirm()}
                >
                  {multiple && (
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(item.itemCode)}
                        readOnly
                      />
                    </td>
                  )}
                  <td className="p-2">{item.itemCode}</td>
                  <td className="p-2">{item.itemName}</td>
                  <td className="p-2">{item.onHand}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div className="text-center py-4">
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={handleLoadMore}
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end mt-4 gap-2">
          <div>
            <span className="text-sm text-muted-foreground align-middle">
              {items.length} items
            </span>
          </div>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedCodes.length === 0}
          >
            {submitting ? `Adding...` : multiple ? `Add ${selectedCodes.length} Item(s)` : `Add Item`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

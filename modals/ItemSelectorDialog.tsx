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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Item } from "@/types/sales/Item.type";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { getItemsList } from "@/api+/sap/master-data/items";
import { getResourcesList } from "@/api+/sap/master-data/resources";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectItems: (items: Item[]) => void;
  multiple?: boolean;
}

type SelectorType = "item" | "resource";

export function ItemSelectorDialog({ open, onClose, onSelectItems, multiple = true }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectorType, setSelectorType] = useState<SelectorType>("item");
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

  const normalizeResource = (resource: any): Item => ({
    ...resource,
    ItemCode: resource.ItemCode || resource.Code || resource.VisCode || "",
    ItemName: resource.ItemName || resource.Name || resource.ItemDescription || "",
    ItemDescription: resource.ItemDescription || resource.Name || resource.ItemName || "",
    SelectorType: "resource",
  });

  const fetchItems = async (search: string, page: number, append = true, type: SelectorType = selectorType) => {
    setLoading(true);
    const skip = (page - 1) * top;
    try {
      if (type === "resource") {
        const resources = await getResourcesList();
        const query = search.trim().toLowerCase();
        const filteredResources = query
          ? resources.filter((resource: any) => {
            const code = String(resource.Code || resource.VisCode || resource.ItemCode || "").toLowerCase();
            const name = String(resource.Name || resource.ItemName || resource.ItemDescription || "").toLowerCase();
            return code.includes(query) || name.includes(query);
          })
          : resources;
        const normalizedResources = filteredResources.map(normalizeResource);
        setItems(normalizedResources);
        setHasMore(false);
      } else {
        const res = await getItemsList(search, skip, top);
        setItems((prev) => (append ? [...prev, ...res] : res));
        setHasMore(res.length === top);
      }
    } catch (err) {
      console.error(`Failed to fetch ${type === "resource" ? "resources" : "items"}`, err);
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
      selectedCodes.includes(i.ItemCode)
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

  const handleSelectorTypeChange = (value: SelectorType) => {
    setSelectorType(value);
    setSelectedCodes([]);
    setSearch("");
    setItems([]);
    setPage(1);
    setHasMore(true);
    setLastSelectedIndex(null);
    fetchItems("", 1, false, value);
  };

  const handleClose = () => {
    setSelectedCodes([]);
    setSearch("");
    setItems([]);
    setPage(1);
    setHasMore(true);
    setSelectorType("item");
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
      const rangeItems = items.slice(start, end + 1).map((i) => i.ItemCode);
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
          <DialogTitle>{selectorType === "resource" ? "Select Resources" : "Select Items"}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          <Select value={selectorType} onValueChange={(value: SelectorType) => handleSelectorTypeChange(value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="item">Item</SelectItem>
              <SelectItem value="resource">Resource</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder={selectorType === "resource" ? "Search resources..." : "Search items..."}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debouncedSearch(e.target.value);
            }}
          />
        </div>

        <ScrollArea className="h-80 border rounded">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {multiple && <th className="p-2 text-left w-10">Select</th>}
                <th className="p-2 text-left">{selectorType === "resource" ? "Resource Code" : "Item Code"}</th>
                <th className="p-2 text-left">{selectorType === "resource" ? "Resource Name" : "Item Description"}</th>
                <th className="p-2 text-left">{selectorType === "resource" ? "Type" : "In Stock"}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedCodes.includes(item.ItemCode) ? "bg-blue-100" : ""
                    }`}
                  onClick={(e) => handleRowClick(idx, item.ItemCode, e)}
                  onDoubleClick={() => !multiple && handleConfirm()}
                >
                  {multiple && (
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(item.ItemCode)}
                        readOnly
                      />
                    </td>
                  )}
                  <td className="p-2">{item.ItemCode}</td>
                  <td className="p-2">{item.ItemName}</td>
                  <td className="p-2">
                    {
                    selectorType === "resource"
                      ? item.Type === "rtLabor"
                        ? "Labour"
                        : item.Type === "rtMachine"
                        ? "Machine"
                        : item.Type === "rtOther"
                        ? "Other"
                        : item.Type
                      : item.OnHand
                    }
                  </td>
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
              {items.length} {selectorType === "resource" ? "resources" : "items"}
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
            {submitting ? `Adding...` : multiple ? `Add ${selectedCodes.length} ${selectorType === "resource" ? "Resource(s)" : "Item(s)"}` : `Add ${selectorType === "resource" ? "Resource" : "Item"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

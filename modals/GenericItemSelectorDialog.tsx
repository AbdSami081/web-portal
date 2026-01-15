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
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"; 

interface Column {
  key: string;
  header: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectItems: (items: any[]) => void; // Uses 'any[]' for generic selected items
  data: any[]; // The full list of data to select from
  columns: Column[]; // Columns to display in the list
  searchKeys: string[]; // Keys to search against (e.g., ["ItemCode", "ItemName"])
  itemCodeKey: string; // The unique key for each item (e.g., "ItemCode")
  pageSize?: number; // Optional page size, defaults to 50
}

export function GenericItemSelectorDialog({
  open,
  onClose,
  onSelectItems,
  data,
  columns,
  searchKeys,
  itemCodeKey,
  pageSize = 20,
}: Props) {
  const [displayedItems, setDisplayedItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = (searchQuery: string, pageNum: number, append = true) => {
    setLoading(true);
    const skip = (pageNum - 1) * pageSize;

    const lowerSearchQuery = searchQuery.toLowerCase();
    const filtered = data.filter((item) =>
      searchKeys.some((key) =>
        item[key]?.toString().toLowerCase().includes(lowerSearchQuery)
      )
    );

    const paged = filtered.slice(skip, skip + pageSize);

    setDisplayedItems((prev) => {
      const merged = append ? [...prev, ...paged] : [...paged];
      return merged.filter(
        (item, index, self) =>
          index ===
          self.findIndex((i) => i[itemCodeKey] === item[itemCodeKey])
      );
    });
    setHasMore(skip + pageSize < filtered.length);
    setLoading(false);
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDisplayedItems([]);
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
    const selectedItems = data.filter((i) =>
      selectedItemKeys.includes(i[itemCodeKey])
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
    setSelectedItemKeys([]);
    setSearch("");
    setDisplayedItems([]);
    setPage(1);
    setHasMore(true);
    hasFetchedRef.current = false;
    onClose();
  };

  const getMainColumnValue = (item: any) => {
    const mainKey = columns[0]?.key;
    return mainKey ? item[mainKey] : item[itemCodeKey];
  };

  const getSecondaryColumnValue = (item: any) => {
    const secondaryKey = columns[1]?.key;
    return columns.length > 1 && secondaryKey ? item[secondaryKey] : undefined;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl w-full mt-10 mb-10"
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
          {/* <Button
            type="button"
            variant="outline"
            onClick={() => fetchItems(search, 1, false)}
          >
            Refresh
          </Button> */}

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedItemKeys.length === 0}
          >
            {submitting ? `Adding...` : `Add ${selectedItemKeys.length} Item(s)`}
          </Button>
        </div>

        <ScrollArea className="h-80 border rounded">
          <div className="divide-y text-sm">
            {displayedItems.length === 0 && !loading && (
                <div className="text-center py-4 text-muted-foreground">
                    No items found.
                </div>
            )}
            {displayedItems.map((item) => (
              <label
                key={item[itemCodeKey]}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selectedItemKeys.includes(item[itemCodeKey])}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...selectedItemKeys, item[itemCodeKey]]
                      : selectedItemKeys.filter(
                          (c) => c !== item[itemCodeKey]
                        );
                    setSelectedItemKeys(updated);
                  }}
                />
                <div>
                    {/* Display the main column */}
                  <div className="font-medium">
                    {getMainColumnValue(item)}
                  </div>
                    {/* Display the secondary column if available */}
                  {getSecondaryColumnValue(item) && (
                    <div className="text-muted-foreground">
                      {getSecondaryColumnValue(item)}
                    </div>
                  )}
                </div>
              </label>
            ))}

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
          </div>
        </ScrollArea>

        <div className="flex justify-end mt-4 gap-2">
          <div>
            <span className="text-sm text-muted-foreground align-middle">
              {displayedItems.length} items shown
            </span>
          </div>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedItemKeys.length === 0}
          >
            {submitting ? `Adding...` : `Add ${selectedItemKeys.length} Item(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
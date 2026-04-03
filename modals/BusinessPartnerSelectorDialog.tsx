
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
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { getCustomers } from "@/api+/sap/master-data/business-partners";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (bp: BusinessPartner) => void;
}

export function BusinessPartnerSelectorDialog({
  open,
  onClose,
  onSelect,
}: Props) {
  const [items, setItems] = useState<BusinessPartner[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchPartners = async (searchText: string, pageNum: number, append = true) => {
    setLoading(true);
    const top = 20;
    const skip = (pageNum - 1) * top;

    const data = await getCustomers(searchText, skip, top);
    console.log("Fetched business partners:", data);
    
    if (data && data.length > 0) {
      setItems((prev) => (append ? [...prev, ...data] : [...data]));
      setHasMore(data.length === top);
    } else {
      if (!append) setItems([]);
      setHasMore(false);
    }
    setLoading(false);
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setItems([]);
    setPage(1);
    fetchPartners(value, 1, false);
  }, 500);

  useEffect(() => {
    if (open && !hasFetchedRef.current) {
      fetchPartners("", 1, false);
      hasFetchedRef.current = true;
    }
  }, [open]);

  useEffect(() => {
    if (page > 1) fetchPartners(search, page);
  }, [page]);

  const handleLoadMore = () => {
    if (hasMore && !loading) setPage((prev) => prev + 1);
  };

  const handleSelect = (bp: BusinessPartner) => {
    onSelect(bp);
    handleClose();
  };

  const handleClose = () => {
    setSearch("");
    setItems([]);
    setPage(1);
    setHasMore(true);
    hasFetchedRef.current = false;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Business Partner</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debouncedSearch(e.target.value);
            }}
          />
        </div>

        <ScrollArea className="h-80 border rounded">
          <div className="grid grid-cols-3 gap-2 text-sm font-medium border-b px-4 py-2 bg-gray-100">
            <div>Code</div>
            <div>Name</div>
            <div className="text-right">Balance</div>
          </div>

          <div className="divide-y">
            {items.map((bp) => (
              <button
                key={bp.CardCode}
                className="grid grid-cols-3 gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
                onClick={() => handleSelect(bp)}
              >
                <div>{bp.CardCode}</div>
                <div>{bp.CardName}</div>
                <div className="text-right">{bp.Balance}</div>
              </button>
            ))}

            {hasMore && (
              <div className="text-center py-4">
                <Button
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

        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            className="bg-gray-900 text-white"
            onClick={handleClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

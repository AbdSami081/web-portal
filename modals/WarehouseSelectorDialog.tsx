// import { useEffect, useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Warehouse } from "@/types/warehouse.type";
// import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
// import axios from "axios";

// interface Props {
//   open: boolean;
//   onClose: () => void;
//   onSelect: (warehouse: Warehouse) => void;
// }

// export function WarehouseSelectorDialog({ open, onClose, onSelect }: Props) {
//   const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [loading, setLoading] = useState(false);

//   const top = 50;

//   const fetchWarehouses = async (
//     search: string,
//     page: number,
//     append = true
//   ) => {
//     setLoading(true);
//     const skip = (page - 1) * top;
//     const res = await axios.get(
//       `/api/sap/master-data/warehouses?search=${encodeURIComponent(
//         search
//       )}&top=${top}&skip=${skip}`
//     );
//     const data = res.data;
//     console.log("Fetched warehouses:", res);
//     if (!data.warehouses) {
//       console.error("No warehouses found in response:", data);
//       setLoading(false);
//       return;
//     }

//     setWarehouses((prev) => {
//       const merged = append
//         ? [...prev, ...data.warehouses]
//         : [...data.warehouses];
//       return merged.filter(
//         (item, index, self) =>
//           index ===
//           self.findIndex((i) => i.WarehouseCode === item.WarehouseCode)
//       );
//     });
//     setHasMore(data.warehouses.length === top);
//     setLoading(false);
//   };

//   const debouncedSearch = useDebouncedCallback((value: string) => {
//     setWarehouses([]);
//     setPage(1);
//     fetchWarehouses(value, 1, false);
//   }, 500);

//   useEffect(() => {
//     if (open) {
//       setWarehouses([]);
//       setPage(1);
//       fetchWarehouses("", 1, false);
//     }
//   }, [open]);

//   useEffect(() => {
//     if (page > 1) fetchWarehouses(search, page);
//   }, [page]);

//   const handleLoadMore = () => {
//     if (hasMore && !loading) setPage((prev) => prev + 1);
//   };

//   const handleSelect = (warehouse: Warehouse) => {
//     onSelect(warehouse);
//     handleClose();
//   };

//   const handleClose = () => {
//     setSearch("");
//     setWarehouses([]);
//     setPage(1);
//     onClose();
//   };

//   return (
//     <Dialog open={open} onOpenChange={handleClose}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle>Select Warehouse</DialogTitle>
//         </DialogHeader>

//         <div className="flex gap-2 mb-2">
//           <Input
//             placeholder="Search warehouses..."
//             value={search}
//             onChange={(e) => {
//               setSearch(e.target.value);
//               debouncedSearch(e.target.value);
//             }}
//           />
//           <Button
//             variant="outline"
//             onClick={() => fetchWarehouses(search, 1, false)}
//           >
//             Refresh
//           </Button>
//         </div>

//         <ScrollArea className="h-72 border rounded">
//           <div className="divide-y text-sm">
//             {warehouses.map((w: Warehouse) => (
//               <button
//                 key={w.WarehouseCode}
//                 onClick={() => handleSelect(w)}
//                 className="w-full text-left px-4 py-2 hover:bg-gray-100"
//               >
//                 <div className="font-medium">{w.WarehouseCode}</div>
//                 <div className="text-muted-foreground">{w.WarehouseName}</div>
//               </button>
//             ))}
//             {hasMore && (
//               <div className="text-center py-4">
//                 <Button
//                   variant="ghost"
//                   disabled={loading}
//                   onClick={handleLoadMore}
//                 >
//                   {loading ? "Loading..." : "Load More"}
//                 </Button>
//               </div>
//             )}
//           </div>
//         </ScrollArea>

//         <div className="flex justify-end mt-4">
//           <Button variant="outline" onClick={handleClose}>
//             Cancel
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
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
import { Warehouse } from "@/types/warehouse.type";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (warehouse: Warehouse) => void;
}

export function WarehouseSelectorDialog({ open, onClose, onSelect }: Props) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const top = 5; // You can increase this for more pagination

  // 🧱 Dummy Warehouse Data
  const dummyWarehouses: Warehouse[] = [
    { WarehouseCode: "WH001", WarehouseName: "Main Warehouse" },
    { WarehouseCode: "WH002", WarehouseName: "Raw Material Store" },
    { WarehouseCode: "WH003", WarehouseName: "Finished Goods Store" },
    { WarehouseCode: "WH004", WarehouseName: "Chemical Store" },
    { WarehouseCode: "WH005", WarehouseName: "Spare Parts Warehouse" },
    { WarehouseCode: "WH006", WarehouseName: "Packaging Section" },
    { WarehouseCode: "WH007", WarehouseName: "Outlet Store Karachi" },
    { WarehouseCode: "WH008", WarehouseName: "Outlet Store Lahore" },
    { WarehouseCode: "WH009", WarehouseName: "Cold Storage" },
    { WarehouseCode: "WH010", WarehouseName: "Testing Lab Stock" },
  ];

  const fetchWarehouses = (search: string, page: number, append = true) => {
    setLoading(true);
    const skip = (page - 1) * top;

    // Local filtering logic
    const filtered = dummyWarehouses.filter(
      (w) =>
        w.WarehouseCode.toLowerCase().includes(search.toLowerCase()) ||
        w.WarehouseName.toLowerCase().includes(search.toLowerCase())
    );

    const paged = filtered.slice(skip, skip + top);

    setWarehouses((prev) => (append ? [...prev, ...paged] : [...paged]));
    setHasMore(skip + top < filtered.length);
    setLoading(false);
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setWarehouses([]);
    setPage(1);
    fetchWarehouses(value, 1, false);
  }, 400);

  useEffect(() => {
    if (open) {
      setWarehouses([]);
      setPage(1);
      fetchWarehouses("", 1, false);
    }
  }, [open]);

  useEffect(() => {
    if (page > 1) fetchWarehouses(search, page);
  }, [page]);

  const handleLoadMore = () => {
    if (hasMore && !loading) setPage((prev) => prev + 1);
  };

  const handleSelect = (warehouse: Warehouse) => {
    onSelect(warehouse);
    handleClose();
  };

  const handleClose = () => {
    setSearch("");
    setWarehouses([]);
    setPage(1);
    onClose();
  };

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
            onChange={(e) => {
              setSearch(e.target.value);
              debouncedSearch(e.target.value);
            }}
          />
          <Button variant="outline" onClick={() => fetchWarehouses(search, 1, false)}>
            Refresh
          </Button>
        </div>

        <ScrollArea className="h-72 border rounded">
          <div className="divide-y text-sm">
            {warehouses.map((w: Warehouse) => (
              <button
                key={w.WarehouseCode}
                onClick={() => handleSelect(w)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                <div className="font-medium">{w.WarehouseCode}</div>
                <div className="text-muted-foreground">{w.WarehouseName}</div>
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
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

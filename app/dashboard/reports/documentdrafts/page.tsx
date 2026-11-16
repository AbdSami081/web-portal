
// "use client";

// import * as React from "react";
// import { ArrowRight, Search, X } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// import { useRouter } from "next/navigation";
// import { getAllDrafts, DraftRow, draftRoutes } from "@/api+/sap/draft/draftService";

// /* ----------------------------- Helpers ----------------------------- */

// const PAGE_SIZE = 20;

// const money = (n: number, currency = "AUD") =>
//   `${currency} ${n.toLocaleString("en-US", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// const columns = [
//   { key: "document", label: "Document", w: "min-w-[190px]" },
//   { key: "documentNo", label: "Document No.", w: "min-w-[130px]" },
//   { key: "postingDate", label: "Posting Date", w: "min-w-[120px]" },
//   { key: "bpCode", label: "BP Code", w: "min-w-[130px]" },
//   { key: "total", label: "Total", w: "min-w-[150px] text-right" },
//   { key: "remarks", label: "Remarks", w: "min-w-[220px]" },
//   { key: "fbrInvoiceNumber", label: "FBR Invoice Number", w: "min-w-[170px]" },
//   { key: "projectManager", label: "Project Manager", w: "min-w-[150px]" },
//   { key: "projectDirector", label: "Project Director", w: "min-w-[150px]" },
//   { key: "projectManagerName", label: "Project Manager Name", w: "min-w-[190px]" },
//   { key: "projectDirectorName", label: "Project Director Name", w: "min-w-[190px]" },
//   { key: "ntnRegistered", label: "NTN Registered", w: "min-w-[140px]" },
//   { key: "fbrScenarioId", label: "FBR Scenario ID", w: "min-w-[150px]" },
//   { key: "refresher", label: "Refresher", w: "min-w-[110px]" },
// ] as const;

// /* ----------------------------- Page ----------------------------- */

// type Props = {
//   onOpenDraft?: (row: DraftRow) => void;
//   onOk?: (selected: DraftRow) => void;
//   onCancel?: () => void;
// };

// export default function DocumentDraftsPage({ onOpenDraft, onOk, onCancel }: Props) {
//   const [rows, setRows] = React.useState<DraftRow[]>([]);
//   const [loading, setLoading] = React.useState(true);
//   const [loadingMore, setLoadingMore] = React.useState(false);
//   const [hasMore, setHasMore] = React.useState(false);
//   const [error, setError] = React.useState("");

//   const loadDrafts = async (skip: number) => {
//     try {
//       const data = await getAllDrafts(skip, PAGE_SIZE);
//       setRows((prev) => (skip === 0 ? data : [...prev, ...data]));
//       setHasMore(data.length === PAGE_SIZE);
//     } catch {
//       setError("Drafts load failed. Please try again later.");
//     }
//   };

//   React.useEffect(() => {
//     loadDrafts(0).finally(() => setLoading(false));
//   }, []);

//   const handleLoadMore = async () => {
//     setLoadingMore(true);
//     await loadDrafts(rows.length);
//     setLoadingMore(false);
//   };

//   const [query, setQuery] = React.useState("");
//   const [selectedId, setSelectedId] = React.useState<DraftRow["id"] | null>(null);

//   const filtered = React.useMemo(() => {
//     const q = query.trim().toLowerCase();
//     if (!q) return rows;
//     return rows.filter((r) =>
//       [r.document, String(r.documentNo), r.bpCode, r.remarks]
//         .filter(Boolean)
//         .some((v) => String(v).toLowerCase().includes(q))
//     );
//   }, [rows, query]);

//   const selected = rows.find((r) => r.id === selectedId) ?? null;

//   return (
//     <div className="flex h-screen flex-col bg-background">
//       {/* Page header */}
//       <header className="flex items-center justify-between border-b bg-muted/60 px-6 py-4">
//         <div className="flex items-center gap-3">
//           <h1 className="text-2xl font-bold tracking-tight">Document Drafts</h1>
//           <Badge
//             variant="outline"
//             className="border-amber-300 bg-amber-50 text-[10px] font-semibold text-amber-600"
//           >
//             {filtered.length} DRAFTS
//           </Badge>
//         </div>

//         <div className="relative w-72">
//           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//           <Input
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder="Search drafts..."
//             className="rounded-lg bg-background pl-9 pr-8"
//           />
//           {query && (
//             <button
//               type="button"
//               onClick={() => setQuery("")}
//               className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//               aria-label="Clear search"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           )}
//         </div>
//       </header>

//       {/* Table card */}
//       <main className="flex min-h-0 flex-1 flex-col gap-3 p-6">
//        <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background">
//           <Table className="w-max min-w-full border-separate border-spacing-0 text-sm">
//             <TableHeader className="sticky top-0 z-10">
//               <TableRow className="hover:bg-transparent">
//                 <TableHead className="w-12 bg-neutral-900 text-center text-xs font-semibold text-white">
//                   #
//                 </TableHead>
//                 {columns.map((c) => (
//                   <TableHead
//                     key={c.key}
//                     className={`bg-neutral-900 text-xs font-semibold text-white ${c.w}`}
//                   >
//                     {c.label}
//                   </TableHead>
//                 ))}
//               </TableRow>
//             </TableHeader>

//             <TableBody>
//               {(loading || error || filtered.length === 0) && (
//                 <TableRow>
//                   <TableCell
//                     colSpan={columns.length + 1}
//                     className="h-32 text-center text-muted-foreground"
//                   >
//                     {loading ? "Loading drafts..." : error || "No drafts found."}
//                   </TableCell>
//                 </TableRow>
//               )}

//               {filtered.map((r) => {
//                 const isSelected = r.id === selectedId;
//                 return (
//                   <TableRow
//                     key={r.id}
//                     onClick={() => setSelectedId(r.id)}
//                     onDoubleClick={() => onOpenDraft?.(r)}
//                     data-state={isSelected ? "selected" : undefined}
//                     className="cursor-pointer odd:bg-background even:bg-muted/40 hover:bg-emerald-50 data-[state=selected]:bg-emerald-100"
//                   >
//                     <TableCell className="py-1.5 text-center">
//                       <button
//                         type="button"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           onOpenDraft?.(r);
//                         }}
//                         aria-label={`Open ${r.document} ${r.documentNo}`}
//                         className="inline-flex h-7 w-7 items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-600 hover:text-white"
//                       >
//                         <ArrowRight className="h-4 w-4" />
//                       </button>
//                     </TableCell>
//                     <TableCell className="py-1.5 font-medium">{r.document}</TableCell>
//                     <TableCell className="py-1.5">{r.documentNo}</TableCell>
//                     <TableCell className="py-1.5">{r.postingDate}</TableCell>
//                     <TableCell className="py-1.5">{r.bpCode ?? ""}</TableCell>
//                     <TableCell className="py-1.5 text-right tabular-nums">
//                       {money(r.total, r.currency)}
//                     </TableCell>
//                     <TableCell className="py-1.5">{r.remarks ?? ""}</TableCell>
//                     <TableCell className="py-1.5">{r.fbrInvoiceNumber ?? ""}</TableCell>
//                     <TableCell className="py-1.5">{r.projectManager ?? ""}</TableCell>
//                     <TableCell className="py-1.5">{r.projectDirector ?? ""}</TableCell>
//                     <TableCell className="py-1.5">{r.projectManagerName ?? ""}</TableCell>
//                     <TableCell className="py-1.5">{r.projectDirectorName ?? ""}</TableCell>
//                     <TableCell className="py-1.5">{r.ntnRegistered ?? ""}</TableCell>
//                     <TableCell className="py-1.5">{r.fbrScenarioId ?? ""}</TableCell>
//                     <TableCell className="py-1.5">{r.refresher ?? "No"}</TableCell>
//                   </TableRow>
//                 );
//               })}
//             </TableBody>
//                   </Table>
//         </div>

//         {/* Load more */}
//         {hasMore && !loading && (
//           <div className="flex items-center justify-center">
//             <Button
//               variant="outline"
//               onClick={handleLoadMore}
//               disabled={loadingMore}
//               className="px-8"
//             >
//               {loadingMore ? "Loading..." : "Load more"}
//             </Button>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }



"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getAllDrafts, DraftRow, draftRoutes } from "@/api+/sap/draft/draftService";

/* ----------------------------- Helpers ----------------------------- */

const PAGE_SIZE = 20;

const money = (n: number, currency = "AUD") =>
  `${currency} ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const columns = [
  { key: "document", label: "Document", w: "min-w-[190px]" },
  { key: "documentNo", label: "Document No.", w: "min-w-[130px]" },
  { key: "postingDate", label: "Posting Date", w: "min-w-[120px]" },
  { key: "bpCode", label: "BP Code", w: "min-w-[130px]" },
  { key: "total", label: "Total", w: "min-w-[150px] text-right" },
  { key: "remarks", label: "Remarks", w: "min-w-[220px]" },
  { key: "fbrInvoiceNumber", label: "FBR Invoice Number", w: "min-w-[170px]" },
  { key: "projectManager", label: "Project Manager", w: "min-w-[150px]" },
  { key: "projectDirector", label: "Project Director", w: "min-w-[150px]" },
  { key: "projectManagerName", label: "Project Manager Name", w: "min-w-[190px]" },
  { key: "projectDirectorName", label: "Project Director Name", w: "min-w-[190px]" },
  { key: "ntnRegistered", label: "NTN Registered", w: "min-w-[140px]" },
  { key: "fbrScenarioId", label: "FBR Scenario ID", w: "min-w-[150px]" },
  { key: "refresher", label: "Refresher", w: "min-w-[110px]" },
] as const;

/* ----------------------------- Page ----------------------------- */

export default function DocumentDraftsPage() {
  const router = useRouter();

  const [rows, setRows] = React.useState<DraftRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [error, setError] = React.useState("");

  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<DraftRow["id"] | null>(null);

  // Arrow / double click -> open the draft on its own document screen
const handleOpen = (r: DraftRow) => {
  console.log("row:", r);
  console.log("objectCode:", r.objectCode);
  console.log("route:", draftRoutes[r.objectCode]);

  const route = draftRoutes[r.objectCode];
  if (!route) {
    alert(`Route Not Found. objectCode = ${r.objectCode}`);
    return;
  }
  router.push(`${route}?draftId=${r.id}`);
};

  const loadDrafts = async (skip: number) => {
    try {
      const data = await getAllDrafts(skip, PAGE_SIZE);
      setRows((prev) => (skip === 0 ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError("Drafts load failed. Please try again later.");
    }
  };

  React.useEffect(() => {
    loadDrafts(0).finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadDrafts(rows.length);
    setLoadingMore(false);
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.document, String(r.documentNo), r.bpCode, r.remarks]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, query]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Page header */}
      <header className="flex items-center justify-between border-b bg-muted/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Document Drafts</h1>
          <Badge
            variant="outline"
            className="border-amber-300 bg-amber-50 text-[10px] font-semibold text-amber-600"
          >
            {filtered.length} DRAFTS
          </Badge>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drafts..."
            className="rounded-lg bg-background pl-9 pr-8"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Table card */}
      <main className="flex min-h-0 flex-1 flex-col gap-3 p-6">
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background">
          <Table className="w-max min-w-full border-separate border-spacing-0 text-sm">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 bg-neutral-900 text-center text-xs font-semibold text-white">
                  #
                </TableHead>
                {columns.map((c) => (
                  <TableHead
                    key={c.key}
                    className={`bg-neutral-900 text-xs font-semibold text-white ${c.w}`}
                  >
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {(loading || error || filtered.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {loading ? "Loading drafts..." : error || "No drafts found."}
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((r) => {
                const isSelected = r.id === selectedId;
                return (
                  <TableRow
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    onDoubleClick={() => handleOpen(r)}
                    data-state={isSelected ? "selected" : undefined}
                    className="cursor-pointer odd:bg-background even:bg-muted/40 hover:bg-emerald-50 data-[state=selected]:bg-emerald-100"
                  >
                    <TableCell className="py-1.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpen(r);
                        }}
                        aria-label={`Open ${r.document} ${r.documentNo}`}
                       className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#0D0D0D] transition-colors hover:bg-[#0D0D0D] hover:text-white"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </TableCell>
                    <TableCell className="py-1.5 font-medium">{r.document}</TableCell>
                    <TableCell className="py-1.5">{r.documentNo}</TableCell>
                    <TableCell className="py-1.5">{r.postingDate}</TableCell>
                    <TableCell className="py-1.5">{r.bpCode ?? ""}</TableCell>
                    <TableCell className="py-1.5 text-right tabular-nums">
                      {money(r.total, r.currency)}
                    </TableCell>
                    <TableCell className="py-1.5">{r.remarks ?? ""}</TableCell>
                    <TableCell className="py-1.5">{r.fbrInvoiceNumber ?? ""}</TableCell>
                    <TableCell className="py-1.5">{r.projectManager ?? ""}</TableCell>
                    <TableCell className="py-1.5">{r.projectDirector ?? ""}</TableCell>
                    <TableCell className="py-1.5">{r.projectManagerName ?? ""}</TableCell>
                    <TableCell className="py-1.5">{r.projectDirectorName ?? ""}</TableCell>
                    <TableCell className="py-1.5">{r.ntnRegistered ?? ""}</TableCell>
                    <TableCell className="py-1.5">{r.fbrScenarioId ?? ""}</TableCell>
                    <TableCell className="py-1.5">{r.refresher ?? "No"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

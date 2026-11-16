"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

import { getAllDrafts, DraftRow, getDraftNumericType } from "@/api+/sap/draft/draftService";
import { buildDocumentUrl, getDraftModuleUrl, getMenuInfoByObjectCode } from "@/lib/menu-lookup";

/* ----------------------------- Helpers ----------------------------- */

const PAGE_SIZE = 20;
const SKELETON_ROWS = 10;

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

const TOTAL_COLUMN_COUNT = columns.length + 2; // S# + Actions

export default function DocumentDraftsPage() {
  const router = useRouter();

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pagesCache, setPagesCache] = React.useState<Record<number, DraftRow[]>>({});
  const [pageHasMore, setPageHasMore] = React.useState<Record<number, boolean>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<DraftRow["id"] | null>(null);

  const fetchPage = React.useCallback(async (page: number) => {
    setLoading(true);
    setError("");
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const data = await getAllDrafts(skip, PAGE_SIZE);
      setPagesCache((prev) => ({ ...prev, [page]: data }));
      setPageHasMore((prev) => ({ ...prev, [page]: data.length === PAGE_SIZE }));
    } catch {
      setError("Drafts load failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const goToPage = (page: number) => {
    if (page < 1 || page === currentPage) return;
    setCurrentPage(page);
    setSelectedId(null);
    if (!pagesCache[page]) fetchPage(page);
  };

  const rows = pagesCache[currentPage] ?? [];
  const hasMoreAfterCurrent = pageHasMore[currentPage] ?? false;
  const pageNumbers = React.useMemo(() => {
    const highestKnownPage = Math.max(currentPage, ...Object.keys(pagesCache).map(Number));
    const last = hasMoreAfterCurrent ? highestKnownPage + 1 : highestKnownPage;
    return Array.from({ length: last }, (_, i) => i + 1);
  }, [currentPage, pagesCache, hasMoreAfterCurrent]);

  const handleOpen = (r: DraftRow) => {
    const numericType = getDraftNumericType(r.objectCode);
    if (numericType === null) {
      toast.error(`"${r.document}" drafts aren't supported for opening yet.`);
      return;
    }

    const moduleUrl = getDraftModuleUrl(numericType) ?? getMenuInfoByObjectCode(numericType)?.url;
    if (!moduleUrl) {
      toast.error(`No screen is configured for "${r.document}" yet.`);
      return;
    }

    const url = buildDocumentUrl(moduleUrl, {
      objectType: String(numericType),
      draftEntry: String(r.id),
      isDraft: true,
    });
    router.push(url);
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
      <header className="flex items-center justify-between border-b px-6 py-3.5">
        <h1 className="text-base font-semibold text-foreground">Document Drafts</h1>

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
                  S#
                </TableHead>
                <TableHead className="w-16 bg-neutral-900 text-center text-xs font-semibold text-white">
                  Actions
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
              {loading &&
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="odd:bg-background even:bg-muted/40">
                    <TableCell className="py-2 text-center">
                      <Skeleton className="mx-auto h-4 w-4" />
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <Skeleton className="mx-auto h-6 w-6 rounded-full" />
                    </TableCell>
                    {columns.map((c) => (
                      <TableCell key={c.key} className="py-2">
                        <Skeleton className="h-4 w-full max-w-[140px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && (error || filtered.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={TOTAL_COLUMN_COUNT}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {error || "No drafts found."}
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                filtered.map((r, idx) => {
                  const isSelected = r.id === selectedId;
                  return (
                    <TableRow
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      onDoubleClick={() => handleOpen(r)}
                      data-state={isSelected ? "selected" : undefined}
                      className="cursor-pointer odd:bg-background even:bg-muted/40 hover:bg-emerald-50 data-[state=selected]:bg-emerald-100"
                    >
                      <TableCell className="py-1.5 text-center text-muted-foreground">
                        {(currentPage - 1) * PAGE_SIZE + idx + 1}
                      </TableCell>
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

        {/* Pagination */}
        {!loading && !error && pageNumbers.length > 1 && (
          <Pagination className="justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goToPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {pageNumbers.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goToPage(currentPage + 1);
                  }}
                  className={
                    currentPage === pageNumbers[pageNumbers.length - 1] && !hasMoreAfterCurrent
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </main>
    </div>
  );
}

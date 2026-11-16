"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FilePlus2, Keyboard, Loader2, Printer, GitFork, SearchCode, TextCursorInput, ArrowLeftToLine, ArrowLeft, ArrowRight, ArrowRightToLine } from "lucide-react";
import { toast } from "sonner";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { HeaderModalAction } from "../header-modal-action";
import { KeyboardShortcutsContent } from "../keyboard-shortcuts-content";
import { useAuth } from "@/context/authContext";
import { clearDocNavParams } from "@/lib/docNavParams";
import { getDocumentsList } from "@/api+/sap/common/documentService";
import LayoutPreviewModal from "@/modals/LayoutPreviewModal";
import FMSSetupModal from "@/modals/FMSSetupModal";
import { useRelationshipMapStore } from "@/stores/useRelationshipMapStore";
import { getMenuUrlsByObjectCode } from "@/lib/menu-lookup";
import { DocumentType } from "@/types/master/DocumentType";

interface Props {
  DocEntry: number;
  objectCode: number; // SAP UDO Object Code e.g. DocumentType enum value
  schemaName?: string;
  reset: (values: any) => void;
  defaultValues: any;
  resetStore: () => void;
  allowedActions?: string[];
  menuId?: string;
  resource?: string;
  buildDocumentPath?: (docNum: number) => string;
  currentDocumentKey?: string;
  onNavigateToDocument?: (document: Record<string, unknown>) => void;
}

// FMS Setup is not being shipped to clients yet (the feature + its backing
// @WP_FMS_CFG UDT aren't ready across deployments) - keep it fully hidden
// regardless of any per-user/per-document right, independent of canUse("FMS").
// Flip this back on (and lib/config/rightsConfig.ts's FMS entry to
// enabled: true) once it's actually ready to hand to clients.
const FMS_FEATURE_ENABLED = false;

const HeaderActions: React.FC<Props> = ({
  DocEntry,
  objectCode,
  schemaName,
  reset,
  defaultValues,
  resetStore,
  allowedActions,
  menuId,
  resource,
  buildDocumentPath,
  currentDocumentKey,
  onNavigateToDocument,
}) => {
  const canUse = (action: string) => (allowedActions ?? []).includes(action);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [layoutModalOpen, setLayoutModalOpen] = useState(false);
  const [fmsModalOpen, setFmsModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { isOpen: isRelMapOpen, openMap, closeMap } = useRelationshipMapStore();

  const activeSchema = schemaName || user?.companyDB || "";
  const isProduction =
    objectCode === 202 ||
    pathname?.toLowerCase().includes("/production");

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === "F2") {
        e.preventDefault();
        e.stopPropagation();
        if (FMS_FEATURE_ENABLED && canUse("FMS")) setFmsModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allowedActions]);

  const handleNewDocument = () => {
    clearDocNavParams();
    const validUrls = getMenuUrlsByObjectCode(objectCode);
    if (validUrls.length > 0 && pathname && !validUrls.includes(pathname)) {
      router.push(validUrls[0]);
      return;
    }

    if (typeof window !== "undefined" && window.location.search) {
     router.replace(pathname || window.location.pathname);
    }
    reset({
      ...defaultValues,
      DocNum: 0,
      DocEntry: 0,
    } as any);
    resetStore();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.code === "KeyA") {
        e.preventDefault();
        handleNewDocument();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleNewDocument]);

  const handlePrintClick = () => {
    if (!canUse("Print")) return;
    if (!DocEntry || DocEntry === 0) {
      toast.warning("Please open or save a document before printing.");
      return;
    }
    setLayoutModalOpen(true);
  };
  const resolveResource = () => {
    if (resource) return resource;

    const currentPath = pathname?.toLowerCase() ?? "";
    switch (objectCode) {
      case DocumentType.Quotation: return "Quotations";
      case DocumentType.Order: return "Orders";
      case DocumentType.Delivery: return "DeliveryNotes";
      case DocumentType.ARInvoice: return "Invoices";
      case DocumentType.SalesReturn: return "Returns";
      case DocumentType.SalesReturnRequest: return "ReturnRequest";
      case DocumentType.ARDownPaymentRequest:
        return currentPath.includes("/sales/") ? "DownPayments" : "PurchaseDownPayments";
      case DocumentType.ARDownPaymentInvoice: return "DownPayments";
      case DocumentType.ARCreditMemo: return "CreditNotes";
      case DocumentType.PurchaseRequests:
        return currentPath.includes("apdownpaymentrequest") ? "PurchaseDownPayments" : "PurchaseRequests";
      case DocumentType.PurchaseQuotation: return "PurchaseQuotations";
      case DocumentType.PurchaseOrder: return "PurchaseOrders";
      case DocumentType.GoodsReceiptPO: return "PurchaseDeliveryNotes";
      case DocumentType.APInvoice:
        return currentPath.includes("reserve-invoice") ? "ReservePurchaseInvoices" : "PurchaseInvoices";
      case DocumentType.APCreditMemo: return "PurchaseCreditNotes";
      case DocumentType.GoodsReturn: return "PurchaseReturns";
      case DocumentType.GoodsReturnRequest: return "GoodsReturnRequest";
      case DocumentType.InvTransfer: return "StockTransfers";
      case DocumentType.InvTransferReq: return "InventoryTransferRequests";
      case DocumentType.GoodIssue:
        return currentPath.includes("/production/") ? "InventoryGenExits" : "GoodIssues";
      case DocumentType.ReceiptFromProduction: return "InventoryGenEntries";
      case DocumentType.ProductionOrder: return "ProductionOrders";
      case DocumentType.BusinessPartner: return "BusinessPartners";
      default: return "";
    }
  };

  const handleNavigate = async (type: "first" | "previous" | "next" | "last") => {
    const resourceName = resolveResource();
    const isBusinessPartner = objectCode === DocumentType.BusinessPartner;
    const needsCurrentDocument = type === "previous" || type === "next";
    const hasCurrentDocument = isBusinessPartner ? Boolean(currentDocumentKey) : Boolean(DocEntry);
    if (!resourceName || (needsCurrentDocument && !hasCurrentDocument) || isNavigating) return;

    setIsNavigating(true);
    setActiveArrow(type);
    try {
      const pageSize = 20;
      const documents: {
        DocEntry?: number;
        DocNum?: number;
        CardCode?: string;
        [key: string]: unknown;
      }[] = [];
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const page = await getDocumentsList(resourceName, skip, pageSize) as {
          DocEntry?: number;
          DocNum?: number;
          CardCode?: string;
          [key: string]: unknown;
        }[];
        if (page.length === 0) break;
        documents.push(...page);
        skip += page.length;
        hasMore = page.length === pageSize;
      }

      const orderedDocuments = isBusinessPartner
        ? documents
            .filter((document) => Boolean(document.CardCode?.trim()))
            .sort((left, right) =>
              String(left.CardCode).localeCompare(String(right.CardCode), undefined, {
                numeric: true,
                sensitivity: "base",
              })
            )
        : documents
            .filter(
              (document) =>
                Number.isFinite(Number(document.DocEntry)) && Number(document.DocNum) > 0
            )
            .sort((left, right) => Number(left.DocEntry) - Number(right.DocEntry));

      let target: (typeof orderedDocuments)[number] | undefined;
      if (isBusinessPartner) {
        const currentIndex = orderedDocuments.findIndex(
          (document) => document.CardCode === currentDocumentKey
        );
        switch (type) {
          case "first":
            target = orderedDocuments[0];
            break;
          case "last":
            target = orderedDocuments[orderedDocuments.length - 1];
            break;
          case "previous":
            target = currentIndex > 0 ? orderedDocuments[currentIndex - 1] : undefined;
            break;
          case "next":
            target =
              currentIndex >= 0 ? orderedDocuments[currentIndex + 1] : undefined;
            break;
        }
      } else {
        switch (type) {
          case "first":
            target = orderedDocuments[0];
            break;
          case "last":
            target = orderedDocuments[orderedDocuments.length - 1];
            break;
          case "previous":
            target = orderedDocuments.filter(
              (document) => Number(document.DocEntry) < DocEntry
            ).pop();
            break;
          case "next":
            target = orderedDocuments.find(
              (document) => Number(document.DocEntry) > DocEntry
            );
            break;
        }
      }

      if (isBusinessPartner ? !target?.CardCode : !target?.DocNum) {
        toast.info("No document found in that direction.");
        setIsNavigating(false);
        setActiveArrow(null);
        return;
      }

      if (isBusinessPartner) {
        if (!onNavigateToDocument || !target) {
          toast.error("Business Partner navigation is unavailable on this page.");
          setIsNavigating(false);
          setActiveArrow(null);
          return;
        }
        onNavigateToDocument(target);
        setIsNavigating(false);
        setActiveArrow(null);
        return;
      }

      const navigation = {
        objectCode,
        docNum: String(target!.DocNum),
        handled: false,
        onComplete: () => {
          setIsNavigating(false);
          setActiveArrow(null);
        },
      };
      window.dispatchEvent(new CustomEvent("portal:document-navigation", { detail: navigation }));

      if (!navigation.handled) {
        if (buildDocumentPath) {
          router.push(buildDocumentPath(target!.DocNum!));
          setIsNavigating(false);
          setActiveArrow(null);
        } else {
          toast.error("In-page document navigation is unavailable on this page.");
          setIsNavigating(false);
          setActiveArrow(null);
        }
      }
    } catch (error) {
      console.error("Failed to navigate documents", error);
      toast.error("Failed to load documents for navigation.");
      setIsNavigating(false);
      setActiveArrow(null);
    }
  };

  const arrowButtons = [
  { id: "first", Icon: ArrowLeftToLine, label: "First Document" },
  { id: "previous", Icon: ArrowLeft, label: "Previous Document" },
  { id: "next", Icon: ArrowRight, label: "Next Document" },
  { id: "last", Icon: ArrowRightToLine, label: "Last Document" },
  ] as const;
  const [activeArrow, setActiveArrow] = useState<string | null>(null);
  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-1.5">

          {/* New Document */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleNewDocument}
                className="h-8 w-8 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all"
              >
                <FilePlus2 className="w-4 h-4 text-slate-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">New Document</TooltipContent>
          </Tooltip>

          {/* Print / Layout Selector */}
          {canUse("Print") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePrintClick}
                  disabled={!DocEntry || DocEntry === 0}
                  className="h-8 w-8 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-40"
                >
                  <Printer className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Print Layout</TooltipContent>
            </Tooltip>
          )}

          {/* Relationship Map */}
          {!isProduction && canUse("RelationshipMap") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (!canUse("RelationshipMap")) return;
                    if (isRelMapOpen) {
                      closeMap();
                    } else {
                      openMap(objectCode, DocEntry, undefined, menuId);
                    }
                  }}
                  disabled={!DocEntry || DocEntry === 0}
                  className={`h-8 w-8 transition-all disabled:opacity-40 ${
                    isRelMapOpen
                      ? "bg-sky-100 border-sky-400 text-sky-700 shadow-inner"
                      : "border-slate-200 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600"
                  }`}
                >
                  <GitFork className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isRelMapOpen ? "Back to Document" : "Relationship Map"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* FMS / User-Defined Values Setup */}
          {FMS_FEATURE_ENABLED && canUse("FMS") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (!FMS_FEATURE_ENABLED || !canUse("FMS")) return;
                    setFmsModalOpen(true);
                  }}
                  className="h-8 w-8 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  <SearchCode className="w-4 h-4 text-slate-600 hover:text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">FMS Setup (Alt+Shift+F2)</TooltipContent>
            </Tooltip>
          )}

          {/* Field name inspector toggle */}
          {canUse("FieldInspector") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (!canUse("FieldInspector")) return;
                    window.dispatchEvent(new CustomEvent("fms:toggle-inspector"));
                  }}
                  className="h-8 w-8 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  <TextCursorInput className="w-4 h-4 text-slate-600 hover:text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Inspect field names (Alt+Shift+I)</TooltipContent>
            </Tooltip>
          )}

        </div>
      </TooltipProvider>

      {/* Keyboard Shortcuts */}
      <HeaderModalAction
        triggerIcon={Keyboard}
        triggerTooltip="Shortcut Keys"
        modalTitle="Keyboard Shortcuts"
        modalDescription="Quick reference for available keyboard shortcuts in the portal."
      >
        <KeyboardShortcutsContent />
      </HeaderModalAction>

      {/* Layout Preview Modal */}
      <LayoutPreviewModal
        open={layoutModalOpen}
        onClose={() => setLayoutModalOpen(false)}
        objectCode={objectCode}
        docEntry={DocEntry}
        schemaName={activeSchema}
      />

      {/* FMS Setup Modal */}
      <FMSSetupModal
        open={fmsModalOpen}
        onClose={() => setFmsModalOpen(false)}
        docType={objectCode}
      />
     <div className="flex items-center gap-1.5">
  {arrowButtons.map(({ id, Icon, label }) => (
    <Tooltip key={id}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => void handleNavigate(id)}
          aria-label={label}
          aria-pressed={activeArrow === id}
          disabled={
            !resolveResource() ||
            isNavigating ||
            ((id === "previous" || id === "next") &&
              !(objectCode === DocumentType.BusinessPartner
                ? currentDocumentKey
                : DocEntry))
          }
          className={`h-8 w-8 transition-all ${
            activeArrow === id
              ? "bg-[#EFF6FF] border-blue-300 text-blue-500 shadow-sm"
              : "bg-white border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
          }`}
        >
          {isNavigating && activeArrow === id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  ))}
</div>
    </>
  );
};

export default HeaderActions;
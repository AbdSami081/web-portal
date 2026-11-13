import { useEffect, useState } from "react";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLabel } from "@/components/Custom/AppLabel";
import { ItemSelectorDialog } from "../../../modals/ItemSelectorDialog";
import { BusinessPartnerSelectorDialog } from "@/modals/BusinessPartnerSelectorDialog";
import { DocumentLineRow } from "./DocumentItemRow";
import { useFormContext } from "react-hook-form";
import { Item } from "@/types/sales/Item.type";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { getCustomerPrice } from "@/lib/sap/helpers/masterDataHelper";
import { DocumentType } from "@/types/master/DocumentType";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSalesDocConfig } from "./SalesDocumentLayout";
import { Plus, FileText, Search, MoreHorizontal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { FieldCatalogEntry } from "@/types/fieldCatalog.type";
import { fetchItemsByCodesBulk } from "@/lib/sap/helpers/itemCacheHelper";
import { MAX_EXCEL_PASTE_ROWS } from "@/lib/constants/excelPaste";
import { BulkResultModal, type BulkResultRow } from "@/components/shared/BulkResultModal";
import { AttachmentsTab } from "@/components/shared/AttachmentsTab";
import { ReferenceInformationDialog } from "@/components/sales/shared/ReferenceInformationDialog";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { useUoMStore } from "@/stores/useUoMStore";
import { getUoMName } from "@/lib/sap/helpers/uomHelper";
import { SerialNumberSelectionDialog } from "@/modals/SerialNumberSelectionDialog";
import { BatchNumberSelectionDialog } from "@/modals/BatchNumberSelectionDialog";
import { ResizableTable } from "@/components/Custom/ResizableTable";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";
import { resolveUoMFromCandidates } from "@/utils/inventoryUom";
import { isPostedSalesDocType } from "@/lib/sap/helpers/postedDocumentHelper";
import { hasInvalidPrice } from "@/lib/sap/helpers/priceValidationHelper";
import { resolveBranchForWarehouse } from "@/lib/sap/helpers/branchHelper";
import { useLineUDFs, lineUdfColumns } from "@/components/shared/LineUDFCells";
import { useApprovalSettings } from "@/hooks/useApprovalSettings";
import { getShippingTypes, type ShippingType } from "@/api+/sap/BusinessPartner/BPService";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export const SALES_LINE_FIELDS: FieldCatalogEntry[] = [
  { key: "ItemCode", title: "Item Code" },
  { key: "ItemName", title: "Item Description" },
  { key: "Quantity", title: "Qty" },
  { key: "OnHand", title: "Qty In Whs" },
  { key: "Price", title: "Price" },
  { key: "DiscountPercent", title: "Disc %" },
  { key: "TaxCode", title: "Tax Code" },
  { key: "TaxAmount", title: "Tax Amount (LC)" },
  { key: "WarehouseCode", title: "Whs" },
  { key: "BPLid", title: "Branch" },
  { key: "UoMCode", title: "UoM Code" },
  { key: "UoMName", title: "UoM Name" },
  { key: "LineTotal", title: "Line Total" },
  { key: "Freight1Type", title: "Freight 1 Type" },
  { key: "Freight1LCAmount", title: "Freight 1 (LC)" },
  { key: "Freight2Type", title: "Freight 2 Type" },
  { key: "Freight2LCAmount", title: "Freight 2 (LC)" },
  { key: "Freight3Type", title: "Freight 3 Type" },
  { key: "Freight3LCAmount", title: "Freight 3 (LC)" },
];

export const SALES_SERVICE_LINE_FIELDS: FieldCatalogEntry[] = [
  { key: "AccountCode", title: "G/L Account" },
  { key: "AccountName", title: "G/L Account Name" },
  { key: "Description", title: "Description" },
  { key: "DiscountPercent", title: "Disc %" },
  { key: "TaxCode", title: "Tax Code" },
  { key: "LineTotal", title: "Line Total" },
  { key: "TaxAmount", title: "Tax Amount (LC)" },
  { key: "Freight1Type", title: "Freight 1 Type" },
  { key: "Freight1LCAmount", title: "Freight 1 (LC)" },
  { key: "Freight2Type", title: "Freight 2 Type" },
  { key: "Freight2LCAmount", title: "Freight 2 (LC)" },
  { key: "Freight3Type", title: "Freight 3 Type" },
  { key: "Freight3LCAmount", title: "Freight 3 (LC)" },
];

const addressComponentFields = [
  "Street / PO Box",
  "Street No.",
  "Block",
  "City",
  "Zip Code",
  "County",
  "State",
  "Country/Region",
  "Building/Floor/Room",
  "Address Name 2",
  "Address Name 3",
  "GLN",
];

const addressExtensionFieldMap: Record<string, string> = {
  "Street / PO Box": "Street",
  "Street No.": "StreetNo",
  Block: "Block",
  City: "City",
  "Zip Code": "ZipCode",
  County: "County",
  State: "State",
  "Country/Region": "Country",
  "Building/Floor/Room": "BuildingFloorRoom",
  "Address Name 2": "Address2",
  "Address Name 3": "Address3",
  GLN: "GLN",
};

const toSapAddressExtension = (draft: Record<string, string>, prefix: "ShipTo" | "BillTo") =>
  Object.fromEntries(
    addressComponentFields.map((field) => [
      `${prefix}${addressExtensionFieldMap[field]}`,
      draft[field] ?? "",
    ]),
  );

export function DocumentItems() {
  const { watch, setValue, register } = useFormContext();

  const selectedCardCode = watch("CardCode");
  const docStatus = watch("DocStatus");

  const {
    lines,
    addLine,
    addLines,
    clearLines,
    customer,

    attachments,
    addAttachment,
    removeAttachment,
    updateAttachment,
  } = useSalesDocument();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("content");

  const [fatherCardModalOpen, setFatherCardModalOpen] = useState(false);
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const [shipToDialogOpen, setShipToDialogOpen] = useState(false);
  const [shipToAddress, setShipToAddress] = useState("");
  const [shipToAddressDraft, setShipToAddressDraft] = useState<Record<string, string>>({});
  const [billToDialogOpen, setBillToDialogOpen] = useState(false);
  const [billToAddress, setBillToAddress] = useState("");
  const [billToAddressDraft, setBillToAddressDraft] = useState<Record<string, string>>({});
  const documentMode = useSalesDocument(
  (state) => state.documentMode
);

const setDocumentMode = useSalesDocument(
  (state) => state.setDocumentMode
);
  const [serviceLines, setServiceLines] = useState<any[]>([]);
  const [shippingTypes, setShippingTypes] = useState<ShippingType[]>([]);
  const config = useSalesDocConfig();

  const isARInvoice = config.type === DocumentType.ARInvoice;
  const hasLogisticsTab = !isARInvoice;
  const hasAccountingTab = true;

  const isTableDisabled = config.isDisabledTable(docStatus);

  const { freightsWithCharges, warehouses, loadDocumentEssentials } =
    useMasterDataStore();

  const uoms = useUoMStore((state) => state.uoms);

  const firstWhs = warehouses.length > 0 ? warehouses[0].WarehouseCode : "";

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    line?: any;
  } | null>(null);

  const [selectedLineForModal, setSelectedLineForModal] = useState<any | null>(
    null,
  );

  const [serialModalOpen, setSerialModalOpen] = useState(false);

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [excelPasteResultOpen, setExcelPasteResultOpen] = useState(false);
  const [excelPasteResultRows, setExcelPasteResultRows] = useState<BulkResultRow[]>([]);

  useEffect(() => {
    loadDocumentEssentials("O");
  }, [loadDocumentEssentials]);

  useEffect(() => {
    getShippingTypes()
      .then(setShippingTypes)
      .catch((error) => {
        console.error("Failed to load shipping types:", error);
        toast.error("Failed to load Shipping Types");
      });
  }, []);

 const handleOnSelectItems = (items: Item[]) => {
  if (documentMode === "service") {
    items.forEach((service: any) => {
      const accountCode =
        service.Code ||
        service.VisCode ||
        service.AccountCode ||
        service.ItemCode ||
        "";

      const accountName =
        service.Name ||
        service.AccountName ||
        service.ItemName ||
        "";

      const description =
        service.Description ||
        service.ItemDescription ||
        service.Name ||
        service.ItemName ||
        "";

      const price = Number(
        service.Price ||
        service.UnitPrice ||
        service.Amount ||
        0
      );

      const targetTaxCode =
        service.VatGroupSa ||
        service.VatGourpSa ||
        service.TaxCode ||
        "";

      const selectedTax = freightsWithCharges.find(
        (t) => t.Code === targetTaxCode
      );

      const taxRate = Number(
        service.TaxRate ||
        selectedTax?.Rate ||
        0
      );

      addLine({
  ItemCode: accountCode,
  AccountCode: accountCode,
  AccountName: accountName,
  Description: description,

  Quantity: 0,
  OnHand: 0,

  Price: 0,
  DiscountPercent: Number(
    service.DiscountPercent ||
    service.Discount ||
    0
  ),

  TaxCode: targetTaxCode,
  TaxRate: taxRate,
  TaxAmount: 0,
  LineTotal: 0,

  Freight1Type: "",
  Freight1LCAmount: 0,
  Freight1TaxGroup: "",

  Freight2Type: "",
  Freight2LCAmount: 0,
  Freight2TaxGroup: "",

  Freight3Type: "",
  Freight3LCAmount: 0,
  Freight3TaxGroup: "",
});
    });

    setDialogOpen(false);
    return;
  }

  items.forEach((item: Item) => {
    const price = getCustomerPrice(item.Prices || []);

    const targetTaxCode =
      item.VatGourpSa ||
      item.VatGroupSa ||
      "";

    const selectedTax = freightsWithCharges.find(
      (t) => t.Code === targetTaxCode
    );

    const taxRate = Number(selectedTax?.Rate || 0);

    const defaultWhsLine =
      item.DefaultWhse || firstWhs;

    const qtyInWhs = item.QtyInWhs || [];

    const whRecord = qtyInWhs.find(
      (w: any) =>
        (w.WarehouseCode || w.warehouseCode) ===
        defaultWhsLine
    );

    const initialOnHand = whRecord
      ? whRecord.Qty ?? whRecord.qty ?? 0
      : 0;

   const uomVal = resolveUoMFromCandidates(uoms, item.UoM, item.InventoryUOM, item.UoMCode, item.UoMGroupEntry, item.UnitsOfMeasurment) || item.UoM || "";

    addLine({
      ItemCode: item.ItemCode,
      ItemName:
        item.ItemName ||
        item.ItemDescription ||
        "",

      Quantity: 1,
      OnHand: initialOnHand,
      Price: price,

      TaxCode: targetTaxCode,
      TaxRate: taxRate,

      WarehouseCode: defaultWhsLine,

      BPLid: resolveBranchForWarehouse(
        defaultWhsLine,
        warehouses
      ),

      UoMCode: uomVal,

      MeasureUnit:
        item.MeasureUnit ||
        getUoMName(uomVal) ||
        "",

      ManSerNum: item.ManSerNum,
      ManBtchNum: item.ManBtchNum,
      QtyInWhs: qtyInWhs,
    });
  });

  setDialogOpen(false);
};

 
  const handleExcelPaste = async (e: React.ClipboardEvent) => {
    if (documentMode === "service") return;
    if (!customer?.CardCode) {
      e.preventDefault();
      toast.error("Please select a customer first.");
      return;
    }

    const text = e.clipboardData.getData("text");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) return;

    e.preventDefault();

    let rawRows = text.trim().split(/\r?\n/).map((row) => row.split("\t"));
    if (rawRows.length > MAX_EXCEL_PASTE_ROWS) {
      toast.error(
        `Pasted ${rawRows.length} rows — only the first ${MAX_EXCEL_PASTE_ROWS} were processed. Paste the rest separately.`
      );
      rawRows = rawRows.slice(0, MAX_EXCEL_PASTE_ROWS);
    }

    const parsedRows = rawRows
      .map((cols) => ({
        itemCode: cols[0]?.trim() || "",
        quantity: Number(cols[1]?.trim()) || 1,
        pastedPrice: Number(cols[2]?.trim()) || 0,
        discountPercent: Number(cols[3]?.trim()) || 0,
        pastedWarehouse: cols[4]?.trim() || "",
      }))
      .filter((r) => r.itemCode);

    if (parsedRows.length === 0) return;

   
    const toastId = toast.loading(`Looking up ${parsedRows.length} item(s)...`);
    const itemsByCode = await fetchItemsByCodesBulk(
      parsedRows.map((r) => r.itemCode),
      (done, total) => toast.loading(`Looking up items... ${done}/${total}`, { id: toastId })
    );

    const newLines: typeof lines = [];
    const resultRows: BulkResultRow[] = [];

    for (const row of parsedRows) {
      const item = itemsByCode.get(row.itemCode);
      if (!item) {
        resultRows.push({ label: row.itemCode, status: "error", detail: "Item not found" });
        continue;
      }

      const price = row.pastedPrice || getCustomerPrice(item.Prices || []);
      const targetTaxCode = item.VatGourpSa || item.VatGroupSa || "";
      const selectedTax = freightsWithCharges.find((t) => t.Code === targetTaxCode);
      const taxRate = Number(selectedTax?.Rate || 0);
      const defaultWhsLine = row.pastedWarehouse || item.DefaultWhse || firstWhs;
      const qtyInWhs = item.QtyInWhs || [];
      const whRecord = qtyInWhs.find(
        (w: any) => (w.WarehouseCode || w.warehouseCode) === defaultWhsLine
      );
      const initialOnHand = whRecord ? (whRecord.Qty ?? whRecord.qty ?? 0) : 0;
      const uomVal = resolveUoMFromCandidates(uoms, item.UoM, item.InventoryUOM, item.UoMCode, item.UoMGroupEntry, item.UnitsOfMeasurment) || item.UoM || "";

      newLines.push({
        ItemCode: item.ItemCode,
        ItemName: item.ItemName || item.ItemDescription || "",
        Quantity: row.quantity,
        OnHand: initialOnHand,
        Price: price,
        DiscountPercent: row.discountPercent,
        TaxCode: targetTaxCode,
        TaxRate: taxRate,
        WarehouseCode: defaultWhsLine,
        BPLid: resolveBranchForWarehouse(defaultWhsLine, warehouses),
        UoMCode: uomVal,
        MeasureUnit: item.MeasureUnit || getUoMName(uomVal) || "",
        ManSerNum: item.ManSerNum,
        ManBtchNum: item.ManBtchNum,
        QtyInWhs: qtyInWhs,
      } as (typeof lines)[number]);
      resultRows.push({ label: `${item.ItemCode} — qty ${row.quantity}`, status: "success", detail: "Added" });
    }

    if (newLines.length > 0) {
      addLines(newLines);
    }

    toast.dismiss(toastId);
    setExcelPasteResultRows(resultRows);
    setExcelPasteResultOpen(true);
  };

  const handleRowContextMenu = (e: React.MouseEvent, line: any) => {
    e.preventDefault();

    const isSerialBatchDocument = [
      DocumentType.Delivery,
      DocumentType.ARInvoice,
      DocumentType.SalesReturn,
      DocumentType.Return,
      DocumentType.CreditMemo,
      DocumentType.ARCreditMemo,
    ].includes(config.type);

    if (!isSerialBatchDocument) return;

    const isSerial =
      String(line.ManSerNum).toLowerCase() === "y" ||
      String(line.ManSerNum).toLowerCase() === "tyes";

    const isBatch =
      String(line.ManBtchNum).toLowerCase() === "y" ||
      String(line.ManBtchNum).toLowerCase() === "tyes";

    const isSerialBatchItem = isSerial || isBatch;

    if (!isSerialBatchItem) return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      line,
    });
  };
  

  const fieldAccess = useSalesDocument((state) => state.fieldAccess);
  const { multiBranchEnabled } = useApprovalSettings();
  const columns = [
    {
      key: "actions",
      title: "Actions",
      width: 80,
    },

    {
      key: "ItemCode",
      title: "Item Code",
      width: 180,
    },

    {
      key: "ItemName",
      title: "Item Description",
      width: 300,
    },

    {
      key: "Quantity",
      title: "Qty",
      width: 100,
    },
    {
      key: "OnHand",
      title: "Qty In Whs",
      width: 100,
    },
    {
      key: "Price",
      title: "Price",
      width: 120,
    },

    {
      key: "DiscountPercent",
      title: "Disc %",
      width: 120,
    },

    {
      key: "TaxCode",
      title: "Tax Code",
      width: 140,
    },

    {
      key: "TaxAmount",
      title: "Tax Amount (LC)",
      width: 180,
    },

    {
      key: "WarehouseCode",
      title: "Whs",
      width: 120,
    },

    {
      key: "BPLid",
      title: "Branch",
      width: 90,
    },

    {
      key: "UoMCode",
      title: "UoM Code",
      width: 120,
    },

    {
      key: "UoMName",
      title: "UoM Name",
      width: 150,
    },

    {
      key: "LineTotal",
      title: "Line Total",
      width: 180,
    },

    {
      key: "Freight1Type",
      title: "Freight 1 Type",
      width: 180,
    },

    {
      key: "Freight1LCAmount",
      title: "Freight 1 (LC)",
      width: 180,
    },

    {
      key: "Freight2Type",
      title: "Freight 2 Type",
      width: 180,
    },

    {
      key: "Freight2LCAmount",
      title: "Freight 2 (LC)",
      width: 180,
    },

    {
      key: "Freight3Type",
      title: "Freight 3 Type",
      width: 180,
    },

    {
      key: "Freight3LCAmount",
      title: "Freight 3 (LC)",
      width: 180,
    },
  ].filter((col) => {
    if (col.key === "actions") return true;
    if (col.key === "BPLid" && !multiBranchEnabled) return false;
    return fieldAccess.includes(col.key);
  });

  const serviceColumns = [
    {
      key: "actions",
      title: "Actions",
      width: 80,
    },
    {
      key: "AccountCode",
      title: "G/L Account",
      width: 200,
    },
    {
      key: "AccountName",
      title: "G/L Account Name",
      width: 200,
    },

    {
      key: "Description",
      title: "Description",
      width: 300,
    },
 {
      key: "DiscountPercent",
      title: "Disc %",
      width: 120,
    },

    {
      key: "TaxCode",
      title: "Tax Code",
      width: 140,
    },
     {
      key: "LineTotal",
      title: "Line Total",
      width: 180,
    },
    {
      key: "TaxAmount",
      title: "Tax Amount (LC)",
      width: 180,
    },

  {
      key: "Freight1Type",
      title: "Freight 1 Type",
      width: 180,
    },

    {
      key: "Freight1LCAmount",
      title: "Freight 1 (LC)",
      width: 180,
    },

    {
      key: "Freight2Type",
      title: "Freight 2 Type",
      width: 180,
    },

    {
      key: "Freight2LCAmount",
      title: "Freight 2 (LC)",
      width: 180,
    },

    {
      key: "Freight3Type",
      title: "Freight 3 Type",
      width: 180,
    },

    {
      key: "Freight3LCAmount",
      title: "Freight 3 (LC)",
      width: 180,
    }
  ].filter((col) => {
  if (col.key === "actions") return true;

  return (
    fieldAccess.includes(col.key) &&
    getFieldSettings(
      config.type,
      "linesFieds",
      col.key
    ).visible !== false
  );
});
  const lineUdfs = useLineUDFs(config.type);
  const columnsWithUdf = [...columns, ...lineUdfColumns(lineUdfs, fieldAccess)];
  const serviceColumnsWithUdf = [
    ...serviceColumns,
    ...lineUdfColumns(lineUdfs, fieldAccess),
  ];
  const isFinancialDoc = isPostedSalesDocType(config.type);

  const docEntry = watch("DocEntry");
  const isEditMode = Boolean(docEntry && Number(docEntry) > 0);
  const isLineUpdateBlocked = isFinancialDoc && isEditMode;


  const selectCls = "h-8 w-full max-w-[260px] text-xs";
  const inputCls = "h-8 w-full max-w-[260px] text-xs";
  const textareaCls = "w-full max-w-[260px] resize-none text-xs";
  const checkboxCls =
    "border-neutral-400 data-[state=checked]:border-black data-[state=checked]:bg-black data-[state=checked]:text-white";
  const dotsBtnCls = "h-8 w-8 shrink-0 bg-black text-white hover:bg-neutral-800";
  const rowCls = "grid grid-cols-[135px_1fr] items-center gap-2";
  const logisticsRowCls = "grid grid-cols-[105px_1fr] items-center gap-2";
  const labelCls = "text-xs";

  return (
    <div className="grid w-full relative pt-2 overflow-visible">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full pt-1 overflow-x-auto"
      >
        <div className="flex items-center gap-3 mb-4">
          <AppLabel className="text-sm font-semibold">Type</AppLabel>
          <Select
            value={documentMode || "items"}
            disabled={isEditMode}
            onValueChange={(value) => {
              const nextMode = value as "items" | "service";
              if (nextMode !== documentMode && lines.length > 0) clearLines();
              setDocumentMode(nextMode);
            }}
          >
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="items">Items</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TabsList
          className={`grid ${hasLogisticsTab ? "w-[480px] grid-cols-4" : isARInvoice ? "w-[360px] grid-cols-3" : "w-[240px] grid-cols-2"} mb-4 bg-neutral-900 p-1 rounded-lg h-9 border border-neutral-800`}
        >
          <TabsTrigger
            value="content"
            className="rounded-md font-bold text-[9px] uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400"
          >
            Content
          </TabsTrigger>

          {hasLogisticsTab && (
            <TabsTrigger
              value="logistics"
              className="rounded-md font-bold text-[9px] uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400"
            >
              Logistics
            </TabsTrigger>
          )}

          {hasAccountingTab && (
            <TabsTrigger
              value="accounting"
              className="rounded-md font-bold text-[9px] uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400"
            >
              Accounting
            </TabsTrigger>
          )}

          <TabsTrigger
            value="attachments"
            className="rounded-md font-bold text-[9px] uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400"
          >
            Attachments
            {attachments.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-blue-500 text-white rounded-full font-bold">
                {attachments.length}
              </span>
            )}
          </TabsTrigger>


        </TabsList>
        
<TabsContent
          value="content"
          className="mt-0 animate-in fade-in zoom-in-95 duration-500 pt-6 overflow-x-auto"
        >
          {documentMode !== "service" ? (
            <div className="relative overflow-visible">
              {!isLineUpdateBlocked && !isTableDisabled && (
                <div className="absolute -top-6 left-2 z-50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => {
                            if (!selectedCardCode) {
                              const field =
                                document.getElementById("card-code-field");

                              if (field) {
                                field.classList.add("animate-glow-red-blink");

                                setTimeout(() => {
                                  field.classList.remove(
                                    "animate-glow-red-blink",
                                  );
                                }, 3000);
                              }

                              return;
                            }

                            setDialogOpen(true);
                          }}
                          className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white"
                        >
                          <Plus className="h-5 w-5 stroke-[2.5px]" />
                        </Button>
                      </TooltipTrigger>

                      <TooltipContent
                        side="right"
                        className="bg-emerald-600 text-white border-emerald-500 font-semibold shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-in fade-in-0 zoom-in-95 duration-300"
                      >
                        Add Item
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              <div className="relative border rounded overflow-x-auto" onPaste={handleExcelPaste}>
                <div
                  className={`w-full overflow-x-auto pb-2 ${
                    isTableDisabled ? "opacity-80" : ""
                  }`}
                >
                  <ResizableTable
                    columns={columnsWithUdf}
                    data={lines}
                    emptyMessage="No items added yet."
                    onRowContextMenu={(e, line) =>
                      handleRowContextMenu(e, line)
                    }
                    renderRow={(line, idx) => (
                      <DocumentLineRow index={idx} line={line}   documentMode={documentMode}
/>
                    )}
                    rowClassName={(line) =>
                      hasInvalidPrice(line)
                        ? "bg-blue-50 hover:bg-blue-100"
                        : ""
                    }
                  />

                  {contextMenu && (
                    <div
                      className="fixed z-50 bg-white border border-neutral-200/80 shadow-lg rounded-lg w-72 p-1"
                      style={{
                        top: contextMenu.y,
                        left: contextMenu.x,
                      }}
                      onMouseLeave={() => setContextMenu(null)}
                    >
                      <button
                        className="cursor-pointer w-full text-left px-3 py-2 hover:bg-neutral-100 rounded text-sm font-semibold flex items-center gap-2 text-neutral-800"
                        onClick={() => {
                          const isBatch =
                            String(
                              contextMenu.line.ManBtchNum,
                            ).toLowerCase() === "y" ||
                            String(
                              contextMenu.line.ManBtchNum,
                            ).toLowerCase() === "tyes";

                          setSelectedLineForModal(contextMenu.line);

                          if (isBatch) {
                            setBatchModalOpen(true);
                          } else {
                            setSerialModalOpen(true);
                          }

                          setContextMenu(null);
                        }}
                      >
                        <FileText className="h-4 w-4" />

                        <span>
                          {String(contextMenu.line.ManBtchNum).toLowerCase() ===
                            "y" ||
                          String(contextMenu.line.ManBtchNum).toLowerCase() ===
                            "tyes"
                            ? "Batch Number Transactions Report"
                            : "Serial Number Transactions Report"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-visible">
              {!isLineUpdateBlocked && !isTableDisabled && (
                <div className="absolute -top-6 left-2 z-50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                        onClick={() => {
  if (!selectedCardCode) {
    const field = document.getElementById("card-code-field");

    if (field) {
      field.classList.add("animate-glow-red-blink");

      setTimeout(() => {
        field.classList.remove("animate-glow-red-blink");
      }, 3000);
    }

    return;
  }

  if (documentMode === "service") {
    addLine({
      ItemCode: "",
      AccountCode: "",
      AccountName: "",
      ItemName: "",
      Description: "",
      OnHand: 0,
      Quantity: 1,
      UnitPrice: 0,
      DiscountPercent: 0,
      TaxCode: "",
      TaxRate: 0,
      TaxTotal: 0,
      TaxAmount: 0,
      LineTotal: 0,
      PriceAfterVAT: 0,
      GrossTotal: 0,
      CostingCode: "",
      CostingCode2: "",
      CostingCode3: "",
      CostingCode4: "",
      CostingCode5: "",
      ProjectCode: "",
      TaxOnly: false,
      Price: 0,
    });

    return;
  }

  setDialogOpen(true);
}}
                          className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white"
                        >
                          <Plus className="h-5 w-5 stroke-[2.5px]" />
                        </Button>
                      </TooltipTrigger>

                      <TooltipContent
                        side="right"
                        className="bg-emerald-600 text-white border-emerald-500 font-semibold shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-in fade-in-0 zoom-in-95 duration-300"
                      >
                        Add Service
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              <div className="relative border rounded overflow-x-auto">
                <div
                  className={`w-full overflow-x-auto pb-2 ${
                    isTableDisabled ? "opacity-80" : ""
                  }`}
                >
                  <ResizableTable
                    columns={serviceColumnsWithUdf}
                    data={lines}
                    emptyMessage="No services added yet."
                    renderRow={(line, idx) => (
                      <DocumentLineRow index={idx} line={line}   documentMode={documentMode} />
                    )}
                  />

                  {contextMenu && (
                    <div
                      className="fixed z-50 bg-white border border-neutral-200/80 shadow-lg rounded-lg w-72 p-1"
                      style={{
                        top: contextMenu.y,
                        left: contextMenu.x,
                      }}
                      onMouseLeave={() => setContextMenu(null)}
                    >
                      <button
                        className="cursor-pointer w-full text-left px-3 py-2 hover:bg-neutral-100 rounded text-sm font-semibold flex items-center gap-2 text-neutral-800"
                        onClick={() => {
                          const isBatch =
                            String(
                              contextMenu.line.ManBtchNum,
                            ).toLowerCase() === "y" ||
                            String(
                              contextMenu.line.ManBtchNum,
                            ).toLowerCase() === "tyes";

                          setSelectedLineForModal(contextMenu.line);

                          if (isBatch) {
                            setBatchModalOpen(true);
                          } else {
                            setSerialModalOpen(true);
                          }

                          setContextMenu(null);
                        }}
                      >
                        <FileText className="h-4 w-4" />

                        <span>
                          {String(contextMenu.line.ManBtchNum).toLowerCase() ===
                            "y" ||
                          String(contextMenu.line.ManBtchNum).toLowerCase() ===
                            "tyes"
                            ? "Batch Number Transactions Report"
                            : "Serial Number Transactions Report"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {hasLogisticsTab && (
          <TabsContent
            value="logistics"
            className="mt-0 pt-2 animate-in fade-in duration-300"
          >
            <div className="min-h-[230px] rounded-md border border-neutral-300 bg-white p-3">
              <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
                {/* Left Section */}
                <div className="space-y-3">
                  {/* Ship To */}
                  <div className="grid grid-cols-[150px_250px_28px] items-end gap-2">
                    <div className="space-y-1">
                      <label className={labelCls}>Ship To</label>
                      <Select value={watch("ShipToCode") || ""} onValueChange={(value) => setValue("ShipToCode", value, { shouldDirty: true })}>
                        <SelectTrigger className="h-7 w-full text-xs">
                          <SelectValue placeholder="Select address" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      className="h-[42px] w-full resize-none text-xs"
                      aria-label="Ship To address"
                      value={watch("ShipToAddress") ?? shipToAddress}
                      onChange={(event) => {
                        setShipToAddress(event.target.value);
                        setValue("ShipToAddress", event.target.value, { shouldDirty: true });
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      aria-label="Open Ship To address details"
                      className="h-7 w-7 bg-neutral-900 px-1 text-white hover:bg-neutral-800"
                      onClick={() => {
                        const parts = (watch("ShipToAddress") ?? shipToAddress).split("\n");
                        setShipToAddressDraft(
                          Object.fromEntries(
                            addressComponentFields.map((field, index) => [field, parts[index] ?? ""]),
                          ),
                        );
                        setShipToDialogOpen(true);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Bill To */}
                  <div className="grid grid-cols-[150px_250px_28px] items-end gap-2">
                    <div className="space-y-1">
                      <label className={labelCls}>Bill To</label>
                      <Select value={watch("PayToCode") || ""} onValueChange={(value) => setValue("PayToCode", value, { shouldDirty: true })}>
                        <SelectTrigger className="h-7 w-full text-xs">
                          <SelectValue placeholder="Select address" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea className="h-[42px] w-full resize-none text-xs" aria-label="Bill To address" value={watch("BillToAddress") ?? billToAddress}
                     onChange={(event) => {
                       setBillToAddress(event.target.value);
                       setValue("BillToAddress", event.target.value, { shouldDirty: true });
                     }}/>
                    <Button
                      type="button"
                      size="icon"
                      aria-label="Open Bill To address details"
                      className="h-7 w-7 bg-neutral-900 px-1 text-white hover:bg-neutral-800"
                      onClick={() => {
                        const parts = (watch("BillToAddress") ?? billToAddress).split("\n");
                        setBillToAddressDraft(
                          Object.fromEntries(
                            addressComponentFields.map((field, index) => [field, parts[index] ?? ""]),
                          ),
                        );
                        setBillToDialogOpen(true);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Shipping Type */}
                  <div className="grid grid-cols-[150px_250px] items-center gap-2">
                    <label className={labelCls}>Shipping Type</label>
                    <Select value={watch("TransportationCode") == null ? "" : String(watch("TransportationCode"))} onValueChange={(value) => setValue("TransportationCode", value, { shouldDirty: true })}>
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue placeholder="Select shipping type" />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingTypes.map((shippingType) => (
                          <SelectItem key={shippingType.Code} value={String(shippingType.Code)}>
                            {shippingType.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right Section */}
                <div className="ml-auto mr-16 w-full space-y-3 md:w-[280px]">
                  {/* Language */}
                  <div className={logisticsRowCls}>
                    <label className={labelCls}>Language</label>
                    <Select value={watch("LanguageCode") == null ? "" : String(watch("LanguageCode"))} onValueChange={(value) => setValue("LanguageCode", value, { shouldDirty: true })}>
                      <SelectTrigger className="h-7 w-60 max-w-none text-xs">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ur">Urdu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options (aligned with field column) */}
                  <div className="space-y-0.5 pl-[113px]">
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox className={checkboxCls} checked={Boolean(watch("ProcureNonDropShip"))} onCheckedChange={(checked) => setValue("ProcureNonDropShip", checked === true, { shouldDirty: true })} />
                      Procure Non Drop-Ship Items
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox className={checkboxCls} checked={Boolean(watch("ProcureDropShip"))} onCheckedChange={(checked) => setValue("ProcureDropShip", checked === true, { shouldDirty: true })} />
                      Procure Drop-Ship Items
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox className={checkboxCls} checked={Boolean(watch("Confirmed"))} onCheckedChange={(checked) => setValue("Confirmed", checked === true, { shouldDirty: true })} />
                      Confirmed
                    </label>
                  </div>

                  {/* BP Channel Name */}
                  <div className={logisticsRowCls}>
                    <label className={`${labelCls} whitespace-nowrap`}>BP Channel Name</label>
                    <Input type="text" aria-label="BP Channel Name" value={watch("BPChannelCode") ?? ""} onChange={(event) => setValue("BPChannelCode", event.target.value, { shouldDirty: true })} className="h-7 w-60 max-w-none text-xs" />
                  </div>

                  {/* BP Channel Contact */}
                  <div className={logisticsRowCls}>
                    <label className={`${labelCls} whitespace-nowrap`}>BP Channel Contact</label>
                    <Select value={watch("BPChannelContact") == null ? "" : String(watch("BPChannelContact"))} onValueChange={(value) => setValue("BPChannelContact", value, { shouldDirty: true })}>
                      <SelectTrigger className="h-7 w-60 max-w-none text-xs">
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contact1">Contact 1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="attachments" className="overflow-hidden mt-0">
          <AttachmentsTab
            attachments={attachments}
            addAttachment={addAttachment}
            removeAttachment={removeAttachment}
            updateAttachment={updateAttachment}
            isTableDisabled={isTableDisabled}
          />
        </TabsContent>

        {hasAccountingTab && (
          <TabsContent
            value="accounting"
            className="mt-0 animate-in fade-in zoom-in-95 duration-500 pt-6"
          >
            {!isARInvoice ? (
              <div className="min-h-[320px] rounded-md border border-neutral-300 bg-white p-4 text-xs">
                <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
                  {/* Left */}
                  <div className="space-y-4">
                    <div className={rowCls}>
                      <label htmlFor="journal-remark">Journal Remark</label>
                      <Input id="journal-remark" value={watch("JournalMemo") ?? ""} onChange={(event) => setValue("JournalMemo", event.target.value, { shouldDirty: true })} className={inputCls} />
                    </div>

                    <div className={rowCls}>
                      <label htmlFor="payment-terms">Payment Terms</label>
                      <Select value={watch("PaymentGroupCode") == null ? "" : String(watch("PaymentGroupCode"))} onValueChange={(value) => setValue("PaymentGroupCode", value, { shouldDirty: true })}>
                        <SelectTrigger id="payment-terms" className={selectCls}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    </div>

                    <div className={rowCls}>
                      <label htmlFor="payment-method">Payment Method</label>
                      <Select value={watch("PaymentMethod") ?? ""} onValueChange={(value) => setValue("PaymentMethod", value, { shouldDirty: true })}>
                        <SelectTrigger id="payment-method" className={selectCls}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    </div>

                    
<div className="space-y-2">
  <div>Manually Recalculate Due Date:</div>

  <div className="grid grid-cols-[1fr_72px_auto_72px_auto_1fr] items-center gap-2">
    <Input
      type="date"
      aria-label="Selected Date"
      value={watch("ManualDueDate") ?? ""}
      onChange={(event) => setValue("ManualDueDate", event.target.value, { shouldDirty: true })}
      className="h-8 w-full text-xs"
    />

    <Input
      aria-label="Months"
      value={watch("ExtraMonth") ?? 0}
      onChange={(event) => setValue("ExtraMonth", event.target.value, { shouldDirty: true })}
      className="h-8 text-center text-xs"
    />

    <span>Months +</span>

    <Input
      aria-label="Days"
      value={watch("ExtraDays") ?? 0}
      onChange={(event) => setValue("ExtraDays", event.target.value, { shouldDirty: true })}
      className="h-8 text-center text-xs"
    />

    <span>Days</span>

    <Select defaultValue="none">
      <SelectTrigger
        aria-label="Due date adjustment"
        className="h-8 w-full text-xs"
      >
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="none">None</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>


                    <div className={rowCls}>
                      <label htmlFor="cash-discount-offset">Cash Discount Date Offset:</label>
                      <Input id="cash-discount-offset" type="number" value={watch("CashDiscountDateOffset") ?? ""} onChange={(event) => setValue("CashDiscountDateOffset", event.target.value, { shouldDirty: true })} className={inputCls} />
                    </div>

                    <label className="flex items-center gap-2 pl-[162px]">
                      <Checkbox className={checkboxCls} checked={Boolean(watch("UseShpdGoodsAct"))} onCheckedChange={(checked) => setValue("UseShpdGoodsAct", checked === true, { shouldDirty: true })} /> Use Shipped Goods Account
                    </label>
                  </div>

                  {/* Right */}
                  <div className="space-y-4">
                    <div className="grid w-fit grid-cols-[135px_260px] items-center gap-2 lg:ml-auto">
                      <label htmlFor="business-partner-project">Business Partner Project</label>
                      <Input id="business-partner-project" value={watch("Project") ?? ""} onChange={(event) => setValue("Project", event.target.value, { shouldDirty: true })} className={inputCls} />
                    </div>

                    <div className="grid w-fit grid-cols-[135px_260px] items-center gap-2 lg:ml-auto">
                      <label htmlFor="qr-code-from" className="pt-2">Create QR Code From</label>
                      <Textarea id="qr-code-from" value={watch("QRCodeFrom") ?? ""} onChange={(event) => setValue("QRCodeFrom", event.target.value, { shouldDirty: true })} className={`${textareaCls} h-16`} />
                    </div>

                    <div className="grid w-fit grid-cols-[135px_260px] items-center gap-2 lg:ml-auto">
                      <label htmlFor="indicator">Indicator</label>
                      <Select value={watch("Indicator") ?? ""} onValueChange={(value) => setValue("Indicator", value, { shouldDirty: true })}>
                        <SelectTrigger id="indicator" className={selectCls}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    </div>

                    <div className="grid w-fit grid-cols-[135px_260px] items-center gap-2 lg:ml-auto">
                      <label htmlFor="federal-tax-id">Federal Tax ID</label>
                      <Input id="federal-tax-id" value={watch("FederalTaxID") ?? ""} onChange={(event) => setValue("FederalTaxID", event.target.value, { shouldDirty: true })} className={inputCls} />
                    </div>

                    <div className="grid w-fit grid-cols-[135px_260px] items-center gap-2 lg:ml-auto">
                      <label htmlFor="order-number">Order Number</label>
                      <Input id="order-number" value={watch("NumAtCard") ?? ""} onChange={(event) => setValue("NumAtCard", event.target.value, { shouldDirty: true })} className={inputCls} />
                    </div>

                    <div className="grid w-fit grid-cols-[135px_260px] items-center gap-2 lg:ml-auto">
                      <span>Referenced Document</span>
                      <div>
                        <Button
                          type="button"
                          size="icon"
                          className={dotsBtnCls}
                          aria-label="Open reference information"
                          onClick={() => setReferenceDialogOpen(true)}
                        >
                          ...
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="w-full space-y-4 border rounded p-4">
              <div className="flex items-center gap-3">
                <AppLabel className="w-40 shrink-0">
                  Consolidation Type
                </AppLabel>
                <Select
                  value={watch("FatherType") || ""}
                  onValueChange={(val) =>
                    setValue("FatherType", val, { shouldDirty: true })
                  }
                  disabled={isEditMode}
                >
                  <SelectTrigger className="w-64" data-fms-field="FatherType">
                    <SelectValue placeholder="Select consolidation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cPayments_sum">
                      Payments Consolidation
                    </SelectItem>
                    <SelectItem value="cDelivery_sum">
                      Delivery Consolidation
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <AppLabel className="w-40 shrink-0">Father Card</AppLabel>
                <div
                  className="flex items-center gap-1 w-64"
                  data-fms-field="FatherCard"
                >
                  <Input
                    {...register("FatherCard")}
                    disabled
                    className="h-8"
                    placeholder="Select a business partner"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={isEditMode}
                    onClick={() => setFatherCardModalOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <BusinessPartnerSelectorDialog
        open={fatherCardModalOpen}
        onClose={() => setFatherCardModalOpen(false)}
        onSelect={(bp: BusinessPartner) => {
          setValue("FatherCard", bp.CardCode, { shouldDirty: true });
          setFatherCardModalOpen(false);
        }}
        cardType="C"
      />

      <ReferenceInformationDialog
        open={referenceDialogOpen}
        onOpenChange={setReferenceDialogOpen}
        cardCode={selectedCardCode}
      />

      <Dialog open={shipToDialogOpen} onOpenChange={setShipToDialogOpen}>
        <DialogContent
          className="z-[120] flex h-[540px] max-h-[calc(100vh-2rem)] w-[420px] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[420px]"
        >
          <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <DialogTitle className="pr-8 text-left text-sm font-semibold text-slate-900">
              Address Component
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 bg-white px-3 py-2">
            <div className="h-full min-h-0 overflow-y-auto rounded-md border border-slate-200 bg-white">
              <div className="grid h-full min-h-[300px] grid-rows-12 bg-white">
                {addressComponentFields.map((field) => (
                  <div key={field} className="grid min-h-0 grid-cols-[150px_1fr] grid-rows-1 border-b border-slate-200 last:border-b-0">
                    <label htmlFor={`ship-to-${field}`} className="flex items-center truncate border-r border-slate-200 bg-white px-2 text-[11px] text-slate-700">
                      {field}
                    </label>
                    <Input
                      id={`ship-to-${field}`}
                      value={shipToAddressDraft[field] ?? ""}
                      onChange={(event) => setShipToAddressDraft((current) => ({ ...current, [field]: event.target.value }))}
                      className="h-full min-h-0 rounded-none border border-slate-200 bg-white px-2 py-0 text-xs text-slate-900 shadow-none focus-visible:border-slate-400 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-slate-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 flex-row justify-start gap-2 border-t border-slate-200 bg-white px-3 py-3">
            <Button type="button" className="h-7 rounded-md bg-neutral-900 px-4 text-xs font-medium text-white shadow-sm hover:bg-neutral-800" onClick={() => {
              const address = addressComponentFields.map((field) => shipToAddressDraft[field] ?? "").join("\n").trimEnd();
              setShipToAddress(address);
              setValue("ShipToAddress", address, { shouldDirty: true });
              setValue("AddressExtension", {
                ...(watch("AddressExtension") ?? {}),
                ...toSapAddressExtension(shipToAddressDraft, "ShipTo"),
              }, { shouldDirty: true });
              setShipToDialogOpen(false);
            }}>
              OK
            </Button>
            <Button type="button" variant="outline" onClick={() => {
              setShipToDialogOpen(false);
            }} className="h-7 rounded-md border-slate-200 px-4 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={billToDialogOpen} onOpenChange={setBillToDialogOpen}>
        <DialogContent
          className="z-[120] flex h-[540px] max-h-[calc(100vh-2rem)] w-[420px] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[420px]"
        >
          <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <DialogTitle className="pr-8 text-left text-sm font-semibold text-slate-900">
              Address Component
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 bg-white px-3 py-2">
            <div className="h-full min-h-0 overflow-y-auto rounded-md border border-slate-200 bg-white">
              <div className="grid h-full min-h-[300px] grid-rows-12 bg-white">
                {addressComponentFields.map((field) => (
                  <div key={field} className="grid min-h-0 grid-cols-[150px_1fr] grid-rows-1 border-b border-slate-200 last:border-b-0">
                    <label htmlFor={`bill-to-${field}`} className="flex items-center truncate border-r border-slate-200 bg-white px-2 text-[11px] text-slate-700">
                      {field}
                    </label>
                    <Input
                      id={`bill-to-${field}`}
                      value={billToAddressDraft[field] ?? ""}
                      onChange={(event) => setBillToAddressDraft((current) => ({ ...current, [field]: event.target.value }))}
                      className="h-full min-h-0 rounded-none border-0 bg-white px-2 py-0 text-xs text-slate-900 shadow-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-slate-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 flex-row justify-start gap-2 border-t border-slate-200 bg-white px-3 py-3">
            <Button type="button" className="h-7 rounded-md bg-neutral-900 px-4 text-xs font-medium text-white shadow-sm hover:bg-neutral-800" onClick={() => {
              const address = addressComponentFields.map((field) => billToAddressDraft[field] ?? "").join("\n").trimEnd();
              setBillToAddress(address);
              setValue("BillToAddress", address, { shouldDirty: true });
              setValue("AddressExtension", {
                ...(watch("AddressExtension") ?? {}),
                ...toSapAddressExtension(billToAddressDraft, "BillTo"),
              }, { shouldDirty: true });
              setBillToDialogOpen(false);
            }}>
              OK
            </Button>
            <Button type="button" variant="outline" onClick={() => {
              setBillToDialogOpen(false);
            }} className="h-7 rounded-md border-slate-200 px-4 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <ItemSelectorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectItems={handleOnSelectItems}
        type={documentMode === "service" ? "service" : "item"}

      />
      <BulkResultModal
        open={excelPasteResultOpen}
        onClose={() => setExcelPasteResultOpen(false)}
        title="Excel Paste Results"
        rows={excelPasteResultRows}
      />

      {selectedLineForModal && (
        <SerialNumberSelectionDialog
          open={serialModalOpen}
          onClose={() => {
            setSerialModalOpen(false);

            setSelectedLineForModal(null);
          }}
          onConfirm={(selections) => {
            const state = useSalesDocument.getState();

            if (selections.serials) {
              Object.entries(selections.serials).forEach(
                ([itemCode, serials]) => {
                  state.setLineSerials(itemCode, serials);
                },
              );

              toast.success("Serial numbers allocated successfully");
            }
          }}
          lines={lines}
          initialItemCode={selectedLineForModal.ItemCode}
        />
      )}

      {selectedLineForModal && (
        <BatchNumberSelectionDialog
          open={batchModalOpen}
          onClose={() => {
            setBatchModalOpen(false);

            setSelectedLineForModal(null);
          }}
          onConfirm={(selections) => {
            const state = useSalesDocument.getState();

            if (selections.batches) {
              Object.entries(selections.batches).forEach(
                ([itemCode, batches]) => {
                  state.setLineBatches(itemCode, batches);
                },
              );

              toast.success("Batch numbers allocated successfully");
            }
          }}
          lines={lines}
          initialItemCode={selectedLineForModal.ItemCode}
        />
      )}
    </div>
  );
}

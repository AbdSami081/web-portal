import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLabel } from "@/components/Custom/AppLabel";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { usePRDDocConfig } from "./PRDDocumentLayout";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getwarehouses } from "@/api+/sap/master-data/warehouses";
import { Warehouse } from "@/types/warehouse/warehouse";
import { GenericModal } from "@/modals/GenericModal";
import { getBOMList, getDisassembleProductionOrders, getIssueForProduction, getProductionOrder, getReceiptFromProduction, getReleasedProductionOrders } from "@/api+/sap/production/productionService";
import { getItemsList } from "@/api+/sap/master-data/items";
import { DocumentType as SAPDocumentType } from "@/types/sales/salesDocuments.type";
import { Controller } from "react-hook-form";
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";
import { Item } from "@/types/sales/Item.type";
import { ConfirmationModal } from "@/modals/ConfirmationModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { getDocumentsList } from "@/api+/sap/common/documentService";
import { List } from "lucide-react";

const FormattedHeaderInput = ({ value, onChange, onBlur, placeholder, className, id }: any) => {
  const [localValue, setLocalValue] = useState(value ? value.toString() : "");

  useEffect(() => {
    if (document.activeElement !== document.getElementById(id)) {
      setLocalValue(value ? Number(value).toLocaleString() : "");
    }
  }, [value, id]);

  return (
    <Input
      id={id}
      type="number"
      className={className}
      value={value || ""}
      onChange={(e) => {
        const val = e.target.value;
        let numericVal = Number(val);
        if (!isNaN(numericVal)) {
          if (numericVal < 1) numericVal = 1;
          onChange(numericVal);
        }
      }}
      onBlur={() => {
        onBlur();
      }}
      placeholder={placeholder}
    />
  );
};

export function PRDDocumentHeader() {
  const {
    register,
    watch,
    setValue,
    control,
    getValues,
    formState: { errors },
  } = useFormContext();

  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [whsModalOpen, setWhsModalOpen] = useState(false);
  const [itemSelectorOpen, setItemSelectorOpen] = useState(false);
  const [showTypeConfirm, setShowTypeConfirm] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [dataList, setDataList] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [modalType, setModalType] = useState<"bom" | "order" | "list">("bom");
  const [isMultiBom, setIsMultiBom] = useState(false);
  const [docListModalOpen, setDocListModalOpen] = useState(false);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listSkip, setListSkip] = useState(0);
  const [listHasMore, setListHasMore] = useState(true);
  const LIST_PAGE_SIZE = 20;

  const { loadFromDocument, warehouses, setWarehouses, loadFromBOM, recalculateFromHeader, reset: resetStore, selectedBOM, initialStatus } = useIFPRDDocument();
  const { allowMultiBom: allowMultiBomConfig } = useAuthStore();
  const config = usePRDDocConfig();
  const docType = config.type;
  const watchedPlannedQty = watch("PlannedQuantity");

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await getwarehouses();
        setWarehouses(res);
      } catch (error) {
        console.error("Failed to fetch warehouses", error);
      }
    };
    if (warehouses.length === 0) {
      fetchWarehouses();
    }
  }, [setWarehouses, warehouses.length]);

  const watchedWhs = watch("Warehouse");

  useEffect(() => {
    if (warehouses.length > 0) {
      if (!watchedWhs) {
        setValue("Warehouse", warehouses[0].WhsCode, { shouldDirty: true });
      }
    }
  }, [warehouses, watchedWhs, setValue]);

  useEffect(() => {
    if (watchedPlannedQty !== undefined) {
      recalculateFromHeader(Number(watchedPlannedQty));
    }
  }, [watchedPlannedQty]);

  const docNum = watch("DocNum");
  useEffect(() => {
    if (docNum) {
      setSearchValue(docNum.toString());
    }
  }, [docNum]);


  const getResourceName = (type: number) => {
    switch (type) {
      case SAPDocumentType.ProductionOrder: return "ProductionOrders";
      case SAPDocumentType.IssueForProduction: return "InventoryGenExits";
      case SAPDocumentType.ReceiptFromProduction: return "InventoryGenEntries";
      default: return "";
    }
  };

  const fetchDocumentsList = async (isLoadMore = false) => {
    const resourceName = getResourceName(docType);
    if (!resourceName) return;

    const currentSkip = isLoadMore ? listSkip + LIST_PAGE_SIZE : 0;

    setIsLoadingList(true);
    try {
      const data = await getDocumentsList(resourceName, currentSkip, LIST_PAGE_SIZE);
      const newDocs = (data || []).map((d: any) => ({
        ...d,
        // Fallbacks for Issue and Receipt to resolve empty Item columns
        ItemNo: d.ItemNo || d.U_ItemCode || d.ItemCode || (d.DocumentLines && d.DocumentLines[0]?.ItemCode) || "",
        ItemName: d.ProductDescription || d.U_ItemName || d.ItemName || (d.DocumentLines && d.DocumentLines[0]?.ItemDescription) || "",
        // Format SAP enums for nice display
        ProductionOrderStatus: d.ProductionOrderStatus?.replace("bopos", "") || d.ProductionOrderStatus,
        DocumentStatus: d.DocumentStatus?.replace("bost_", "") || d.DocumentStatus,
      }));

      if (isLoadMore) {
        setDocumentsList(prev => [...prev, ...newDocs]);
        setListSkip(currentSkip);
      } else {
        setDocumentsList(newDocs);
        setListSkip(0);
        setDocListModalOpen(true);
      }

      setListHasMore(newDocs.length === LIST_PAGE_SIZE);
    } catch (error) {
      toast.error("Failed to fetch documents list.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        fetchDocumentsList(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docType, listSkip, listHasMore]);

  const fetchDocument = async (baseRef: string) => {
    var documentData: any;
    if (!baseRef) {
      toast.error("Invalid Document Number entered.");
      return;
    }

    setIsLoading(true);
    try {
      if (docType === SAPDocumentType.IssueForProduction) {
        documentData = await getIssueForProduction(Number(baseRef));
      } else if (docType === SAPDocumentType.ProductionOrder) {
        documentData = await getProductionOrder(Number(baseRef));
      } else if (docType === SAPDocumentType.ReceiptFromProduction) {
        documentData = await getReceiptFromProduction(Number(baseRef));
      }

      if (documentData && (documentData.DocEntry || documentData.AbsoluteEntry)) {
        loadFromDocument(documentData);
        // Map header fields to form
        if (docType === SAPDocumentType.ProductionOrder) {
          setValue("AbsoluteEntry", documentData.AbsoluteEntry, { shouldDirty: true });
          setValue("DocNum", documentData.DocumentNumber, { shouldDirty: true });
          setValue("ItemNo", documentData.ItemNo, { shouldDirty: true });
          setValue("ProductDescription", documentData.ProductDescription, { shouldDirty: true });
          setValue("PlannedQuantity", documentData.PlannedQuantity, { shouldDirty: true });
          setValue("Warehouse", documentData.Warehouse, { shouldDirty: true });
          setValue("Priority", documentData.Priority, { shouldDirty: true });
          setValue("StartDate", documentData.StartDate?.split("T")[0], { shouldDirty: true });
          setValue("DueDate", documentData.DueDate?.split("T")[0], { shouldDirty: true });
          setValue("CreationDate", documentData.CreationDate?.split("T")[0], { shouldDirty: true });
          setValue("ProductionOrderType", documentData.ProductionOrderType, { shouldDirty: true });
          setValue("Remarks", documentData.Remarks, { shouldDirty: true });
          setValue("Comments", documentData.Remarks, { shouldDirty: true });
          setValue("PostingDate", documentData.PostingDate?.split("T")[0], { shouldDirty: true });

          // Use setTimeout with a slight delay to ensure the Select options render before setting value
          setTimeout(() => {
            setValue("ProductionOrderStatus", documentData.ProductionOrderStatus, { shouldDirty: true });
          }, 100);
        } else {
          setValue("DocNum", documentData.DocNum);
          setValue("DocEntry", documentData.DocEntry);
          setValue("DocDate", documentData.DocDate?.split("T")[0]);
          setValue("DocDueDate", documentData.DocDueDate?.split("T")[0]);
          setValue("TaxDate", documentData.TaxDate?.split("T")[0]);
          setValue("Comments", documentData.Comments);
          setValue("JournalMemo", documentData.JournalMemo);
        }

        toast.success(`Document #${baseRef} loaded successfully.`);
      } else {
        toast.info(`Document number ${baseRef} not found.`);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while fetching the document.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItems = async (isReset = true) => {
    const type = watch("ProductionOrderType");
    if (type === "bopotSpecial") {
      setItemSelectorOpen(true);
      return;
    }

    setIsLoadingItems(true);
    try {
      const currentSkip = isReset ? 0 : skip;
      let data = await getBOMList(isMultiBom, searchValue, currentSkip, 20);

      // Normalize Multi BOM structure: map 'lines' to 'ProductTreeLines' for the store
      if (isMultiBom && data.length > 0) {
        data = data.map((d: any) => ({
          ...d,
          ProductTreeLines: d.lines || []
        }));
      }

      if (isReset) {
        setDataList(data);
        setSkip(20);
      } else {
        setDataList((prev) => [...prev, ...data]);
        setSkip(currentSkip + 20);
      }
      setHasMore(data.length === 20);
      setModalType("bom");
      setBomModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchOrders = async (isReset = true) => {
    setIsLoadingItems(true);
    try {
      const currentSkip = isReset ? 0 : skip;
      const productionOrderType = watch("ProductionOrderType");
      let data = [];
      if (productionOrderType === "bopotDisassembly") {
        data = await getDisassembleProductionOrders(currentSkip, 20);
      } else {
        data = await getReleasedProductionOrders(currentSkip, 20);
      }

      const originalLength = data.length;

      if (docType === SAPDocumentType.ReceiptFromProduction) {
        data = data.filter((order: any) => (order.CompletedQuantity || 0) < (order.PlannedQuantity || 0));
      } else if (docType === SAPDocumentType.IssueForProduction) {
        data = data.filter((order: any) => {
          const manualLines = order.ProductionOrderLines?.filter((l: any) => l.ProductionOrderIssueType === "im_Manual") || [];
          return manualLines.some((l: any) => (l.IssuedQuantity || 0) < (l.PlannedQuantity || 0));
        });
      }

      if (isReset) {
        setDataList(data);
        setSkip(20);
      } else {
        setDataList((prev) => [...prev, ...data]);
        setSkip(currentSkip + 20);
      }
      setHasMore(originalLength === 20);
      setModalType("order");
      setBomModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleSelectItem = (item: any) => {
    if (modalType === "order") {
      fetchDocument(item.DocumentNumber || item.DocNum);
      setBomModalOpen(false);
      return;
    }

    const type = getValues("ProductionOrderType");
    if (type === "bopotSpecial") {
      setValue("ItemNo", item.ItemCode || item.ItemNo || "", { shouldDirty: true, shouldValidate: true });
      setValue("ProductDescription", item.ItemName || item.Dscription || item.ProductDescription || "", { shouldDirty: true, shouldValidate: true });
      resetStore();
    } else {
      // Use U_PCode/U_Name as fallback for Multi-BOM
      const itemCode = item.TreeCode || item.ItemCode || item.U_PCode;
      const itemName = item.ProductDescription || item.ItemName || item.U_Name || "";
      setValue("ItemNo", itemCode, { shouldDirty: true, shouldValidate: true });
      setValue("ProductDescription", itemName, { shouldDirty: true, shouldValidate: true });
      const currentPlannedQty = watch("PlannedQuantity");
      const plannedQty = currentPlannedQty ? Number(currentPlannedQty) : 0;
      loadFromBOM(item, plannedQty);
    }
    setBomModalOpen(false);
  };

  const handleTypeChange = (newType: string) => {
    const currentItem = watch("ItemNo");
    if (currentItem) {
      setPendingType(newType);
      setShowTypeConfirm(true);
    } else {
      setValue("ProductionOrderType", newType, { shouldDirty: true });
    }
  };

  const confirmTypeChange = () => {
    if (!pendingType) return;
    setValue("ProductionOrderType", pendingType, { shouldDirty: true });

    if (pendingType === "bopotSpecial") {
      resetStore();
    } else if (selectedBOM) {
      const currentPlannedQty = watch("PlannedQuantity");
      loadFromBOM(selectedBOM, Number(currentPlannedQty || 0));
    }
    setShowTypeConfirm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">

        {config.headerFields.reference && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Reference</AppLabel>
            <Input
              type="text"
              {...register("Ref2")}
              className="h-8 flex-1"
              placeholder="Enter Reference"
              disabled={initialStatus === "boposClosed"}
            />
          </div>
        )}

        {config.headerFields.docDate && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">
              {docType === SAPDocumentType.ProductionOrder ? "Document Date" : "Posting Date"}
            </AppLabel>
            <Input type="date" {...register("TaxDate")} className="h-8 flex-1" disabled={initialStatus === "boposClosed"} />
          </div>
        )}

        {config.headerFields.type && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Type</AppLabel>
            <Select
              onValueChange={handleTypeChange}
              value={watch("ProductionOrderType") || "bopotStandard"}
              disabled={!!watch("AbsoluteEntry")}
            >
              <SelectTrigger className="h-8 flex-1">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bopotStandard">Standard</SelectItem>
                <SelectItem value="bopotSpecial">Special</SelectItem>
                <SelectItem value="bopotDisassembly">Disassembly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {config.headerFields.productNo && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Product No.</AppLabel>
            <div className="flex items-center gap-2 flex-1 relative">
              <Input id="item-no-field" type="text" {...register("ItemNo")} className="h-8 flex-1 bg-gray-100 text-gray-500 cursor-not-allowed" readOnly />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => fetchItems(true)}
                  disabled={initialStatus === "boposClosed"}
                >
                  {isLoadingItems ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {allowMultiBomConfig && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 rounded-md border border-neutral-200 shrink-0">
                  <input
                    type="checkbox"
                    id="is-multi-bom"
                    className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                    checked={isMultiBom}
                    onChange={(e) => setIsMultiBom(e.target.checked)}
                  />
                  <label htmlFor="is-multi-bom" className="text-[9px] font-bold text-neutral-600 cursor-pointer uppercase tracking-tighter whitespace-nowrap">
                    M-BOM
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {config.headerFields.search && (
          <div className="flex items-center gap-2">
            <div className="w-28 shrink-0" /> {/* Spacer to match label width */}
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="text"
                className="h-8 flex-1"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    fetchDocument(searchValue);
                  }
                }}
                placeholder="Search DocNum..."
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => fetchDocument(searchValue)}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                ) : (
                  <Search className="h-4 w-4 text-black" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => fetchDocumentsList(false)}
                title="List documents (Ctrl+F)"
              >
                {isLoadingList ? (
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                ) : (
                  <List className="h-4 w-4 text-black" />
                )}
              </Button>
            </div>
          </div>
        )}

        {config.headerFields.productDescription && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Description</AppLabel>
            <Input type="text" {...register("ProductDescription")} className="h-8 flex-1 bg-gray-100 text-gray-500 cursor-not-allowed" readOnly />
          </div>
        )}

        {config.headerFields.status && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Status</AppLabel>
            <Controller
              name="ProductionOrderStatus"
              control={control}
              defaultValue="boposPlanned"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || "boposPlanned"}
                  disabled={initialStatus === "boposClosed"}
                >
                  <SelectTrigger className="h-8 flex-1">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boposPlanned">Planned</SelectItem>
                    {(!!watch("AbsoluteEntry") || field.value === "boposReleased" || field.value === "boposClosed") && (
                      <SelectItem value="boposReleased">Released</SelectItem>
                    )}
                    {(!!watch("AbsoluteEntry") || field.value === "boposClosed") && (
                      <SelectItem value="boposClosed">Closed</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        {config.headerFields.plannedQuantity && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Planned Qty</AppLabel>
            <Controller
              name="PlannedQuantity"
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <FormattedHeaderInput
                  id="planned-qty-input"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  disabled={initialStatus === "boposClosed"}
                  className="h-8 flex-1"
                  placeholder="Enter Planned Qty"
                />
              )}
            />
          </div>
        )}

        {config.headerFields.warehouse && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Warehouse</AppLabel>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="text"
                className="h-8 flex-1 bg-gray-100 text-gray-500 cursor-not-allowed"
                value={watch("Warehouse") || ""}
                disabled={initialStatus === "boposClosed"}
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => setWhsModalOpen(true)}
                disabled={initialStatus === "boposClosed"}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {config.headerFields.priority && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Priority</AppLabel>
            <Input type="number" {...register("Priority")} className="h-8 flex-1 bg-gray-100 text-gray-500 cursor-not-allowed" readOnly />
          </div>
        )}

        {config.headerFields.orderDate && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Order Date</AppLabel>
            <Input type="date" {...register("CreationDate")} className="h-8 flex-1" disabled={!!docNum} />
          </div>
        )}

        {config.headerFields.startDate && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Start Date</AppLabel>
            <Input type="date" {...register("StartDate")} className="h-8 flex-1" disabled={!!docNum} />
          </div>
        )}

        {config.headerFields.dueDate && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Due Date</AppLabel>
            <Input type="date" {...register("DueDate")} className="h-8 flex-1" />
          </div>
        )}



      </div>

      <GenericModal
        title="Select Warehouse"
        open={whsModalOpen}
        onClose={() => setWhsModalOpen(false)}
        onSelect={(wh: Warehouse) => {
          setValue("Warehouse", wh.WhsCode, { shouldDirty: true });
          setWhsModalOpen(false);
        }}
        data={warehouses}
        columns={[
          { key: "WhsCode", label: "Warehouse Code" },
          { key: "WhsName", label: "Warehouse Name" },
        ]}
        getSelectValue={(item) => item}
      />

      <GenericModal
        title={
          modalType === "order"
            ? "Select Production Order"
            : watch("ProductionOrderType") === "bopotSpecial"
              ? "Select Item"
              : isMultiBom
                ? "Select Bill of Materials (Multi BOM)"
                : "Select Bill of Materials"
        }
        open={bomModalOpen}
        onClose={() => setBomModalOpen(false)}
        onSelect={handleSelectItem}
        data={dataList}
        columns={
          modalType === "order"
            ? [
              { key: "DocumentNumber", label: "Doc Num" },
              { key: "ItemNo", label: "Item No" },
              { key: "ProductionOrderType", label: "Type" },
              { key: "PlannedQuantity", label: "Qty" },
            ]
            : watch("ProductionOrderType") === "bopotSpecial"
              ? [
                { key: "ItemCode", label: "Item No" },
                { key: "ItemName", label: "Description" },
              ]
              : isMultiBom
                ? [
                  { key: "U_PCode", label: "Item No" },
                  { key: "U_Name", label: "Description" },
                ]
                : [
                  { key: "TreeCode", label: "Item No" },
                  { key: "ProductDescription", label: "Description" },
                ]
        }
        getSelectValue={(item) => item}
        isLoading={isLoadingItems}
        onLoadMore={() => modalType === "order" ? fetchOrders(false) : fetchItems(false)}
        hasMore={hasMore}
      />

      <GenericModal
        title={`Select ${getResourceName(docType).replace(/([A-Z])/g, ' $1').trim()}`}
        open={docListModalOpen}
        onClose={() => setDocListModalOpen(false)}
        onSelect={(val) => {
          fetchDocument(val.toString());
          setDocListModalOpen(false);
        }}
        data={documentsList}
        getSelectValue={(item) => item.DocNum || item.DocumentNumber}
        columns={
          docType === SAPDocumentType.ProductionOrder
            ? [
              { key: "DocumentNumber", label: "Doc Num" },
              { key: "ItemNo", label: "Item No" },
              { key: "PlannedQuantity", label: "Qty" },
              { key: "ProductionOrderStatus", label: "Status" },
              { key: "PostingDate", label: "Date" },
            ]
            : [
              { key: "DocNum", label: "Doc Num" },
              { key: "ItemNo", label: "Item No" },
              { key: "ItemName", label: "Item Name" },
              { key: "Comments", label: "Comments" },
              { key: "DocumentStatus", label: "Status" },
              { key: "DocDate", label: "Date" },
            ]
        }
        isLoading={isLoadingList}
        onLoadMore={() => fetchDocumentsList(true)}
        hasMore={listHasMore}
      />

      <ItemSelectorDialog
        open={itemSelectorOpen}
        multiple={false}
        onClose={() => setItemSelectorOpen(false)}
        onSelectItems={(items: Item[]) => {
          if (items.length > 0) {
            const item = items[0];
            setValue("ItemNo", item.ItemCode, { shouldDirty: true, shouldValidate: true });
            setValue("ProductDescription", item.ItemName || "", { shouldDirty: true, shouldValidate: true });
            resetStore();
          }
          setItemSelectorOpen(false);
        }}
      />

      <ConfirmationModal
        open={showTypeConfirm}
        onOpenChange={setShowTypeConfirm}
        onConfirm={confirmTypeChange}
        title="Change Document Type?"
        description={pendingType === "bopotSpecial" ? "Changing to Special will delete all current lines. Do you want to proceed?" : "Changing type will update all existing lines. Do you want to proceed?"}
        cancelText="No, keep lines"
        confirmText={pendingType === "bopotSpecial" ? "Yes, delete lines" : "Yes, update all"}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { usePRDDocConfig } from "./PRDDocumentLayout";
import { Button } from "@/components/ui/button";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";
import { AppLabel } from "@/components/Custom/AppLabel";
import { GenericModal } from "@/modals/GenericModal";
import { getReleasedProductionOrders, getDisassembleProductionOrders } from "@/api+/sap/production/productionService";
import { DocumentType } from "@/types/sales/salesDocuments.type";

export default function PRDDocumentFooter() {
  const { watch, register, setValue } = useFormContext();
  const config = usePRDDocConfig();
  const [showItemSelector, setShowItemSelector] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showLineModal, setShowLineModal] = useState(false);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingLines, setIsLoadingLines] = useState(false);
  const [modalTitle, setModalTitle] = useState("Select Production Order");

  const { addLine, loadFromDocument } = useIFPRDDocument();

  const handleFetchOrders = async () => {
    setModalTitle("Select Production Order");
    setIsLoadingOrders(true);
    setShowOrderModal(true);
    try {
      const data = await getReleasedProductionOrders();
      const processedOrders = data
        .filter((order: any) => {
          const manualLines = order.ProductionOrderLines?.filter((l: any) => l.ProductionOrderIssueType === "im_Manual") || [];
          return manualLines.some((l: any) => (l.IssuedQuantity || 0) < (l.PlannedQuantity || 0));
        })
        .map((order: any) => ({
          ...order,
          DisplayType: order.ProductionOrderType === "bopotStandard" ? "Standard" :
            order.ProductionOrderType === "bopotSpecial" ? "Special" :
              order.ProductionOrderType === "bopotAssembly" ? "Assembly" : order.ProductionOrderType
        }));
      setProductionOrders(processedOrders);
    } catch (error) {
      console.error("Failed to fetch released orders", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleFetchDisassembleOrders = async () => {
    setModalTitle("Select Disassembly Order");
    setIsLoadingOrders(true);
    setShowOrderModal(true);
    try {
      const data = await getDisassembleProductionOrders();
      const processedOrders = data
        .filter((order: any) => {
          const manualLines = order.ProductionOrderLines?.filter((l: any) => l.ProductionOrderIssueType === "im_Manual") || [];
          return manualLines.some((l: any) => (l.IssuedQuantity || 0) < (l.PlannedQuantity || 0));
        })
        .map((order: any) => ({
          ...order,
          DisplayType: order.ProductionOrderType === "bopotStandard" ? "Standard" :
            order.ProductionOrderType === "bopotSpecial" ? "Special" :
              order.ProductionOrderType === "bopotDisassembly" ? "Disassembly" : order.ProductionOrderType
        }));
      setProductionOrders(processedOrders);
    } catch (error) {
      console.error("Failed to fetch disassembly orders", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleOrderSelect = (orderId: any) => {
    const order = productionOrders.find(o => o.AbsoluteEntry === orderId);
    if (order) {
      if (modalTitle === "Select Disassembly Order") {
        // Set Header Fields in the form
        setValue("ItemNo", order.ItemNo, { shouldDirty: true });
        setValue("ProductDescription", order.ProductDescription, { shouldDirty: true });
        setValue("PlannedQuantity", order.PlannedQuantity, { shouldDirty: true });
        setValue("Warehouse", order.Warehouse, { shouldDirty: true });
        setValue("ProductionOrderType", order.ProductionOrderType, { shouldDirty: true });
        setValue("Priority", order.Priority, { shouldDirty: true });
        setValue("AbsoluteEntry", order.AbsoluteEntry, { shouldDirty: true });
        setValue("DocNum", order.DocumentNumber, { shouldDirty: true });
        setValue("ProductionOrderStatus", order.ProductionOrderStatus, { shouldDirty: true });
        setValue("StartDate", order.StartDate?.split("T")[0], { shouldDirty: true });
        setValue("DueDate", order.DueDate?.split("T")[0], { shouldDirty: true });
        setValue("CreationDate", order.CreationDate?.split("T")[0], { shouldDirty: true });
        setValue("PostingDate", order.PostingDate?.split("T")[0], { shouldDirty: true });

        // Handle Disassembly: Load the Parent Item as a single line for "Issue"
        const parentLine = {
          ItemNo: order.ItemNo,
          ItemDescription: order.ProductDescription,
          Quantity: order.PlannedQuantity,
          WarehouseCode: order.Warehouse,
          BaseEntry: order.AbsoluteEntry,
          BaseLine: -1,
          ProductionOrderIssueType: "im_Manual",
          ItemType: "pit_Item",
        };

        // Update Store (using the parent line instead of components)
        loadFromDocument({
          ...order,
          ProductionOrderLines: [parentLine],
        }, config.type);

        setShowOrderModal(false);
      } else {
        setSelectedOrder(order);
        setShowLineModal(true);
        setIsLoadingLines(true);
        setTimeout(() => {
          setIsLoadingLines(false);
        }, 500);
      }
    }
  };

  const handleLinesSelect = (lineNumbers: any[]) => {
    if (selectedOrder) {
      const selectedLines = selectedOrder.ProductionOrderLines.filter((l: any) =>
        lineNumbers.includes(l.LineNumber)
      );

      selectedLines.forEach((line: any) => {
        addLine({
          ItemNo: line.ItemNo,
          ItemName: line.ItemName || "",
          OriginalPlannedQuantity: line.PlannedQuantity,
          PlannedQuantity: line.PlannedQuantity - (line.IssuedQuantity || 0),
          Warehouse: line.Warehouse || "",
          ItemType: line.ItemType || "pit_Item",
          BaseQuantity: line.BaseQuantity,
          IssuedQuantity: line.IssuedQuantity || 0,
          ProductionOrderIssueType: line.ProductionOrderIssueType,
          UoMCode: line.UoMCode?.toString(),
          OrderNumber: selectedOrder.AbsoluteEntry,
          LineNumber: line.LineNumber,
          StartDate: line.StartDate,
          EndDate: line.EndDate,
        });
      });
    }
    setShowLineModal(false);
    setSelectedOrder(null);
  };

  const handleItemSelect = (selectedItems: any[]) => {
    if (selectedItems.length > 0) {
      const item = selectedItems[0];
      setValue("U_ItemCode", item.itemCode);
      setValue("U_ItemDescription", item.itemName);
    }
    setShowItemSelector(false);
  };

  return (
    <div className="space-y-6 mt-8 border-t pt-6 bg-zinc-50/50 p-6 rounded-xl border border-zinc-100 shadow-sm transition-all hover:shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <AppLabel htmlFor="comments">Remarks</AppLabel>
            <Textarea
              id="comments"
              {...register("Remarks")}
              rows={4}
              placeholder="Enter additional information or notes here..."
              className="resize-none border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100 transition-all text-sm leading-relaxed"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <AppLabel htmlFor="pickRmrk">
              {config.type === DocumentType.IssueForProduction ? "Journal Remarks" : "Pick and Pack Remarks"}
            </AppLabel>
            <Textarea
              id="pickRmrk"
              {...register(config.type === DocumentType.IssueForProduction ? "JournalMemo" : "PickRmrk")}
              rows={4}
              placeholder={
                config.type === DocumentType.IssueForProduction
                  ? "Enter journal remarks..."
                  : "Enter pick and pack specific instructions..."
              }
              className="resize-none border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100 transition-all text-sm leading-relaxed"
            />
          </div>
          {config.footerActions?.showProductionOrderButton && (
            <div className="flex justify-end mt-2 gap-2">
              <Button
                type="button"
                onClick={handleFetchOrders}
                className="bg-black text-white hover:bg-zinc-800 h-8 text-xs font-semibold px-4 rounded-md shadow-sm transition-all active:scale-95"
              >
                Production Order
              </Button>
              <Button
                type="button"
                onClick={handleFetchDisassembleOrders}
                className="bg-black text-white hover:bg-zinc-800 h-8 text-xs font-semibold px-4 rounded-md shadow-sm transition-all active:scale-95"
              >
                Disassembly Order
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">

        {watch("ProductionOrderType") === "bopotSpecial" && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <AppLabel>Special Item Selection</AppLabel>
            <div className="flex gap-2">
              <div className="flex-1 h-10 px-3 flex items-center bg-white border border-zinc-100 rounded-lg text-sm text-zinc-500 truncate italic">
                {watch("U_ItemCode") ? `${watch("U_ItemCode")} - ${watch("U_ItemDescription")}` : "No special item selected"}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-4 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 transition-all font-medium whitespace-nowrap"
                onClick={() => setShowItemSelector(true)}
              >
                Select Item
              </Button>
            </div>
          </div>
        )}
      </div>

      <ItemSelectorDialog
        open={showItemSelector}
        onClose={() => setShowItemSelector(false)}
        onSelectItems={handleItemSelect}
        multiple={false}
      />

      <GenericModal
        title={modalTitle}
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        data={productionOrders}
        onSelect={handleOrderSelect}
        getSelectValue={(item) => item.AbsoluteEntry}
        isLoading={isLoadingOrders}
        columns={[
          { key: "DocumentNumber", label: "Docu..." },
          { key: "Series", label: "Series Name" },
          { key: "ItemNo", label: "Product No." },
          { key: "DisplayType", label: "Production Order..." },
          { key: "DueDate", label: "Due Date" },
          { key: "ProductDescription", label: "Product Descrip..." },
        ]}
      />

      <GenericModal
        title={`Select Lines - Order #${selectedOrder?.AbsoluteEntry}`}
        open={showLineModal}
        onClose={() => setShowLineModal(false)}
        data={selectedOrder?.ProductionOrderLines?.filter((l: any) => l.ProductionOrderIssueType === "im_Manual").map((l: any) => ({
          ...l,
          OrderNumber: selectedOrder.AbsoluteEntry,
          DisplayItemType: l.ItemType?.replace(/^[pd]it_/, "")
        })) || []}
        onSelect={handleLinesSelect}
        multiple={true}
        getSelectValue={(item: any) => item.LineNumber}
        isLoading={isLoadingLines}
        columns={[
          { key: "OrderNumber", label: "Order Number" },
          { key: "LineNumber", label: "Row No." },
          { key: "ItemNo", label: "Item Number" },
          { key: "ItemName", label: "Item Description" },
          { key: "DisplayItemType", label: "Type" },
          { key: "IssuedQuantity", label: "Quantity" },
          { key: "Warehouse", label: "Whse" },
          { key: "StartDate", label: "Start Date" },
          { key: "EndDate", label: "End Date" },
        ]}
      />
    </div>
  );
}

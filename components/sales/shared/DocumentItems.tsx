import { useEffect, useState } from "react";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { Button } from "@/components/ui/button";
import { ItemSelectorDialog } from "../../../modals/ItemSelectorDialog";
import { DocumentLineRow } from "./DocumentItemRow";
import { useFormContext } from "react-hook-form";
import { Item } from "@/types/sales/Item.type";
import { getCustomerPrice } from "@/lib/sap/helpers/masterDataHelper";
import { DocumentType } from "@/types/master/DocumentType";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSalesDocConfig } from "./SalesDocumentLayout";
import {
  Plus,
  FileText,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { AttachmentsTab } from "@/components/shared/AttachmentsTab";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { SerialNumberSelectionDialog } from "@/modals/SerialNumberSelectionDialog";
import { BatchNumberSelectionDialog } from "@/modals/BatchNumberSelectionDialog";
import { ResizableTable } from "@/components/Custom/ResizableTable";

export function DocumentItems() {
  const { watch } = useFormContext();

  const selectedCardCode =
    watch("CardCode");

  const {
    lines,
    addLine,
    customer,

    attachments,
    addAttachment,
    removeAttachment,
    updateAttachment,
  } = useSalesDocument();

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("content");

  const config = useSalesDocConfig();

  const isTableDisabled =
    config.isDisabledTable(
      customer?.DocumentStatus!
    );

  const {
    freightsWithCharges,
    warehouses,
    loadMasterData,
  } = useMasterDataStore();

  const firstWhs =
    warehouses.length > 0
      ? warehouses[0].WarehouseCode
      : "";

  const [contextMenu, setContextMenu] =
    useState<{
      x: number;
      y: number;
      line?: any;
    } | null>(null);

  const [
    selectedLineForModal,
    setSelectedLineForModal,
  ] = useState<any | null>(null);

  const [
    serialModalOpen,
    setSerialModalOpen,
  ] = useState(false);

  const [
    batchModalOpen,
    setBatchModalOpen,
  ] = useState(false);

  useEffect(() => {
    loadMasterData("C", "O");
  }, [loadMasterData]);

  const handleOnSelectItems = (
    items: Item[]
  ) => {
    items.forEach((item) => {
      const price =
        getCustomerPrice(
          item.Prices || []
        );

      const isItem =
        item.Category === "I" ||
        item.ItemType === "itItems";

      const targetTaxCode = isItem
        ? item.VatGourpPu
        : item.VatGourpSa;

      const selectedTax =
        freightsWithCharges.find(
          (t) =>
            t.Code === targetTaxCode
        );

      const taxRate = Number(
        selectedTax?.Rate || 0
      );

      const defaultWhsLine =
        item.DefaultWhse || firstWhs;

      addLine({
        ItemCode: item.ItemCode,
        ItemName:
          item.ItemName ||
          item.ItemDescription ||
          "",
        Quantity: 1,
        Price: price,
        TaxCode: targetTaxCode,
        TaxRate: taxRate,
        WarehouseCode:
          defaultWhsLine,
        UoMCode: item.UoM || "",
        ManSerNum:
          item.ManSerNum,
        ManBtchNum:
          item.ManBtchNum,
      });
    });
  };

  const handleRowContextMenu = (
    e: React.MouseEvent,
    line: any
  ) => {
    e.preventDefault();

    const isDeliveryOrInvoice =
      config.type ===
        DocumentType.Delivery ||
      config.type ===
        DocumentType.ARInvoice;

    if (!isDeliveryOrInvoice)
      return;

    const isSerial =
      String(
        line.ManSerNum
      ).toLowerCase() === "y" ||
      String(
        line.ManSerNum
      ).toLowerCase() === "tyes";

    const isBatch =
      String(
        line.ManBtchNum
      ).toLowerCase() === "y" ||
      String(
        line.ManBtchNum
      ).toLowerCase() === "tyes";

    const isSerialBatchItem =
      isSerial || isBatch;

    if (!isSerialBatchItem)
      return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      line,
    });
  };

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
      key: "UoMCode",
      title: "UoM",
      width: 120,
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
  ];

  return (
    <div className="grid w-full relative pt-2 overflow-visible">
      <Tabs
        value={activeTab}
        onValueChange={
          setActiveTab
        }
        className="w-full pt-1 overflow-x-auto"
      >
        <TabsList className="grid w-[240px] grid-cols-2 mb-4 bg-neutral-900 p-1 rounded-lg h-9 border border-neutral-800">
          <TabsTrigger
            value="content"
            className="rounded-md font-bold text-[9px] uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400"
          >
            Content
          </TabsTrigger>

          <TabsTrigger
            value="attachments"
            className="rounded-md font-bold text-[9px] uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400"
          >
            Attachments
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="content"
          className="mt-0 pt-6"
        >
          <div className="relative overflow-visible">
            <div className="absolute -top-6 left-2 z-50">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => {
                        if (
                          !selectedCardCode
                        ) {
                          const field =
                            document.getElementById(
                              "card-code-field"
                            );

                          if (field) {
                            field.classList.add(
                              "animate-glow-red-blink"
                            );

                            setTimeout(() => {
                              field.classList.remove(
                                "animate-glow-red-blink"
                              );
                            }, 3000);
                          }

                          return;
                        }

                        setDialogOpen(
                          true
                        );
                      }}
                      className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="h-5 w-5 stroke-[2.5px]" />
                    </Button>
                  </TooltipTrigger>

                  <TooltipContent side="right">
                    Add Item
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="relative border rounded overflow-x-auto">
              <div
                className={`w-full overflow-x-auto pb-2 ${
                  isTableDisabled
                    ? "opacity-80 pointer-events-none"
                    : ""
                }`}
              >
                <ResizableTable
                  columns={columns}
                  data={lines}
                  emptyMessage="No items added yet."
                  onRowContextMenu={(
                    e,
                    line
                  ) =>
                    handleRowContextMenu(
                      e,
                      line
                    )
                  }
                  renderRow={(
                    line,
                    idx
                  ) => (
                    <DocumentLineRow
                      index={idx}
                      line={line}
                    />
                  )}
                />

                {contextMenu && (
                  <div
                    className="fixed z-50 bg-white border border-neutral-200/80 shadow-lg rounded-lg w-72 p-1"
                    style={{
                      top: contextMenu.y,
                      left:
                        contextMenu.x,
                    }}
                    onMouseLeave={() =>
                      setContextMenu(
                        null
                      )
                    }
                  >
                    <button
                      className="cursor-pointer w-full text-left px-3 py-2 hover:bg-neutral-100 rounded text-sm font-semibold flex items-center gap-2 text-neutral-800"
                      onClick={() => {
                        const isBatch =
                          String(
                            contextMenu
                              .line
                              .ManBtchNum
                          ).toLowerCase() ===
                            "y" ||
                          String(
                            contextMenu
                              .line
                              .ManBtchNum
                          ).toLowerCase() ===
                            "tyes";

                        setSelectedLineForModal(
                          contextMenu.line
                        );

                        if (isBatch) {
                          setBatchModalOpen(
                            true
                          );
                        } else {
                          setSerialModalOpen(
                            true
                          );
                        }

                        setContextMenu(
                          null
                        );
                      }}
                    >
                      <FileText className="h-4 w-4" />

                      <span>
                        {String(
                          contextMenu
                            .line
                            .ManBtchNum
                        ).toLowerCase() ===
                          "y" ||
                        String(
                          contextMenu
                            .line
                            .ManBtchNum
                        ).toLowerCase() ===
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
        </TabsContent>

        <TabsContent
          value="attachments"
          className="overflow-hidden mt-0"
        >
          <AttachmentsTab
            attachments={
              attachments
            }
            addAttachment={
              addAttachment
            }
            removeAttachment={
              removeAttachment
            }
            updateAttachment={
              updateAttachment
            }
            isTableDisabled={
              isTableDisabled
            }
          />
        </TabsContent>
      </Tabs>

      <ItemSelectorDialog
        open={dialogOpen}
        onClose={() =>
          setDialogOpen(false)
        }
        onSelectItems={
          handleOnSelectItems
        }
      />

      {selectedLineForModal && (
        <SerialNumberSelectionDialog
          open={serialModalOpen}
          onClose={() => {
            setSerialModalOpen(
              false
            );

            setSelectedLineForModal(
              null
            );
          }}
          onConfirm={(
            selections
          ) => {
            const state =
              useSalesDocument.getState();

            if (
              selections.serials
            ) {
              Object.entries(
                selections.serials
              ).forEach(
                ([
                  itemCode,
                  serials,
                ]) => {
                  state.setLineSerials(
                    itemCode,
                    serials
                  );
                }
              );

              toast.success(
                "Serial numbers allocated successfully"
              );
            }
          }}
          lines={lines}
          initialItemCode={
            selectedLineForModal.ItemCode
          }
        />
      )}

      {selectedLineForModal && (
        <BatchNumberSelectionDialog
          open={batchModalOpen}
          onClose={() => {
            setBatchModalOpen(
              false
            );

            setSelectedLineForModal(
              null
            );
          }}
          onConfirm={(
            selections
          ) => {
            const state =
              useSalesDocument.getState();

            if (
              selections.batches
            ) {
              Object.entries(
                selections.batches
              ).forEach(
                ([
                  itemCode,
                  batches,
                ]) => {
                  state.setLineBatches(
                    itemCode,
                    batches
                  );
                }
              );

              toast.success(
                "Batch numbers allocated successfully"
              );
            }
          }}
          lines={lines}
          initialItemCode={
            selectedLineForModal.ItemCode
          }
        />
      )}
    </div>
  );
}

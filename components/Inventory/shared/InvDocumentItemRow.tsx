"use client";
import { KeyboardEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { InventoryDocumentLine } from "@/types/inventory/inventory.type";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { WarehouseSelectorDialog } from "@/modals/WarehouseSelectorDialog";
import { Warehouse } from "@/types/warehouse/warehouse";
import { fetchItemByCode } from "@/lib/sap/helpers/itemCacheHelper";
import { normalizeInventoryUom } from "@/utils/inventoryUom";
import { getUoMName } from "@/lib/sap/helpers/uomHelper";
import { resolveBranchForWarehouse, resolveBranchName } from "@/lib/sap/helpers/branchHelper";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { useBranchStore } from "@/stores/useBranchStore";

interface Props {
  index: number;
  line: InventoryDocumentLine;
  isGoodIssue?: boolean;
}

export function InvDocumentLineRow({ index, line, isGoodIssue = false }: Props) {
  const { watch } = useFormContext();
  const { updateLine, removeLine } = useInventoryDocument();
  const { warehouses } = useMasterDataStore();
  const { allBranches } = useBranchStore();
  const [draftLine, setDraftLine] = useState<InventoryDocumentLine>(line);
  const [isWhsModalOpen, setIsWhsModalOpen] = useState(false);
  const [whsMode, setWhsMode] = useState<"from" | "to">("from");

  const docStatus = watch("DocStatus") || "bost_Open";
  const isClosed = docStatus === "bost_Close";

  // Fetch QtyInWhs from Item API if not present on the line (e.g. when loading existing documents)
  useEffect(() => {
    if (!line.QtyInWhs || line.QtyInWhs.length === 0) {
      fetchItemByCode(line.ItemCode).then((item) => {
        if (item?.QtyInWhs) {
          const qtyInWhs: any[] = item.QtyInWhs;
          const fromWhs = line.FromWhsCode;
          const whRecord = qtyInWhs.find(
            (w: any) => (w.WarehouseCode || w.warehouseCode) === fromWhs
          );
          const onHand = whRecord ? (whRecord.Qty ?? whRecord.qty ?? 0) : 0;
          updateLine(line.ItemCode, {
            QtyInWhs: qtyInWhs,
            OnHand: onHand,
            ManSerNum: item.ManSerNum,
            ManBtchNum: item.ManBtchNum,
          });
        }
      });
    }
  }, [line.ItemCode]);

  useEffect(() => {
    setDraftLine(line);
  }, [line, index]);

  const saveRow = (updatedLine = draftLine) => {
    updateLine(line.ItemCode, updatedLine);
  };

  const stopEnterSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveRow();
    }
  };

  const handleWhsSelect = (wh: Warehouse) => {
    let updated: InventoryDocumentLine;
    if (whsMode === "from") {
      const qtyInWhs = line.QtyInWhs || [];
      const whRecord = qtyInWhs.find(
        (w: any) => (w.WarehouseCode || w.warehouseCode) === wh.WhsCode
      );
      const whOnHand = whRecord ? (whRecord.Qty ?? whRecord.qty ?? 0) : 0;
      updated = { ...draftLine, FromWhsCode: wh.WhsCode, OnHand: whOnHand };
    } else {
      updated = { ...draftLine, WhsCode: wh.WhsCode, BPLid: wh.BPLid };
    }
    setDraftLine(updated);
    saveRow(updated);
  };

  // Backfill BPLid from the primary (To/single) warehouse for lines that already have one but no branch yet
  useEffect(() => {
    if (line.WhsCode && line.BPLid === undefined) {
      const branchId = resolveBranchForWarehouse(line.WhsCode, warehouses);
      if (branchId !== undefined) {
        updateLine(line.ItemCode, { BPLid: branchId });
      }
    }
  }, [line.WhsCode, line.BPLid, warehouses]);

  return (
    <>
      <td className="py-2 px-2 border-r border-neutral-100/10 text-center w-[60px]">
        <Button
          type="button"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-red-100/10"
          onClick={() => removeLine(index)}
          disabled={isClosed}
        >
          <Trash className={`h-4 w-4 ${isClosed ? "text-gray-500" : "text-red-500"}`} />
        </Button>
      </td>

      {/* Item Code */}
      <td className="py-2 px-4">
        <span className="block w-full truncate font-medium">{line.ItemCode}</span>
      </td>

      {/* Description */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-full"
          value={draftLine.Dscription || ""}
          onChange={(e) => setDraftLine({ ...draftLine, Dscription: e.target.value })}
          onKeyDown={stopEnterSubmit}
          onBlur={() => saveRow()}
        />
      </td>

      {/* From Warehouse */}
      {!isGoodIssue && (
        <td className="py-2 px-4">
          <div className="flex items-center gap-1 w-full">
            <Input
              className="h-6 w-full bg-gray-100 text-gray-500 cursor-not-allowed"
              value={draftLine.FromWhsCode || ""}
              disabled
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                setWhsMode("from");
                setIsWhsModalOpen(true);
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </td>
      )}

      {/* Warehouse (To Warehouse for transfers; single warehouse for Good Issue) */}
      <td className="py-2 px-4">
        <div className="flex items-center gap-1 w-full">
          <Input
            className="h-6 w-full bg-gray-100 text-gray-500 cursor-not-allowed"
            value={draftLine.WhsCode || ""}
            disabled
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => {
              setWhsMode("to");
              setIsWhsModalOpen(true);
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </td>

      {/* Branch (derived from Warehouse) */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-full bg-gray-100 text-gray-500 cursor-not-allowed text-center text-[10px]"
          value={resolveBranchName(draftLine.BPLid, allBranches)}
          disabled
          readOnly
        />
      </td>

      {/* Quantity */}
      <td className="py-2 px-4">
        <Input
          name={`Qty-${index}`}
          className="h-6 w-full text-right"
          type="number"
          step="any"
          min={0}
          value={draftLine.Quantity ?? 0}
          onKeyDown={stopEnterSubmit}
          onChange={(e) => {
            let numericVal = Number(e.target.value);
            if (!isNaN(numericVal)) {
              const updatedLine = { ...draftLine, Quantity: numericVal };
              setDraftLine(updatedLine);
              updateLine(line.ItemCode, updatedLine);
            }
          }}
          onBlur={() => {
            saveRow();
          }}
        />
      </td>

      {/* Qty In Whs */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-full text-right bg-slate-50 cursor-not-allowed"
          type="number"
          step="any"
          value={draftLine.OnHand ?? 0}
          disabled
          readOnly
        />
      </td>

      {/* UoM Code*/}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-full bg-slate-50 cursor-not-allowed"
          value={normalizeInventoryUom(draftLine.UoMCode)}
          disabled
          readOnly
        />
      </td>

        {/* UoM Name*/}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-full bg-slate-50 cursor-not-allowed"
          value={draftLine.MeasureUnit || getUoMName(normalizeInventoryUom(draftLine.UoMCode)) || ""}
          disabled
          readOnly
        />
      </td>

      <WarehouseSelectorDialog
        open={isWhsModalOpen}
        onClose={() => setIsWhsModalOpen(false)}
        onSelect={handleWhsSelect}
        itemCode={line.ItemCode}
        itemQtyInWhs={line.QtyInWhs}
      />
    </>
  );
}

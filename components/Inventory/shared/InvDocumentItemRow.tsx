"use client";
import { KeyboardEvent, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { InventoryDocumentLine } from "@/types/inventory/inventory.type";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { WarehouseSelectorDialog } from "@/modals/WarehouseSelectorDialog";
import { UoMSelectorDialog } from "@/modals/UoMSelectorDialog";
import { Warehouse } from "@/types/warehouse/warehouse";
import { fetchItemByCode } from "@/lib/sap/helpers/itemCacheHelper";
import { normalizeInventoryUom, isManualUom } from "@/utils/inventoryUom";
import { getUoMName } from "@/lib/sap/helpers/uomHelper";
import { resolveBranchForWarehouse, resolveBranchName } from "@/lib/sap/helpers/branchHelper";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { useBranchStore } from "@/stores/useBranchStore";
import { LineUDFCells } from "@/components/shared/LineUDFCells";
import { useInvDocConfig } from "./InvDocumentLayout";
import { usePositiveField } from "@/lib/validation/usePositiveField";
import { useLineFmsAuto } from "@/hooks/useFMS";
import { useApprovalSettings } from "@/hooks/useApprovalSettings";

interface Props {
  index: number;
  line: InventoryDocumentLine;
  isGoodIssue?: boolean;
}

export function InvDocumentLineRow({ index, line, isGoodIssue = false }: Props) {
  const { watch } = useFormContext();
  const updateLine = useInventoryDocument((s) => s.updateLine);
  const removeLine = useInventoryDocument((s) => s.removeLine);
  const fieldAccess = useInventoryDocument((s) => s.fieldAccess);
  const isFieldVisible = (f: string) => fieldAccess.includes(f);
  const warehouses = useMasterDataStore((s) => s.warehouses);
  const allBranches = useBranchStore((s) => s.allBranches);
  const invConfig = useInvDocConfig();
  const [draftLine, setDraftLine] = useState<InventoryDocumentLine>(line);
  const { multiBranchEnabled } = useApprovalSettings();
  const qtyGuard = usePositiveField("Quantity", line.Quantity);
  const [isWhsModalOpen, setIsWhsModalOpen] = useState(false);
  const [whsMode, setWhsMode] = useState<"from" | "to">("from");
  const [uomDialogOpen, setUomDialogOpen] = useState(false);
  const fetchedItemRef = useRef<string | null>(null);
  const bplBackfilledRef = useRef(false);

  const docStatus = watch("DocStatus") || "bost_Open";
  const isClosed = docStatus === "bost_Close";
  const docEntry = watch("DocEntry");
  const isEditMode = Boolean(docEntry && Number(docEntry) > 0);
  const isRowLocked = isClosed || (isGoodIssue && isEditMode);

  // Fetch QtyInWhs from Item API if not present on the line (e.g. when loading existing documents)
  useEffect(() => {
    if (!line.ItemCode) return;
    if (line.QtyInWhs && line.QtyInWhs.length > 0) return;
    if (fetchedItemRef.current === line.ItemCode) return;
    fetchedItemRef.current = line.ItemCode;

    fetchItemByCode(line.ItemCode).then((item) => {
      if (item?.QtyInWhs) {
        const qtyInWhs: any[] = item.QtyInWhs;
        const fromWhs = line.FromWhsCode;
        const whRecord = qtyInWhs.find(
          (w: any) => (w.WarehouseCode || w.warehouseCode || w.WhsCode) === fromWhs
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
  }, [line.ItemCode, line.FromWhsCode, updateLine]);

  useEffect(() => {
    setDraftLine(line);
  }, [
    line.ItemCode,
    line.Dscription,
    line.Quantity,
    line.FromWhsCode,
    line.WhsCode,
    line.BPLid,
    line.OnHand,
    line.UoMCode,
    line.MeasureUnit,
  ]);

  const saveRow = (updatedLine = draftLine) => {
    updateLine(line.ItemCode, updatedLine);
  };

  const patchLine = (patch: Record<string, any>) => {
    const updated = { ...draftLine, ...patch };
    setDraftLine(updated as InventoryDocumentLine);
    updateLine(line.ItemCode, updated);
  };
  useLineFmsAuto(draftLine, patchLine, isClosed);

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
        (w: any) => (w.WarehouseCode || w.warehouseCode || w.WhsCode) === wh.WhsCode
      );
      const whOnHand = whRecord ? (whRecord.Qty ?? whRecord.qty ?? 0) : 0;
      updated = { ...draftLine, FromWhsCode: wh.WhsCode, OnHand: whOnHand };
    } else {
      updated = { ...draftLine, WhsCode: wh.WhsCode, BPLid: wh.BPLid };
    }
    setDraftLine(updated);
    saveRow(updated);
  };

  // Backfill BPLid from warehouse for lines that don't have a branch yet
  useEffect(() => {
    if (!bplBackfilledRef.current && line.ItemCode && line.WhsCode && line.BPLid === undefined && warehouses.length > 0) {
      const branchId = resolveBranchForWarehouse(line.WhsCode, warehouses);
      if (branchId !== undefined) {
        bplBackfilledRef.current = true;
        updateLine(line.ItemCode, { BPLid: branchId });
      }
    }
  }, [line.ItemCode, line.WhsCode, line.BPLid, warehouses, updateLine]);

  return (
    <>
      <td className="py-2 px-2 border-r border-neutral-100/10 text-center w-[60px]">
        <Button
          type="button"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-red-100/10"
          onClick={() => removeLine(index)}
          disabled={isRowLocked}
        >
          <Trash className={`h-4 w-4 ${isRowLocked ? "text-gray-500" : "text-red-500"}`} />
        </Button>
      </td>

      {/* Item Code */}
      {isFieldVisible("ItemCode") && (
      <td className="py-2 px-4">
        <span className="block w-full truncate font-medium">{line.ItemCode}</span>
      </td>
      )}

      {/* Description */}
      {isFieldVisible("Dscription") && (
      <td className="py-2 px-4">
        <Input
          className="h-6 w-full"
          value={draftLine.Dscription || ""}
          onChange={(e) => setDraftLine({ ...draftLine, Dscription: e.target.value })}
          onKeyDown={stopEnterSubmit}
          onBlur={() => saveRow()}
          disabled={isRowLocked}
        />
      </td>
      )}

      {/* From Warehouse */}
      {!isGoodIssue && isFieldVisible("FromWhsCode") && (
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
              disabled={isRowLocked}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </td>
      )}

      {/* Warehouse (To Warehouse for transfers; single warehouse for Good Issue) */}
      {isFieldVisible("WhsCode") && (
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
            disabled={isRowLocked}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </td>
      )}

      {/* Branch (derived from Warehouse) */}
      {multiBranchEnabled && isFieldVisible("BPLid") && (
      <td className="py-2 px-4">
        <Input
          className="h-6 w-full bg-gray-100 text-gray-500 cursor-not-allowed text-center text-[10px]"
          value={resolveBranchName(draftLine.BPLid ?? resolveBranchForWarehouse(draftLine.WhsCode, warehouses), allBranches)}
          disabled
          readOnly
        />
      </td>
      )}

      {/* Quantity */}
      {isFieldVisible("Quantity") && (
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
              qtyGuard.track(numericVal);
              const updatedLine = { ...draftLine, Quantity: numericVal };
              setDraftLine(updatedLine);
              updateLine(line.ItemCode, updatedLine);
            }
          }}
          onBlur={(e) => {
            const { ok, value } = qtyGuard.resolve(e.target.value);
            const finalLine = ok ? draftLine : { ...draftLine, Quantity: value };
            if (!ok) setDraftLine(finalLine);
            saveRow(finalLine);
          }}
          disabled={isRowLocked}
        />
      </td>
      )}

      {/* Qty In Whs */}
      {isFieldVisible("OnHand") && (
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
      )}

      {/* UoM Code*/}
      {isFieldVisible("UoMCode") && (
      <td className="py-2 px-4">
        <div className="flex items-center gap-1">
          <Input
            className="h-6 w-full bg-slate-50 cursor-not-allowed"
            value={normalizeInventoryUom(draftLine.UoMCode)}
            disabled
            readOnly
          />
          {!isManualUom(draftLine.UoMCode) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setUomDialogOpen(true)}
              disabled={isRowLocked}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
      )}

        {/* UoM Name*/}
      {isFieldVisible("MeasureUnit") && (
      <td className="py-2 px-4">
        <Input
          className="h-6 w-full bg-slate-50 cursor-not-allowed"
          value={draftLine.MeasureUnit || getUoMName(normalizeInventoryUom(draftLine.UoMCode)) || ""}
          disabled
          readOnly
        />
      </td>
      )}

      <LineUDFCells
        docType={invConfig.type}
        line={draftLine}
        disabled={isRowLocked}
        fmsContext={Object.fromEntries(
          Object.entries(draftLine)
            .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
            .map(([k, v]) => [k, String(v)])
        )}
        onPatch={patchLine}
        allowedFields={fieldAccess}
      />

      <WarehouseSelectorDialog
        open={isWhsModalOpen}
        onClose={() => setIsWhsModalOpen(false)}
        onSelect={handleWhsSelect}
        itemCode={line.ItemCode}
        itemQtyInWhs={line.QtyInWhs}
      />

      <UoMSelectorDialog
        open={uomDialogOpen}
        onClose={() => setUomDialogOpen(false)}
        onSelect={(uom) => {
          patchLine({ UoMCode: uom.Code, MeasureUnit: uom.Name });
        }}
      />
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { GenericModal } from "@/modals/GenericModal";
import { getwarehouses } from "@/api+/sap/master-data/warehouses";
import { Warehouse } from "@/types/warehouse/warehouse";
import { getBOMList } from "@/api+/sap/production/productionService";
import { Trash } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { PRDDocumentLine } from "@/types/production/PRDDoc.type";
import { getUoMName } from "@/lib/sap/helpers/uomHelper";

interface Props {
  index: number;
  line: PRDDocumentLine;
  warehouses: Warehouse[];
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePRDDocConfig } from "./PRDDocumentLayout";

export function IFPRDDocumentLineRow({ index, line, warehouses }: Props) {
  const { watch } = useFormContext();
  const { updateLine, removeLine, initialStatus } = useIFPRDDocument();
  const [draftLine, setDraftLine] = useState<PRDDocumentLine>(line);
  const config = usePRDDocConfig();
  const headerPlannedQty = watch("PlannedQuantity");

  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);

  useEffect(() => {
    setDraftLine(line);
  }, [line, index]);

  const saveRow = () => {
    updateLine(index, draftLine);
  };

  return (
    <>
      {config.itemColumns.actions && (
        <td className="w-[50px]">
          <Button
            type="button"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => removeLine(index)}
            disabled={initialStatus === "boposClosed" || (config.type === 202 && Boolean(watch("AbsoluteEntry") && Number(watch("AbsoluteEntry")) > 0)) || (config.type === 60 && Boolean(watch("DocEntry") && Number(watch("DocEntry")) > 0)) || (config.type === 59 && Boolean(watch("DocEntry") && Number(watch("DocEntry")) > 0))}
          >
            <Trash className={`h-5 w-5 ${initialStatus === "boposClosed" || (config.type === 202 && Boolean(watch("AbsoluteEntry") && Number(watch("AbsoluteEntry")) > 0)) || (config.type === 60 && Boolean(watch("DocEntry") && Number(watch("DocEntry")) > 0)) || (config.type === 59 && Boolean(watch("DocEntry") && Number(watch("DocEntry")) > 0)) ? "text-gray-400" : "text-red-500"}`} />
          </Button>
        </td>
      )}

      {config.itemColumns.orderNumber && (
        <td className="py-2 px-4 text-center">
          <span className="block w-full truncate font-medium text-gray-700">{line.OrderNumber}</span>
        </td>
      )}

      {config.itemColumns.type && (
        <td className="py-2 px-4">
          <span className="block w-full truncate font-medium text-gray-700">{line.ItemType?.replace(/^[pd]it_/, "")}</span>
        </td>
      )}

      {config.itemColumns.itemCode && (
        <td className="py-2 px-4">
          <span className="block w-full truncate font-medium text-gray-700">{line.ItemNo}</span>
        </td>
      )}

      {config.itemColumns.itemDescription && (
        <td className="py-2 px-4 min-w-0" title={line.ItemName}>
          <span className="block w-full truncate font-medium text-gray-700">{line.ItemName}</span>
        </td>
      )}

      {config.itemColumns.baseQty && (
        <td className="py-2 px-4 text-center">
          <Input
            type="number"
            min={0}
            name={`BaseQty-${index}`}
            value={draftLine.BaseQuantity ?? 0}
            onChange={(e) => {
              let numericVal = Number(e.target.value);
              if (isNaN(numericVal)) return;

              const parentQty = (draftLine as any).BOMHeaderQty || 1;
              const newBaseRatio = numericVal / parentQty;

              const updatedLine = {
                ...draftLine,
                BaseQuantity: numericVal,
                BaseRatio: newBaseRatio,
                PlannedQuantity: newBaseRatio * headerPlannedQty,
              };

              setDraftLine(updatedLine);
              updateLine(index, updatedLine);
            }}
            onBlur={() => {
              saveRow();
            }}
            disabled={initialStatus === "boposClosed"}
            className="h-7 w-full font-medium text-gray-700 text-center"
          />
        </td>
      )}

      {config.itemColumns.baseRatio && (
        <td className="py-2 px-4 text-center">
          <span className="block w-full truncate font-medium text-gray-700">{Number(draftLine.BaseRatio ?? 0).toLocaleString()}</span>
        </td>
      )}

      {config.itemColumns.plannedQty && (
        <td className="py-2 px-4 text-center">
          {config.itemColumns.openQty ? (
            <span className="font-medium text-gray-700">{Number(line.OriginalPlannedQuantity ?? line.PlannedQuantity).toLocaleString()}</span>
          ) : (
            <Input
              type="number"
              min={0}
              name={`PlannedQty-${index}`}
              className="h-7 w-full text-center border-zinc-300"
              value={draftLine.PlannedQuantity ?? 0}
              onChange={(e) => {
                let numericVal = Number(e.target.value);
                if (isNaN(numericVal)) return;

                const updated = { ...draftLine, PlannedQuantity: numericVal };
                setDraftLine(updated);
                updateLine(index, updated);
              }}
              onBlur={() => {
                saveRow();
              }}
              disabled={initialStatus === "boposClosed"}
            />
          )}
        </td>
      )}

      {config.itemColumns.issued && (
        <td className="py-2 px-4 text-center text-gray-700">
          <span className="block w-full truncate">{line.IssuedQuantity || 0}</span>
        </td>
      )}

      {config.itemColumns.openQty && (
        <td className="py-2 px-4 text-center">
          <Input
            type="number"
            min={0}
            name={`OpenQty-${index}`}
            className="h-7 w-full text-center border-zinc-300"
            value={draftLine.PlannedQuantity ?? 0}
            onChange={(e) => {
              let numericVal = Number(e.target.value);
              if (isNaN(numericVal)) return;

              const updated = { ...draftLine, PlannedQuantity: numericVal };
              setDraftLine(updated);
              updateLine(index, updated);
            }}
            onBlur={() => {
              saveRow();
            }}
            disabled={initialStatus === "boposClosed"}
          />
        </td>
      )}

      {config.itemColumns.uomCode && (
        <td className="py-2 px-4 text-center text-gray-700">
          <span className="block w-full truncate">{getUoMName(line.UoMCode)}</span>
        </td>
      )}

      {config.itemColumns.warehouse && (
        <td className="py-2 px-4 text-center text-gray-700">
          <div className="flex w-full items-center gap-1">
            <Input
              className="h-7 min-w-0 flex-1 text-xs bg-gray-100 text-gray-500 cursor-not-allowed"
              value={draftLine.Warehouse || ""}
              disabled
              readOnly
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7 cursor-pointer"
              onClick={() => setWarehouseModalOpen(true)}
              disabled={initialStatus === "boposClosed"}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </td>
      )}

      {config.itemColumns.issueMethod && (
        <td className="py-2 px-4">
          <Select
            value={draftLine.ProductionOrderIssueType || "im_Manual"}
            onValueChange={(val: "im_Manual" | "im_Backflush") => {
              const updatedLine = { ...draftLine, ProductionOrderIssueType: val };
              setDraftLine(updatedLine);
              updateLine(index, updatedLine);
            }}
            disabled={initialStatus === "boposClosed"}
          >
            <SelectTrigger className="h-7 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="im_Manual">Manual</SelectItem>
              <SelectItem value="im_Backflush">Backflush</SelectItem>
            </SelectContent>
          </Select>
        </td>
      )}

      <GenericModal
        title="Select Warehouse"
        open={warehouseModalOpen}
        onClose={() => setWarehouseModalOpen(false)}
        onSelect={(val) => {
          const updated = { ...draftLine, Warehouse: val };
          setDraftLine(updated);
          updateLine(index, updated);
        }}
        data={warehouses || []}
        columns={[
          { key: "WhsCode", label: "Code" },
          { key: "WhsName", label: "Name" },
        ]}
        getSelectValue={(item) => item.WhsCode}
      />
    </>
  );
}

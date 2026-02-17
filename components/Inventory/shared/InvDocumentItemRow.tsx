"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { InventoryDocumentLine } from "@/types/inventory/inventory.type";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { WarehouseSelectorDialog } from "@/modals/WarehouseSelectorDialog";
import { Warehouse } from "@/types/warehouse/warehouse";

interface Props {
  index: number;
  line: InventoryDocumentLine;
}

export function InvDocumentLineRow({ index, line }: Props) {
  const { watch } = useFormContext();
  const { updateLine, removeLine } = useInventoryDocument();
  const [draftLine, setDraftLine] = useState<InventoryDocumentLine>(line);
  const [isWhsModalOpen, setIsWhsModalOpen] = useState(false);
  const [whsMode, setWhsMode] = useState<"from" | "to">("from");
  const [localQty, setLocalQty] = useState<string>((line.Quantity || 0).toString());
  const [localPrice, setLocalPrice] = useState<string>((line.ItemCost || 0).toString());

  useEffect(() => {
    setDraftLine(line);
    if (document.activeElement?.getAttribute('name') !== `Qty-${index}`) {
      setLocalQty((line.Quantity || 0).toLocaleString());
    }
    if (document.activeElement?.getAttribute('name') !== `Price-${index}`) {
      setLocalPrice((line.ItemCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  }, [line, index]);

  const saveRow = (updatedLine = draftLine) => {
    updateLine(line.ItemCode, updatedLine);
  };

  const handleWhsSelect = (wh: Warehouse) => {
    let updated;
    if (whsMode === "from") {
      updated = { ...draftLine, FromWhsCode: wh.WhsCode };
    } else {
      updated = { ...draftLine, WhsCode: wh.WhsCode };
    }
    setDraftLine(updated);
    saveRow(updated);
  };

  return (
    <>
      {/* Item Code */}
      <td className="py-2 px-4">
        <span className="font-medium">{line.ItemCode}</span>
      </td>

      {/* Description */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-full"
          value={draftLine.Dscription || ""}
          onChange={(e) => setDraftLine({ ...draftLine, Dscription: e.target.value })}
          onBlur={() => saveRow()}
        />
      </td>

      {/* From Warehouse */}
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

      {/* To Warehouse */}
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

      {/* Quantity */}
      <td className="py-2 px-4">
        <Input
          name={`Qty-${index}`}
          className="h-6 w-full text-right"
          type="text"
          value={localQty}
          onChange={(e) => {
            const val = e.target.value;
            setLocalQty(val);
            const numericVal = Number(val.replace(/,/g, ""));
            if (!isNaN(numericVal)) {
              setDraftLine({ ...draftLine, Quantity: numericVal });
              updateLine(line.ItemCode, { ...draftLine, Quantity: numericVal });
            }
          }}
          onBlur={() => {
            setLocalQty((draftLine.Quantity || 0).toLocaleString());
            saveRow();
          }}
        />
      </td>

      {/* Unit Price */}
      <td className="py-2 px-4">
        <Input
          name={`Price-${index}`}
          className="h-6 w-full text-right"
          type="text"
          value={localPrice}
          onChange={(e) => {
            const val = e.target.value;
            setLocalPrice(val);
            const numericVal = Number(val.replace(/,/g, ""));
            if (!isNaN(numericVal)) {
              setDraftLine({ ...draftLine, ItemCost: numericVal });
              updateLine(line.ItemCode, { ...draftLine, ItemCost: numericVal });
            }
          }}
          onBlur={() => {
            setLocalPrice((draftLine.ItemCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            saveRow();
          }}
        />
      </td>

      {/* UoM Code */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-full bg-slate-50 cursor-not-allowed"
          value={draftLine.UomCode || ""}
          disabled
          readOnly
        />
      </td>

      {/* Delete button */}
      <td>
        <Button
          type="button"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => removeLine(line.ItemCode)}
          disabled={Boolean(watch("DocEntry") && watch("DocEntry") > 0)}
        >
          <Trash className={`h-5 w-5 ${watch("DocEntry") && watch("DocEntry") > 0 ? "text-gray-400" : "text-red-500"}`} />
        </Button>
      </td>

      <WarehouseSelectorDialog
        open={isWhsModalOpen}
        onClose={() => setIsWhsModalOpen(false)}
        onSelect={handleWhsSelect}
      />
    </>
  );
}

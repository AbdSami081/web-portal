"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash } from "lucide-react";
import { InventoryDocumentLine } from "@/types/inventory/inventory.type";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { PRDDocumentLine } from "@/types/production/PRDDoc.type";

interface Props {
  index: number;
  line: PRDDocumentLine;
}

export function IFPRDDocumentLineRow({ index, line }: Props) {
  const { updateLine, removeLine } = useIFPRDDocument();
  const [draftLine, setDraftLine] = useState<PRDDocumentLine>(line);

  useEffect(() => {
    setDraftLine(line);
  }, [line]);

  const saveRow = () => {
    updateLine(line.ItemNo, draftLine);
  };

  return (
    <> 

    {/* Item Type */}
    <td className="py-2 px-4">
        <span className="font-medium">{line.ItemType}</span>
    </td>

    {/* Item Code */}
    <td className="py-2 px-4">
        <span className="font-medium">{line.ItemNo}</span>
    </td>

    {/* Discription */}
    <td className="py-2 px-4">
        <span className="font-medium">{line.ItemName}</span>
    </td>
      
    {/* Quantity */}
    <td className="py-2 px-4">
    <Input type="number"
        className="h-6 w-32"
        value={draftLine.PlannedQuantity || ""}
        onChange={(e) => setDraftLine({ ...draftLine, PlannedQuantity: Number(e.target.value) })}
        onBlur={saveRow}
    />
    </td>

    {/* WhseCode */}
    <td className="py-2 px-4">
        <span className="font-medium">{line.Warehouse}</span>
    </td>

     <td>
      <Button type="button" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeLine(line.ItemNo)}>
        <Trash className="h-5 w-5 text-red-500" />
      </Button>
    </td>
    </>
  );
}

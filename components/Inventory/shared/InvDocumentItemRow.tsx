"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash } from "lucide-react";
import { InventoryDocumentLine } from "@/types/inventory/inventory.type";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";

interface Props {
  index: number;
  line: InventoryDocumentLine;
}

export function InvDocumentLineRow({ index, line }: Props) {
  const { updateLine, removeLine } = useInventoryDocument();
  const [draftLine, setDraftLine] = useState<InventoryDocumentLine>(line);

  useEffect(() => {
    setDraftLine(line);
  }, [line]);

  const saveRow = () => {
    updateLine(line.ItemCode, draftLine);
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
          className="h-6 w-32"
          value={draftLine.Dscription || ""}
          onChange={(e) => setDraftLine({ ...draftLine, Dscription: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* From Warehouse */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-24"
          value={draftLine.FromWhsCode || ""}
          onChange={(e) => setDraftLine({ ...draftLine, FromWhsCode: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* From Bin */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-24"
          value={draftLine.FromBinLoc || ""}
          onChange={(e) => setDraftLine({ ...draftLine, FromBinLoc: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* To Warehouse */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-24"
          value={draftLine.WhsCode || ""}
          onChange={(e) => setDraftLine({ ...draftLine, WhsCode: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* To Bin */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-24"
          value={draftLine.ToBinLoc || ""}
          onChange={(e) => setDraftLine({ ...draftLine, ToBinLoc: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* First To Bin */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-24"
          value={draftLine.FisrtBin || ""}
          onChange={(e) => setDraftLine({ ...draftLine, FisrtBin: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* Quantity */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20 text-right"
          type="number"
          value={draftLine.Quantity}
          onChange={(e) => setDraftLine({ ...draftLine, Quantity: Number(e.target.value) })}
          onBlur={saveRow}
        />
      </td>

      {/* Item Cost */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20 text-right"
          type="number"
          value={draftLine.ItemCost || 0}
          onChange={(e) => setDraftLine({ ...draftLine, ItemCost: Number(e.target.value) })}
          onBlur={saveRow}
        />
      </td>

      {/* UoM Code */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20"
          value={draftLine.UomCode || ""}
          onChange={(e) => setDraftLine({ ...draftLine, UomCode: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* Unit Measure */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20"
          value={draftLine.unitMsr || ""}
          onChange={(e) => setDraftLine({ ...draftLine, unitMsr: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* COGS Fields */}
      <td className="py-2 px-4">
        <div className="relative">
          <Input
            className="h-6 w-20"
            value={draftLine.OcrCode2 || ""}
            onChange={(e) => setDraftLine({ ...draftLine, OcrCode2: e.target.value })}
            onBlur={saveRow}
          />
        </div>
      </td>

      <td className="py-2 px-4">
        <div className="relative">
          <Input
            className="h-6 w-20"
            value={draftLine.OcrCode3 || ""}
            onChange={(e) => setDraftLine({ ...draftLine, OcrCode3: e.target.value })}
            onBlur={saveRow}
          />
        </div>
      </td>

      <td className="py-2 px-4">
        <div className="relative">
          <Input
            className="h-6 w-20"
            value={draftLine.OcrCode4 || ""}
            onChange={(e) => setDraftLine({ ...draftLine, OcrCode4: e.target.value })}
            onBlur={saveRow}
          />
        </div>
      </td>

      {/* Recycled Plastic Weight */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20 text-right"
          type="number"
          value={draftLine.PlPaWght || 0}
          onChange={(e) => setDraftLine({ ...draftLine, PlPaWght: Number(e.target.value) })}
          onBlur={saveRow}
        />
      </td>

      {/* Last Price */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20 text-right"
          type="number"
          value={draftLine.U_LastPrice || 0}
          onChange={(e) => setDraftLine({ ...draftLine, U_LastPrice: Number(e.target.value) })}
          onBlur={saveRow}
        />
      </td>

      {/* Plastic Tax Reason */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20"
          value={draftLine.PPTaxExRe || ""}
          onChange={(e) => setDraftLine({ ...draftLine, PPTaxExRe: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* QC Document */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20"
          value={draftLine.U_OQCR || ""}
          onChange={(e) => setDraftLine({ ...draftLine, U_OQCR: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* QC Document */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20"
          value={draftLine.U_OQDC || ""}
          onChange={(e) => setDraftLine({ ...draftLine, U_OQDC: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* Last Price */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20 text-right"
          type="number"
          value={draftLine.U_LPP2 || 0}
          onChange={(e) => setDraftLine({ ...draftLine, U_LPP2: Number(e.target.value) })}
          onBlur={saveRow}
        />
      </td>

      {/* FBR Qty */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20 text-right"
          type="number"
          value={draftLine.U_FBRQty || 0}
          onChange={(e) => setDraftLine({ ...draftLine, U_FBRQty: Number(e.target.value) })}
          onBlur={saveRow}
        />
      </td>

      {/* Sale Type */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20"
          value={draftLine.U_SaleType || ""}
          onChange={(e) => setDraftLine({ ...draftLine, U_SaleType: e.target.value })}
          onBlur={saveRow}
        />
      </td>

      {/* Further Tax */}
      <td className="py-2 px-4">
        <Input
          className="h-6 w-20"
          value={draftLine.U_FurtherTax || 0}
          onChange={(e) => setDraftLine({ ...draftLine, U_FurtherTax: Number(e.target.value) })}
          onBlur={saveRow}
        />
      </td>

      {/* Delete button */}
        <td>
            <Button type="button" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeLine(line.ItemCode)}>
            <Trash className="h-5 w-5 text-red-500" />
            </Button>
        </td>
    </>
  );
}

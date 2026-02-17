"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { GenericModal } from "@/modals/GenericModal";
import { getwarehouses } from "@/api+/sap/master-data/warehouses";
import { Warehouse } from "@/types/warehouse/warehouse";
import { getBOMList } from "@/api+/sap/production/productionService"; // Using BOM list for item search for now, or should it be item master? Usually item master.
// For now, let's assume item search isn't explicitly requested for *search* but "modal open ka button bi dena serach ki trha same as inventory lines" likely refers to Warehouse.
// "warehouse ko enable kro dropdown aega or warehouse fill krwaow or modal open ka button bi dena serach ki trha same as inventory lines" -> This definitely applies to Warehouse.
// "line k andr ... (no mention of item search, wait) ... modal open ka button bi dena serach ki trha same as inventory lines" 
// Re-reading: "warehouse ko enable kro dropdown aega or warehouse fill krwaow or modal open ka button bi dena serach ki trha same as inventory lines"
// It seems the modal is for Warehouse.
// But usually lines have Item search too. The user said "line k andr or header k andr description ko disbale kro ...".
// Let's stick to Warehouse modal for now as explicitly requested.
import { Trash } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { PRDDocumentLine } from "@/types/production/PRDDoc.type";

interface Props {
  index: number;
  line: PRDDocumentLine;
  warehouses: Warehouse[];
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePRDDocConfig } from "./PRDDocumentLayout";

export function IFPRDDocumentLineRow({ index, line, warehouses }: Props) {
  const { watch } = useFormContext();
  const { updateLine, removeLine } = useIFPRDDocument();
  const [draftLine, setDraftLine] = useState<PRDDocumentLine>(line);
  const config = usePRDDocConfig();
  const headerPlannedQty = watch("PlannedQuantity");

  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [baseQtyInput, setBaseQtyInput] = useState<string>((line.BaseQuantity ?? 0).toString());
  const [plannedQtyInput, setPlannedQtyInput] = useState<string>((line.PlannedQuantity ?? 0).toString());

  useEffect(() => {
    setDraftLine(line);
    // Only update input if it's not currently being edited or focused? 
    // Actually, simple way: only update if value changed externally.
    if (document.activeElement?.getAttribute('name') !== `BaseQty-${index}`) {
      setBaseQtyInput((line.BaseQuantity ?? 0).toLocaleString());
    }
    if (document.activeElement?.getAttribute('name') !== `PlannedQty-${index}`) {
      setPlannedQtyInput((line.PlannedQuantity ?? 0).toLocaleString());
    }
  }, [line, index]);

  const saveRow = () => {
    updateLine(line.ItemNo, draftLine);
  };

  return (
    <>
      {config.itemColumns.type && (
        <td className="py-2 px-4">
          <span className="font-medium text-gray-700">{line.ItemType}</span>
        </td>
      )}

      {config.itemColumns.itemCode && (
        <td className="py-2 px-4">
          <span className="font-medium text-gray-700">{line.ItemNo}</span>
        </td>
      )}

      {config.itemColumns.itemDescription && (
        <td className="py-2 px-4">
          <span className="font-medium text-gray-700">{line.ItemName}</span>
        </td>
      )}

      {config.itemColumns.baseQty && (
        <td className="py-2 px-4 text-center">
          <Input
            type="text"
            name={`BaseQty-${index}`}
            value={baseQtyInput}
            onChange={(e) => {
              const val = e.target.value;
              setBaseQtyInput(val);

              const numericVal = Number(val.replace(/,/g, ""));
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
              updateLine(line.ItemNo, updatedLine);
            }}
            onBlur={() => {
              setBaseQtyInput((draftLine.BaseQuantity ?? 0).toLocaleString());
              saveRow();
            }}
            className="font-medium text-gray-700 text-center"
          />
        </td>
      )}

      {config.itemColumns.baseRatio && (
        <td className="py-2 px-4 text-center">
          <span className="font-medium text-gray-700">{Number(draftLine.BaseRatio ?? 0).toLocaleString()}</span>
        </td>
      )}

      {config.itemColumns.plannedQty && (
        <td className="py-2 px-4">
          <Input
            type="text"
            name={`PlannedQty-${index}`}
            className="h-7 w-24 text-center border-zinc-300"
            value={plannedQtyInput}
            onChange={(e) => {
              const val = e.target.value;
              setPlannedQtyInput(val);

              const numericVal = Number(val.replace(/,/g, ""));
              if (isNaN(numericVal)) return;

              const updated = { ...draftLine, PlannedQuantity: numericVal };
              setDraftLine(updated);
              updateLine(line.ItemNo, updated);
            }}
            onBlur={() => {
              setPlannedQtyInput((draftLine.PlannedQuantity || 0).toLocaleString());
              saveRow();
            }}
          />
        </td>
      )}

      {config.itemColumns.issued && (
        <td className="py-2 px-4 text-center text-gray-700">
          <span>{line.IssuedQuantity || 0}</span>
        </td>
      )}

      {config.itemColumns.available && (
        <td className="py-2 px-4 text-center text-gray-700">
          <span>{line.AvailableQuantity || 0}</span>
        </td>
      )}

      {config.itemColumns.uomCode && (
        <td className="py-2 px-4 text-center text-gray-700">
          <span>{line.UoMCode}</span>
        </td>
      )}

      {config.itemColumns.warehouse && (
        <td className="py-2 px-4 text-center text-gray-700">
          <div className="flex items-center gap-1">
            <Input
              className="h-7 w-28 text-xs bg-gray-100 text-gray-500 cursor-not-allowed"
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
              updateLine(line.ItemNo, updatedLine);
            }}
          >
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="im_Manual">Manual</SelectItem>
              <SelectItem value="im_Backflush">Backflush</SelectItem>
            </SelectContent>
          </Select>
        </td>
      )}

      {config.itemColumns.actions && (
        <td>
          <Button
            type="button"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => removeLine(line.ItemNo)}
            disabled={Boolean(watch("AbsoluteEntry") && Number(watch("AbsoluteEntry")) > 0)}
          >
            <Trash className={`h-5 w-5 ${watch("AbsoluteEntry") && Number(watch("AbsoluteEntry")) > 0 ? "text-gray-400" : "text-red-500"}`} />
          </Button>
        </td>
      )}
      <GenericModal
        title="Select Warehouse"
        open={warehouseModalOpen}
        onClose={() => setWarehouseModalOpen(false)}
        onSelect={(val) => {
          const updated = { ...draftLine, Warehouse: val };
          setDraftLine(updated);
          updateLine(line.ItemNo, updated);
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

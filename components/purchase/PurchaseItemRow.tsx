import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Trash, Search } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { WarehouseSelectorDialog } from "@/modals/WarehouseSelectorDialog";
import { GenericModal } from "@/modals/GenericModal";
import { distribtionLstOCRCO2, distribtionLstOCRCO3, distribtionLstOCRCO4 } from "@/app/data/cogsData";
import { calculateFreightTax, calculateLineTax } from "@/utils/taxCalculations";
import { PurchaseDocumentLine } from "@/types/purchase/purchaseDocuments.type";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { usePurchaseDocConfig } from "./PurchaseDocumentLayout";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";
import { isPostedPurchaseDocType } from "@/lib/sap/helpers/postedDocumentHelper";
import { resolveBranchForWarehouse, resolveBranchName } from "@/lib/sap/helpers/branchHelper";
import { useBranchStore } from "@/stores/useBranchStore";
import { LineUDFCells } from "@/components/shared/LineUDFCells";

interface Props {
  index: number;
  line: PurchaseDocumentLine;
}

interface Record {
  Code: string;
  Name: string;
}

export function PurchaseItemRow({ index, line }: Props) {
  const { watch } = useFormContext();
  const { updateLineByIndex, removeLine } = usePurchaseDocument();
  const { freightsWithCharges, freightTypes, warehouses } = useMasterDataStore();
  const { allBranches } = useBranchStore();
  const config = usePurchaseDocConfig();

  const isFinancialPurchaseDoc = isPostedPurchaseDocType(config.type);

  const docEntry = watch("DocEntry");
  const isEditMode = Boolean(docEntry && Number(docEntry) > 0);
  const isLineClosed = line.IsClosed === "tYES";
  const isLineUpdateBlocked = isFinancialPurchaseDoc && isEditMode;
  const isLineDisabled = isLineClosed || isLineUpdateBlocked;

  const isFieldEnabled = (fieldName: string) => {
    return getFieldSettings(config.type, "linesFieds", fieldName).enable !== false && !isLineDisabled;
  };

  const isFieldVisible = (fieldName: string) => {
    return getFieldSettings(config.type, "linesFieds", fieldName).visible !== false;
  };

  const [draftLine, setDraftLine] = useState(line);
  const [whDialogOpen, setWhDialogOpen] = useState(false);
  const [cogsModalOpen, setCogsModalOpen] = useState(false);
  const [activeField, setActiveField] = useState<"CogsOcrCo2" | "CogsOcrCo3" | "CogsOcrCo4">("CogsOcrCo2");
  const [cogsData, setCogsData] = useState<Record[]>([]);

  useEffect(() => {
    setDraftLine(line);
  }, [line, index]);

  // Backfill BPLid for lines that already have a warehouse but no branch yet (e.g. loaded documents).
  // Must target this row's own index: updateLine(ItemCode) would hit the wrong row (or
  // ping-pong forever) when two lines share the same item code.
  useEffect(() => {
    if (line.WarehouseCode && line.BPLid === undefined) {
      const branchId = resolveBranchForWarehouse(line.WarehouseCode, warehouses);
      if (branchId !== undefined) {
        updateLineByIndex(index, { BPLid: branchId });
      }
    }
  }, [line.WarehouseCode, line.BPLid, warehouses, index]);

  useEffect(() => {
    calculateAndUpdate(draftLine);
  }, [
    draftLine.Quantity,
    draftLine.Price,
    draftLine.DiscountPercent,
    draftLine.TaxCode,
    draftLine.ItemCode,
    draftLine.Freight1LCAmount,
    draftLine.Freight1TaxGroup,
    draftLine.Freight2LCAmount,
    draftLine.Freight2TaxGroup,
    draftLine.Freight3LCAmount,
    draftLine.Freight3TaxGroup,
    freightsWithCharges,
  ]);

  const calculateAndUpdate = (lineData: PurchaseDocumentLine) => {
    const quantity = Number(lineData.Quantity) || 0;
    const price = Number(lineData.Price) || 0;
    const discount = Number(lineData.DiscountPercent) || 0;

    const selectedTax = freightsWithCharges.find(t => (t.Code || (t as any).code) === lineData.TaxCode);
    let itemTaxRate = Number(selectedTax?.Rate || 0);

    const subtotal = quantity * price;
    const discounted = subtotal * (1 - discount / 100);
    const itemTax = (discounted * itemTaxRate) / 100;

    const f1 = calculateFreightTax(Number(lineData.Freight1LCAmount || 0), lineData.Freight1TaxGroup || "", freightsWithCharges);
    const f2 = calculateFreightTax(Number(lineData.Freight2LCAmount || 0), lineData.Freight2TaxGroup || "", freightsWithCharges);
    const f3 = calculateFreightTax(Number(lineData.Freight3LCAmount || 0), lineData.Freight3TaxGroup || "", freightsWithCharges);

    const totalTax = itemTax + f1.taxAmount + f2.taxAmount + f3.taxAmount;

    const updatedLine = {
      ...lineData,
      TaxRate: itemTaxRate,
      Freight1TaxRate: f1.rate,
      Freight1TaxLCAmount: f1.taxAmount,
      Freight2TaxRate: f2.rate,
      Freight2TaxLCAmount: f2.taxAmount,
      Freight3TaxRate: f3.rate,
      Freight3TaxLCAmount: f3.taxAmount,
      TaxAmount: Number(totalTax.toFixed(2)),
      LineTotal: Number((discounted + totalTax).toFixed(2)),
    };

    updateLineByIndex(index, updatedLine);
  };

  const openCogsModal = (field: "CogsOcrCo2" | "CogsOcrCo3" | "CogsOcrCo4") => {
    setActiveField(field);
    setCogsData(
      field === "CogsOcrCo2"
        ? distribtionLstOCRCO2
        : field === "CogsOcrCo3"
          ? distribtionLstOCRCO3
          : distribtionLstOCRCO4
    );
    setCogsModalOpen(true);
  };

  return (
    <>
      <td className="py-1 px-2 border-r border-neutral-200 text-center w-[40px]">
        <Button
          type="button"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-red-100/10"
          onClick={() => removeLine(line.ItemCode)}
          disabled={isLineDisabled}
          title={isLineUpdateBlocked ? "Lines cannot be removed on financial documents in update mode" : isLineClosed ? "Line is closed" : "Remove line"}
        >
          <Trash
            className={`h-4 w-4 ${
              isLineDisabled
                ? "text-gray-400"
                : "text-red-500"
            }`}
          />
        </Button>
      </td>

      {isFieldVisible("ItemCode") && (
        <td className="px-2 py-1 w-[120px] truncate">
          <span className="font-medium">{line.ItemCode}</span>
        </td>
      )}

      {isFieldVisible("ItemName") && (
        <td className="px-2 py-1 w-[220px]">
          <span className="block text-left truncate">{draftLine.ItemName}</span>
        </td>
      )}

      {isFieldVisible("Quantity") && (
        <td className="w-[90px]">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            value={draftLine.Quantity}
            onChange={(e) =>
              setDraftLine({ ...draftLine, Quantity: Number(e.target.value) })
            }
            disabled={!isFieldEnabled("Quantity")}
          />
        </td>
      )}

      {isFieldVisible("OnHand") && (
        <td className="w-[90px]">
          <Input
            className="h-6 w-full text-right bg-neutral-100"
            type="number"
            value={draftLine.OnHand ?? 0}
            disabled
            readOnly
          />
        </td>
      )}

      {isFieldVisible("Price") && (
        <td className="w-[110px]">
          <Input
            className="h-6 w-full text-right"
            type="number"
            value={draftLine.Price}
            onChange={(e) =>
              setDraftLine({ ...draftLine, Price: Number(e.target.value) })
            }
            disabled={!isFieldEnabled("Price")}
          />
        </td>
      )}

      {isFieldVisible("DiscountPercent") && (
        <td className="w-[90px]">
          <Input
            className="h-6 w-full text-right"
            type="number"
            min={0}
            max={100}
            value={draftLine.DiscountPercent || 0}
            onChange={(e) =>
              setDraftLine({
                ...draftLine,
                DiscountPercent: Math.min(100, Number(e.target.value)),
              })
            }
            disabled={!isFieldEnabled("DiscountPercent")}
          />
        </td>
      )}

      {isFieldVisible("TaxCode") && (
        <td className="w-[140px]">
          <Select
            value={draftLine.TaxCode || ""}
            disabled={!isFieldEnabled("TaxCode")}
            onValueChange={(val) =>
              setDraftLine({ ...draftLine, TaxCode: val })
            }
          >
            <SelectTrigger className="h-6 w-full text-xs">
              <SelectValue placeholder="Tax" />
            </SelectTrigger>
            <SelectContent>
              {freightsWithCharges?.map((grp: any) => {
                const code = grp.Code || grp.code;
                const name = grp.Name || grp.name;
                return (
                  <SelectItem key={code} value={code} className="text-xs">
                    {code} - {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </td>
      )}

      {isFieldVisible("TaxAmount") && (
        <td className="w-[100px]">
          <Input
            className="h-6 w-full text-right bg-neutral-100"
            value={calculateLineTax(
              Number(draftLine.Quantity) || 0,
              Number(draftLine.Price) || 0,
              Number(draftLine.DiscountPercent) || 0,
              Number(draftLine.TaxRate) || 0
            )}
            disabled
            readOnly
          />
        </td>
      )}

      {isFieldVisible("WarehouseCode") && (
        <td className="w-[120px]">
          <div className="flex items-center gap-1">
            <Input
              className="h-6 w-full bg-gray-100 text-center text-xs"
              value={draftLine.WarehouseCode || ""}
              disabled
              readOnly
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setWhDialogOpen(true)}
              disabled={!isFieldEnabled("WarehouseCode")}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </td>
      )}

      {isFieldVisible("BPLid") && (
        <td className="w-[90px]">
          <Input
            className="h-6 w-full bg-gray-100 text-gray-500 cursor-not-allowed text-center text-[10px]"
            value={resolveBranchName(draftLine.BPLid, allBranches)}
            disabled
            readOnly
          />
        </td>
      )}

      {isFieldVisible("UoMCode") && (
        <td className="w-[100px]">
          <Input
            className="h-6 w-full text-center bg-neutral-100"
            value={draftLine.UoMCode || ""}
            disabled
            readOnly
          />
        </td>
      )}

      {isFieldVisible("LineTotal") && (
        <td className="w-[120px]">
          <Input
            className="h-6 w-full text-right"
            value={draftLine.LineTotal || 0}
            disabled
            readOnly
          />
        </td>
      )}

      {isFieldVisible("Freight1Type") && (
        <td className="w-[140px]">
          <Select
            value={draftLine.Freight1Type || ""}
            onValueChange={(val) => {
              const selectedType = freightTypes?.find(
                (t: any) => t.ExpnsCode?.toString() === val
              );
              const updated = {
                ...draftLine,
                Freight1Type: val,
                Freight1TaxGroup: selectedType?.VatGroupI || selectedType?.VatGroupO || "",
              };
              setDraftLine(updated);
              calculateAndUpdate(updated);
            }}
          >
            <SelectTrigger className="h-6 w-full text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {freightTypes?.map((type: any) => (
                <SelectItem
                  key={type.ExpnsCode}
                  value={type.ExpnsCode?.toString()}
                  className="text-xs"
                >
                  {type.ExpnsName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
      )}

      {isFieldVisible("Freight1LCAmount") && (
        <td className="w-[110px]">
          <Input
            className="h-6 w-full text-right"
            type="number"
            value={draftLine.Freight1LCAmount || 0}
            onChange={(e) =>
              setDraftLine({
                ...draftLine,
                Freight1LCAmount: Number(e.target.value),
              })
            }
            onBlur={() => calculateAndUpdate(draftLine)}
            disabled={!isFieldEnabled("Freight1LCAmount")}
          />
        </td>
      )}

      {isFieldVisible("Freight2Type") && (
        <td className="w-[140px]">
          <Select
            value={draftLine.Freight2Type || ""}
            onValueChange={(val) => {
              const selectedType = freightTypes?.find(
                (t: any) => t.ExpnsCode?.toString() === val
              );
              const updated = {
                ...draftLine,
                Freight2Type: val,
                Freight2TaxGroup: selectedType?.VatGroupI || selectedType?.VatGroupO || "",
              };
              setDraftLine(updated);
              calculateAndUpdate(updated);
            }}
            disabled={!isFieldEnabled("Freight2Type")}
          >
            <SelectTrigger className="h-6 w-full text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {freightTypes?.map((type: any) => (
                <SelectItem
                  key={type.ExpnsCode}
                  value={type.ExpnsCode?.toString()}
                  className="text-xs"
                >
                  {type.ExpnsName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
      )}

      {isFieldVisible("Freight2LCAmount") && (
        <td className="w-[110px]">
          <Input
            className="h-6 w-full text-right"
            type="number"
            value={draftLine.Freight2LCAmount || 0}
            onChange={(e) =>
              setDraftLine({
                ...draftLine,
                Freight2LCAmount: Number(e.target.value),
              })
            }
            onBlur={() => calculateAndUpdate(draftLine)}
            disabled={!isFieldEnabled("Freight2LCAmount")}
          />
        </td>
      )}

      {isFieldVisible("Freight3Type") && (
        <td className="w-[140px]">
          <Select
            value={draftLine.Freight3Type || ""}
            onValueChange={(val) => {
              const selectedType = freightTypes?.find(
                (t: any) => t.ExpnsCode?.toString() === val
              );
              const updated = {
                ...draftLine,
                Freight3Type: val,
                Freight3TaxGroup: selectedType?.VatGroupI || selectedType?.VatGroupO || "",
              };
              setDraftLine(updated);
              calculateAndUpdate(updated);
            }}
            disabled={!isFieldEnabled("Freight3Type")}
          >
            <SelectTrigger className="h-6 w-full text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {freightTypes?.map((type: any) => (
                <SelectItem
                  key={type.ExpnsCode}
                  value={type.ExpnsCode?.toString()}
                  className="text-xs"
                >
                  {type.ExpnsName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
      )}

      {isFieldVisible("Freight3LCAmount") && (
        <td className="w-[110px]">
          <Input
            className="h-6 w-full text-right"
            type="number"
            value={draftLine.Freight3LCAmount || 0}
            onChange={(e) =>
              setDraftLine({
                ...draftLine,
                Freight3LCAmount: Number(e.target.value),
              })
            }
            onBlur={() => calculateAndUpdate(draftLine)}
            disabled={!isFieldEnabled("Freight3LCAmount")}
          />
        </td>
      )}

      <LineUDFCells
        docType={config.type}
        line={draftLine}
        disabled={isLineDisabled}
        fmsContext={Object.fromEntries(
          Object.entries(draftLine)
            .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
            .map(([k, v]) => [k, String(v)])
        )}
        onPatch={(patch) => {
          setDraftLine((prev) => ({ ...prev, ...patch }));
          updateLineByIndex(index, patch);
        }}
      />

      <WarehouseSelectorDialog
        open={whDialogOpen}
        onClose={() => setWhDialogOpen(false)}
        onSelect={(wh: any) => {
          const qtyInWhs = line.QtyInWhs || [];
          const whRecord = qtyInWhs.find(
            (w: any) => (w.WarehouseCode || w.warehouseCode) === wh.WhsCode
          );

          const updated = {
            ...draftLine,
            WarehouseCode: wh.WhsCode,
            BPLid: wh.BPLid,
            OnHand: whRecord ? whRecord.Qty ?? 0 : 0,
          };

          setDraftLine(updated);
          updateLineByIndex(index, updated);
        }}
        itemCode={line.ItemCode}
        itemQtyInWhs={line.QtyInWhs}
      />

      <GenericModal
        open={cogsModalOpen}
        onClose={() => setCogsModalOpen(false)}
        onSelect={(val) => {
          setDraftLine({ ...draftLine, [activeField]: val });
          setCogsModalOpen(false);
        }}
        data={cogsData}
        columns={[
          { key: "Code", label: "Code" },
          { key: "Name", label: "Name" },
        ]}
        title="Select Distribution Rule"
        getSelectValue={(item) => item.Code}
      />
    </>
  );
}

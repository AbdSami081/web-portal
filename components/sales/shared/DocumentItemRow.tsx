import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Trash, Search } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { SalesDocumentLine } from "@/types/sales/salesDocuments.type";
import { WarehouseSelectorDialog } from "@/modals/WarehouseSelectorDialog";
import { GenericModal } from "@/modals/GenericModal";
import { getItemsList } from "@/api+/sap/master-data/items";
import { distribtionLstOCRCO2, distribtionLstOCRCO3, distribtionLstOCRCO4 } from "@/app/data/cogsData";
import { taxcCodeGrp, freightTypes, uomOptions, calculateFreightTax, calculateLineTax } from "@/utils/taxCalculations";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";
import { useSalesDocConfig } from "./SalesDocumentLayout";
import { getUoMName } from "@/lib/sap/helpers/uomHelper";
import { DocumentType } from "@/types/master/DocumentType";


interface Props {
  index: number;
  line: SalesDocumentLine;
}

interface Record {
  Code: string;
  Name: string;
}

export function DocumentLineRow({ index, line }: Props) {
  const { watch } = useFormContext();
  const config = useSalesDocConfig();

  const isFieldEnabled = (fieldName: string) => {
    return getFieldSettings(config.type, "linesFieds", fieldName).enable !== false;
  };

  const isFieldVisible = (fieldName: string) => {
    return getFieldSettings(config.type, "linesFieds", fieldName).visible !== false;
  };
  const { updateLine, removeLine, lines } = useSalesDocument();
  const { freightsWithCharges, freightTypes } = useMasterDataStore();

  const [draftLine, setDraftLine] = useState(line);
  const [whDialogOpen, setWhDialogOpen] = useState(false);
  const [cogsModalOpen, setCogsModalOpen] = useState(false);
  const [activeField, setActiveField] = useState<"CogsOcrCo2" | "CogsOcrCo3" | "CogsOcrCo4">("CogsOcrCo2");
  const [cogsData, setCogsData] = useState<Record[]>([]);

  // Fetch QtyInWhs from Item API if not present on the line (e.g. when loading existing documents)
  useEffect(() => {
    if (!line.QtyInWhs || line.QtyInWhs.length === 0) {
      getItemsList(line.ItemCode, 0, 1).then((res) => {
        const item = res.find(i => i.ItemCode === line.ItemCode);
        if (item && item.QtyInWhs) {
          const qtyInWhs: any[] = item.QtyInWhs;
          const whsCode = line.WarehouseCode || draftLine.WarehouseCode;
          const whRecord = qtyInWhs.find(
            (w: any) => (w.WarehouseCode || w.warehouseCode) === whsCode
          );
          const onHand = whRecord ? (whRecord.Qty ?? whRecord.qty ?? 0) : 0;
          updateLine(line.ItemCode, { QtyInWhs: qtyInWhs, OnHand: onHand });
        }
      });
    }
  }, [line.ItemCode]);

  // Sync OnHand from QtyInWhs for the currently selected warehouse
  useEffect(() => {
    const qtyInWhs = line.QtyInWhs || [];
    const whRecord = qtyInWhs.find(
      (w: any) => (w.WarehouseCode || w.warehouseCode) === (line.WarehouseCode || draftLine.WarehouseCode)
    );
    const currentOnHand = whRecord ? (whRecord.Qty ?? whRecord.qty ?? 0) : 0;
    setDraftLine({ ...line, OnHand: currentOnHand });
  }, [line, index]);

  useEffect(() => {
    calculateAndUpdate(draftLine);
  }, [
    draftLine.Quantity,
    draftLine.OnHand,
    draftLine.Price,
    draftLine.DiscountPercent,
    draftLine.TaxCode,
    draftLine.Freight1LCAmount,
    draftLine.Freight1TaxGroup,
    draftLine.Freight2LCAmount,
    draftLine.Freight2TaxGroup,
    draftLine.Freight3LCAmount,
    draftLine.Freight3TaxGroup,
    freightsWithCharges,
  ]);

  const calculateAndUpdate = (lineData: SalesDocumentLine) => {
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

    updateLine(line.ItemCode, updatedLine);
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

  const renderCogsField = (field: "CogsOcrCo2" | "CogsOcrCo3" | "CogsOcrCo4", data: Record[]) => (
    <td className="py-2 px-2">
      <div className="relative w-full">
        <Input
          className="h-6 w-full pr-8"
          value={draftLine[field]}
          onChange={(e) => setDraftLine({ ...draftLine, [field]: e.target.value })}
          onBlur={() => {
            if (!data.some((r) => r.Code === draftLine[field])) {
              openCogsModal(field);
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
          onClick={() => openCogsModal(field)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </td>
  );

  return (
    <>
      <td className="py-2 px-2 border-r border-neutral-100/10 text-center">
        <Button
          type="button"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-red-100/10"
          onClick={() => removeLine(line.ItemCode)}
          disabled={Boolean(watch("DocEntry") && Number(watch("DocEntry")) > 0)}
        >
          <Trash className={`h-4 w-4 ${watch("DocEntry") && Number(watch("DocEntry")) > 0 ? "text-gray-500" : "text-red-500"}`} />
        </Button>
      </td>

      {isFieldVisible("ItemCode") && (
        <td className="px-12 py-2">
          <span className="font-medium">{line.ItemCode}</span>
        </td>
      )}

      {isFieldVisible("ItemName") && (
        <td className="px-2 py-2">
          <span className="block text-left">{draftLine.ItemName}</span>
        </td>
      )}

      {isFieldVisible("Quantity") && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            value={draftLine.Quantity}
            onChange={(e) => {
              const val = Number(e.target.value);
              setDraftLine({ ...draftLine, Quantity: val });
            }}
            disabled={!isFieldEnabled("Quantity")}
          />
        </td>
      )}

      {isFieldVisible("OnHand") && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right bg-neutral-100"
            type="number"
            step="any"
            value={draftLine.OnHand ?? 0}
            disabled
            readOnly
          />
        </td>
      )}

      {isFieldVisible("Price") && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            disabled={!isFieldEnabled("Price")}
            min={0}
            value={draftLine.Price}
            onChange={(e) => {
              const val = Number(e.target.value);
              setDraftLine({ ...draftLine, Price: val });
            }}
          />
        </td>
      )}

      {isFieldVisible("DiscountPercent") && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            min={0}
            max={100}
            disabled={!isFieldEnabled("DiscountPercent")}
            value={draftLine.DiscountPercent || 0}
            onChange={(e) => {
              const val = Number(e.target.value);
              setDraftLine({ ...draftLine, DiscountPercent: val > 100 ? 100 : val });
            }}
          />
        </td>
      )}

      {isFieldVisible("TaxCode") && (
        <td className="py-2 px-2">
          <Select
            value={draftLine.TaxCode || ""}
            disabled={!isFieldEnabled("TaxCode")}
            onValueChange={(val) => setDraftLine({ ...draftLine, TaxCode: val })}
          >
            <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
              <SelectValue placeholder="Select Tax" />
            </SelectTrigger>
            <SelectContent>
              {freightsWithCharges?.map((grp: any) => {
                const code = grp.Code || grp.code;
                const name = grp.Name || grp.name;
                return (
                  <SelectItem key={code} value={code} className="text-xs">
                    {code} - {name || code}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </td>
      )}

      {isFieldVisible("TaxAmount") && (
        <td className="py-2 px-2">
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
        <td className="py-2 px-2">
          <div className="flex items-center gap-1 w-full justify-center">
            <Input
              className="h-6 w-full bg-gray-100 text-gray-500 cursor-not-allowed text-center text-[10px]"
              value={draftLine.WarehouseCode || ""}
              disabled
              readOnly
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setWhDialogOpen(true)}
              disabled={!isFieldEnabled("WarehouseCode")}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </td>
      )}

      {isFieldVisible("UoMCode") && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-center bg-neutral-100"
            value={draftLine.UoMCode || ""}
            disabled
            readOnly
          />
        </td>
      )}

      {isFieldVisible("UoMName") && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-center bg-neutral-100"
            value={
              !draftLine.UoMCode || draftLine.UoMCode === "-1"
                ? ""
                : draftLine.MeasureUnit || getUoMName(draftLine.UoMCode) || ""
            }
            disabled
            readOnly
          />
        </td>
      )}

      {isFieldVisible("LineTotal") && (
        <td className="py-2 px-2">
          <Input className="h-6 w-full text-right" value={draftLine.LineTotal || 0} disabled readOnly />
        </td>
      )}

      {/* Freight 1 */}
      {isFieldVisible("Freight1Type") && (
        <td className="py-2 px-2">
          <Select
            value={draftLine.Freight1Type || ""}
            disabled={!isFieldEnabled("Freight1Type")}
            onValueChange={(val) => {
              const selectedType = freightTypes?.find((t: any) => t.ExpnsCode?.toString() === val);
              const defaultTax = selectedType?.VatGroupO || "";
              const updated = { ...draftLine, Freight1Type: val, Freight1TaxGroup: defaultTax };
              setDraftLine(updated);
              calculateAndUpdate(updated);
            }}
          >
            <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {freightTypes?.map((type: any) => {
                const code = type.ExpnsCode;
                const name = type.ExpnsName;
                return (
                  <SelectItem key={code} value={code?.toString()} className="text-xs">
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </td>
      )}

      {isFieldVisible("Freight1LCAmount") && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            disabled={!isFieldEnabled("Freight1LCAmount")}
            value={draftLine.Freight1LCAmount || 0}
            onChange={(e) => {
              const value = Number(e.target.value);
              setDraftLine(prev => ({ ...prev, Freight1LCAmount: value }));
            }}
            onBlur={() => calculateAndUpdate(draftLine)}
          />
        </td>
      )}

      {/* Freight 2 */}
      {isFieldVisible("Freight2Type") && (
        <td className="py-2 px-2">
          <Select
            value={draftLine.Freight2Type || ""}
            disabled={!isFieldEnabled("Freight2Type")}
            onValueChange={(val) => {
              const selectedType = freightTypes?.find((t: any) => t.ExpnsCode?.toString() === val);
              const defaultTax = selectedType?.VatGroupO || "";
              const updated = { ...draftLine, Freight2Type: val, Freight2TaxGroup: defaultTax };
              setDraftLine(updated);
              calculateAndUpdate(updated);
            }}
          >
            <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {freightTypes?.map((type: any) => {
                const code = type.ExpnsCode;
                const name = type.ExpnsName;
                return (
                  <SelectItem key={code} value={code?.toString()} className="text-xs">
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </td>
      )}

      {isFieldVisible("Freight2LCAmount") && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            disabled={!isFieldEnabled("Freight2LCAmount")}
            value={draftLine.Freight2LCAmount || 0}
            onChange={(e) => {
              const value = Number(e.target.value);
              setDraftLine(prev => ({ ...prev, Freight2LCAmount: value }));
            }}
            onBlur={() => calculateAndUpdate(draftLine)}
          />
        </td>
      )}

      {/* Freight 3 */}
      {isFieldVisible("Freight3Type") && (
        <td className="py-2 px-2">
          <Select
            value={draftLine.Freight3Type || ""}
            disabled={!isFieldEnabled("Freight3Type")}
            onValueChange={(val) => {
              const selectedType = freightTypes?.find((t: any) => t.ExpnsCode?.toString() === val);
              const defaultTax = selectedType?.VatGroupO || "";
              const updated = { ...draftLine, Freight3Type: val, Freight3TaxGroup: defaultTax };
              setDraftLine(updated);
              calculateAndUpdate(updated);
            }}
          >
            <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {freightTypes?.map((type: any) => {
                const code = type.ExpnsCode;
                const name = type.ExpnsName;
                return (
                  <SelectItem key={code} value={code?.toString()} className="text-xs">
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </td>
      )}

      {isFieldVisible("Freight3LCAmount") && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            disabled={!isFieldEnabled("Freight3LCAmount")}
            value={draftLine.Freight3LCAmount || 0}
            onChange={(e) => {
              const value = Number(e.target.value);
              setDraftLine(prev => ({ ...prev, Freight3LCAmount: value }));
            }}
            onBlur={() => calculateAndUpdate(draftLine)}
          />
        </td>
      )}

      <WarehouseSelectorDialog
        open={whDialogOpen}
        onClose={() => setWhDialogOpen(false)}
        onSelect={(wh: any) => {
          const qtyInWhs = line.QtyInWhs || [];
          const whRecord = qtyInWhs.find(
            (w: any) => (w.WarehouseCode || w.warehouseCode) === wh.WhsCode
          );
          const whOnHand = whRecord ? (whRecord.Qty ?? whRecord.qty ?? 0) : 0;
          const updated = { ...draftLine, WarehouseCode: wh.WhsCode, OnHand: whOnHand };
          setDraftLine(updated);
          updateLine(line.ItemCode, updated);
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

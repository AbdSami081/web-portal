import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Trash } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { SalesDocumentLine } from "@/types/sales/salesDocuments.type";
import { WarehouseSelectorDialog } from "@/modals/WarehouseSelectorDialog";
import { GenericModal } from "@/modals/GenericModal";
import { distribtionLstOCRCO2, distribtionLstOCRCO3, distribtionLstOCRCO4 } from "@/app/data/cogsData";
import { taxcCodeGrp, freightTypes, uomOptions, calculateFreightTax } from "@/utils/taxCalculations";

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
  const { updateLine, removeLine, lines } = useSalesDocument();
  const { vatGroups } = useMasterDataStore();

  const [draftLine, setDraftLine] = useState(line);
  const [whDialogOpen, setWhDialogOpen] = useState(false);
  const [cogsModalOpen, setCogsModalOpen] = useState(false);
  const [activeField, setActiveField] = useState<"CogsOcrCo2" | "CogsOcrCo3" | "CogsOcrCo4">("CogsOcrCo2");
  const [cogsData, setCogsData] = useState<Record[]>([]);

  useEffect(() => {
    calculateAndUpdate(draftLine);
  }, [
    draftLine.Quantity,
    draftLine.Price,
    draftLine.DiscountPercent,
    draftLine.Freight1Amount,
    draftLine.Freight1TaxGroup,
    draftLine.Freight2Amount,
    draftLine.Freight2TaxGroup,
    draftLine.Freight3Amount,
    draftLine.Freight3TaxGroup,
  ]);

  const calculateAndUpdate = (lineData: SalesDocumentLine) => {
    const quantity = Number(lineData.Quantity) || 0;
    const price = Number(lineData.Price) || 0;
    const discount = Number(lineData.DiscountPercent) || 0;

    const selectedTax = vatGroups.find(t => t.Code === lineData.TaxCode);
    const itemTaxRate = Number(selectedTax?.VatGroups_Lines?.[0]?.Rate || 0);

    const subtotal = quantity * price;
    const discounted = subtotal * (1 - discount / 100);
    const itemTax = (discounted * itemTaxRate) / 100;

    const f1 = calculateFreightTax(Number(lineData.Freight1Amount || 0), lineData.Freight1TaxGroup || "S2");
    const f2 = calculateFreightTax(Number(lineData.Freight2Amount || 0), lineData.Freight2TaxGroup || "S2");
    const f3 = calculateFreightTax(Number(lineData.Freight3Amount || 0), lineData.Freight3TaxGroup || "S2");

    const totalTax = itemTax + f1.taxAmount + f2.taxAmount + f3.taxAmount;

    const updatedLine = {
      ...lineData,
      Freight1TaxRate: f1.rate,
      Freight1TaxAmount: f1.taxAmount,
      Freight2TaxRate: f2.rate,
      Freight2TaxAmount: f2.taxAmount,
      Freight3TaxRate: f3.rate,
      Freight3TaxAmount: f3.taxAmount,
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
    <td>
      <div className="relative">
        <Input
          className="h-6 w-28 pr-8"
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

      <td className="px-12 py-2">
        <span className="font-medium">{line.ItemCode}</span>
      </td>

      <td className="px-12 py-2">
        <Input className="h-6 w-32" value={draftLine.ItemName || ""} disabled />
      </td>

      <td>
        <Input
          className="h-6 w-20 text-right"
          type="number"
          value={draftLine.Quantity}
          onChange={(e) => setDraftLine({ ...draftLine, Quantity: Number(e.target.value) })}
        />
      </td>

      <td>
        <Select
          value={draftLine.UoMCode || ""}
          onValueChange={(val) => setDraftLine({ ...draftLine, UoMCode: val })}
        >
          <SelectTrigger className="h-6 w-28 border rounded px-2 text-xs">
            <SelectValue placeholder="Select UoM" />
          </SelectTrigger>
          <SelectContent>
            {uomOptions.map((uom) => (
              <SelectItem key={uom} value={uom} className="text-xs">
                {uom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      <td>
        <Input
          className="h-6 w-24 text-right"
          type="number"
          value={draftLine.Price}
          onChange={(e) => setDraftLine({ ...draftLine, Price: Number(e.target.value) })}
        />
      </td>

      <td>
        <Select
          value={draftLine.TaxCode || ""}
          onValueChange={(val) => setDraftLine({ ...draftLine, TaxCode: val })}
        >
          <SelectTrigger className="h-6 w-28 border rounded px-2 text-xs">
            <SelectValue placeholder="Select Tax" />
          </SelectTrigger>
          <SelectContent>
            {taxcCodeGrp.map((grp, index) => (
              <SelectItem key={index} value={grp.Value} className="text-xs">
                {grp.Title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      <td>
        <Input className="h-6 w-24 text-right" value={draftLine.LineTotal || draftLine.Price} disabled />
      </td>

      <td>
        <Select
          value={draftLine.Freight1Type || ""}
          onValueChange={(val) => setDraftLine({ ...draftLine, Freight1Type: val })}
        >
          <SelectTrigger className="h-6 w-28 border rounded px-2 text-xs">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            {freightTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="text-xs">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      <td>
        <Input
          type="number"
          value={draftLine.Freight1Amount || 0}
          onChange={(e) => {
            const value = Number(e.target.value);
            setDraftLine(prev => ({ ...prev, Freight1Amount: value }));
          }}
          onBlur={() => calculateAndUpdate(draftLine)}
        />

      </td>

      {/* <td>
        <Select
          value={draftLine.Freight1TaxGroup || "S2"}
          onValueChange={(val) => setDraftLine({ ...draftLine, Freight1TaxGroup: val })}
        >
          <SelectTrigger className="h-6 w-28 text-xs">
            <SelectValue placeholder="Select Tax Group" />
          </SelectTrigger>
          <SelectContent>
            {taxcCodeGrp.map((grp) => (
              <SelectItem key={grp.Value} value={grp.Value} className="text-xs">
                {grp.Title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td> */}

      {/* <td>
        <Input className="h-6 w-24 text-right" value={draftLine.Freight1TaxRate || 0} disabled />
      </td> */}

      {/* <td>
        <Input type="number" className="h-6 w-24 text-right" value={draftLine.Freight1TaxAmount || 0} disabled />
      </td> */}

      {/* <td>
        <Input type="number" className="h-6 w-24 text-right" disabled />
      </td> */}

      <td>
        <Select
          value={draftLine.Freight2Type || ""}
          onValueChange={(val) => setDraftLine({ ...draftLine, Freight2Type: val })}
        >
          <SelectTrigger className="h-6 w-28 border rounded px-2 text-xs">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            {freightTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="text-xs">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      <td>
        <Input
          type="number"
          value={draftLine.Freight2Amount || 0}
          onChange={(e) => {
            const value = Number(e.target.value);
            setDraftLine(prev => ({ ...prev, Freight2Amount: value }));
          }}
          onBlur={() => calculateAndUpdate(draftLine)}
        />

      </td>

      {/* <td>
        <Select
          value={draftLine.Freight2TaxGroup || "S2"}
          onValueChange={(val) => setDraftLine({ ...draftLine, Freight2TaxGroup: val })}
        >
          <SelectTrigger className="h-6 w-28 text-xs">
            <SelectValue placeholder="Select Tax Group" />
          </SelectTrigger>
          <SelectContent>
            {taxcCodeGrp.map((grp) => (
              <SelectItem key={grp.Value} value={grp.Value} className="text-xs">
                {grp.Title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      <td>
        <Input className="h-6 w-24 text-right" value={draftLine.Freight2TaxRate || 0} disabled />
      </td>

      <td>
        <Input type="number" className="h-6 w-24 text-right" value={draftLine.Freight2TaxAmount || 0} disabled />
      </td>

      <td>
        <Input type="number" className="h-6 w-24 text-right" disabled />
      </td> */}

      <td>
        <Select
          value={draftLine.Freight3Type || ""}
          onValueChange={(val) => setDraftLine({ ...draftLine, Freight3Type: val })}
        >
          <SelectTrigger className="h-6 w-28 border rounded px-2 text-xs">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            {freightTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="text-xs">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      <td className="px-12 py-2">
        <Input
          type="number"
          value={draftLine.Freight3Amount || 0}
          onChange={(e) => {
            const value = Number(e.target.value);
            setDraftLine(prev => ({ ...prev, Freight3Amount: value }));
          }}
          onBlur={() => calculateAndUpdate(draftLine)}
          className="h-6 w-24"
        />
      </td>
      <WarehouseSelectorDialog
        open={whDialogOpen}
        onClose={() => setWhDialogOpen(false)}
        onSelect={(wh: any) => {
          setDraftLine({ ...draftLine, WarehouseCode: wh.WarehouseCode });
        }}
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

import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PurchaseItemRow({ index }: { index: number }) {
  const { lines, updateLine, removeLine } = usePurchaseDocument();
  const { freightsWithCharges } = useMasterDataStore();
  const line = lines[index];

  if (!line) return null;

  return (
    <TableRow className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
      <TableCell className="w-[40px] text-center font-medium text-slate-500">
        {index + 1}
      </TableCell>
      
      <TableCell className="min-w-[150px]">
        <Input
          value={line.ItemCode || ""}
          onChange={(e) => updateLine(index, { ItemCode: e.target.value })}
          placeholder="Item Code"
          className="h-6 text-[10px]"
        />
      </TableCell>
      
      <TableCell className="min-w-[150px]">
        <Input
          value={line.LineVendor || ""}
          onChange={(e) => updateLine(index, { LineVendor: e.target.value })}
          placeholder="Vendor"
          className="h-6 text-[10px]"
        />
      </TableCell>
      
      <TableCell className="min-w-[130px]">
        <Input
          type="date"
          value={line.RequiredDate || ""}
          onChange={(e) => updateLine(index, { RequiredDate: e.target.value })}
          className="h-6 text-[10px]"
        />
      </TableCell>
      
      <TableCell className="w-[100px]">
        <Input
          type="number"
          value={line.Quantity || ""}
          onChange={(e) => updateLine(index, { Quantity: Number(e.target.value) })}
          className="h-6 text-[10px] text-right"
        />
      </TableCell>
      
      <TableCell className="w-[120px]">
        <Input
          type="number"
          value={line.Price || ""}
          onChange={(e) => updateLine(index, { Price: Number(e.target.value) })}
          className="h-6 text-[10px] text-right"
        />
      </TableCell>

      <TableCell className="w-[100px]">
        <Input
          type="number"
          value={line.DiscountPercent || ""}
          onChange={(e) => updateLine(index, { DiscountPercent: Number(e.target.value) })}
          className="h-6 text-[10px] text-right"
        />
      </TableCell>

      <TableCell className="w-[100px]">
        <Select
          value={line.TaxCode || ""}
          onValueChange={(val) => updateLine(index, { TaxCode: val })}
        >
          <SelectTrigger className="h-6 text-[10px] border rounded px-1">
            <SelectValue placeholder="Tax Code" />
          </SelectTrigger>
          <SelectContent>
            {freightsWithCharges?.map((grp: any) => {
              const code = grp.Code || grp.code;
              const name = grp.Name || grp.name;
              return (
                <SelectItem key={code} value={code} className="text-[10px]">
                  {code} - {name || code}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </TableCell>
      
      <TableCell className="w-[120px] text-right font-medium text-slate-700 text-[10px]">
        {((line.Quantity || 0) * (line.Price || 0) * (1 - (line.DiscountPercent || 0) / 100)).toFixed(2)}
      </TableCell>
      
      <TableCell className="w-[100px]">
        <Input
          value={line.UoMCode || ""}
          onChange={(e) => updateLine(index, { UoMCode: e.target.value })}
          className="h-6 text-[10px]"
        />
      </TableCell>
      
      <TableCell className="w-[150px]">
        <Input
          value={line.CountryOrg || ""}
          onChange={(e) => updateLine(index, { CountryOrg: e.target.value })}
          className="h-6 text-[10px]"
        />
      </TableCell>

      {/* Custom FBR Fields */}
      <TableCell className="w-[100px]">
        <Input
          value={line.U_FBRUom || ""}
          onChange={(e) => updateLine(index, { U_FBRUom: e.target.value })}
          className="h-6 text-[10px]"
        />
      </TableCell>
      <TableCell className="w-[100px]">
        <Input
          type="number"
          value={line.U_FBRQty || ""}
          onChange={(e) => updateLine(index, { U_FBRQty: Number(e.target.value) })}
          className="h-6 text-[10px]"
        />
      </TableCell>
      <TableCell className="w-[100px]">
        <Input
          type="number"
          value={line.U_FBRRate || ""}
          onChange={(e) => updateLine(index, { U_FBRRate: Number(e.target.value) })}
          className="h-6 text-[10px]"
        />
      </TableCell>
      <TableCell className="w-[120px]">
        <Input
          type="number"
          value={line.U_FBRLneTotal || ""}
          onChange={(e) => updateLine(index, { U_FBRLneTotal: Number(e.target.value) })}
          className="h-6 text-[10px]"
        />
      </TableCell>
      <TableCell className="w-[120px]">
        <Input
          type="number"
          value={line.U_FBRSalesTax || ""}
          onChange={(e) => updateLine(index, { U_FBRSalesTax: Number(e.target.value) })}
          className="h-6 text-[10px]"
        />
      </TableCell>
      
      <TableCell className="w-[60px] text-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeLine(index)}
          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

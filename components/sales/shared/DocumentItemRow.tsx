import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Trash, Search } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { SalesDocumentLine } from "@/types/sales/salesDocuments.type";
import { WarehouseSelectorDialog } from "@/modals/WarehouseSelectorDialog";
import { UoMSelectorDialog } from "@/modals/UoMSelectorDialog";
import { GenericModal } from "@/modals/GenericModal";
import { fetchItemByCode } from "@/lib/sap/helpers/itemCacheHelper";
import {
  distribtionLstOCRCO2,
  distribtionLstOCRCO3,
  distribtionLstOCRCO4,
} from "@/app/data/cogsData";
import {
  calculateFreightTax,
  calculateLineTax,
} from "@/utils/taxCalculations";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";
import { useSalesDocConfig } from "./SalesDocumentLayout";
import { getUoMName } from "@/lib/sap/helpers/uomHelper";
import { isManualUom } from "@/utils/inventoryUom";
import { isPostedSalesDocType } from "@/lib/sap/helpers/postedDocumentHelper";
import {
  resolveBranchForWarehouse,
  resolveBranchName,
} from "@/lib/sap/helpers/branchHelper";
import { useBranchStore } from "@/stores/useBranchStore";
import {
  LineUDFCells,
  LineCellFms,
} from "@/components/shared/LineUDFCells";
import { usePositiveField } from "@/lib/validation/usePositiveField";
import { useLineFmsAuto } from "@/hooks/useFMS";
import { useApprovalSettings } from "@/hooks/useApprovalSettings";
import { useChartOfAccountsStore } from "@/stores/useChartOfAccountsStore";
interface Props {
  index: number;
  line: SalesDocumentLine;
  documentMode?: "items" | "service";
}

interface Record {
  Code: string;
  Name: string;
}

export function DocumentLineRow({
  index,
  line,
  documentMode = "items",
}: Props) {
  const { watch } = useFormContext();
  const config = useSalesDocConfig();
  const chartOfAccounts = useChartOfAccountsStore(
  (state) => state.chartOfAccounts
);
  const chartOfAccountsHasMore = useChartOfAccountsStore((state) => state.hasMore);
  const chartOfAccountsLoading = useChartOfAccountsStore((state) => state.isLoading);
  const loadMoreChartOfAccounts = useChartOfAccountsStore((state) => state.loadMoreChartOfAccounts);

console.log("chartOfAccounts", chartOfAccounts);
  const isService = documentMode === "service";

  const isFinancialDoc = isPostedSalesDocType(config.type);

  const docEntry = watch("DocEntry");
  const isEditMode = Boolean(docEntry && Number(docEntry) > 0);

  const isLineUpdateBlocked = isFinancialDoc && isEditMode;

  const isFieldEnabled = (fieldName: string) => {
    return (
      getFieldSettings(
        config.type,
        "linesFieds",
        fieldName
      ).enable !== false
    );
  };

  const fieldAccess = useSalesDocument(
    (state) => state.fieldAccess
  );

  const isFieldVisible = (fieldName: string) => {
    return (
      fieldAccess.includes(fieldName) &&
      getFieldSettings(
        config.type,
        "linesFieds",
        fieldName
      ).visible !== false
    );
  };

  const isLineClosed =
    line.IsClosed === "tYES" ||
    line.LineStatus === "bost_Close";

  const isLineDisabled =
    isLineClosed || isLineUpdateBlocked;

  const isCellEditable = (fieldName: string) =>
    isFieldEnabled(fieldName) && !isLineDisabled;

  const { updateLine, removeLine } = useSalesDocument();

  const {
    freightsWithCharges,
    freightTypes,
    warehouses,
  } = useMasterDataStore();

  const { allBranches } = useBranchStore();

  const [draftLine, setDraftLine] =
    useState<SalesDocumentLine>(line);

  const [whDialogOpen, setWhDialogOpen] =
    useState(false);

  const [uomDialogOpen, setUomDialogOpen] =
    useState(false);

  const [cogsModalOpen, setCogsModalOpen] =
    useState(false);
    const [glAccountModalOpen, setGlAccountModalOpen] = useState(false);

  const [
    activeField,
    setActiveField,
  ] = useState<
    "CogsOcrCo2" | "CogsOcrCo3" | "CogsOcrCo4"
  >("CogsOcrCo2");

  const [cogsData, setCogsData] =
    useState<Record[]>([]);

  const { multiBranchEnabled } =
    useApprovalSettings();

  const qtyGuard = usePositiveField(
    "Quantity",
    line.Quantity
  );

  const priceGuard = usePositiveField(
    isService ? "UnitPrice" : "Price",
    isService
      ? line.UnitPrice
      : line.Price
  );

  useLineFmsAuto(
    draftLine,
    (patch) => {
      setDraftLine((prev) => ({
        ...prev,
        ...patch,
      }));

      updateLine(
        line.ItemCode,
        patch as any
      );
    },
    isLineDisabled
  );

  const patchLine = (
    patch: { [key: string]: any }
  ) => {
    const updated = {
      ...draftLine,
      ...patch,
    };

    setDraftLine(updated);

    updateLine(
      line.ItemCode,
      patch as any
    );
  };

  useEffect(() => {
    if (isService) return;

    if (
      !line.QtyInWhs ||
      line.QtyInWhs.length === 0
    ) {
      fetchItemByCode(line.ItemCode).then(
        (item) => {
          if (item?.QtyInWhs) {
            const qtyInWhs: any[] =
              item.QtyInWhs;

            const whsCode =
              line.WarehouseCode ||
              draftLine.WarehouseCode;

            const whRecord =
              qtyInWhs.find(
                (w: any) =>
                  (w.WarehouseCode ||
                    w.warehouseCode) ===
                  whsCode
              );

            const onHand = whRecord
              ? whRecord.Qty ??
                whRecord.qty ??
                0
              : 0;

            updateLine(
              line.ItemCode,
              {
                QtyInWhs: qtyInWhs,
                OnHand: onHand,
              }
            );
          }
        }
      );
    }
  }, [
    isService,
    line.ItemCode,
  ]);

  useEffect(() => {
    if (isService) return;

    const qtyInWhs =
      line.QtyInWhs || [];

    const whRecord =
      qtyInWhs.find(
        (w: any) =>
          (w.WarehouseCode ||
            w.warehouseCode) ===
          (
            line.WarehouseCode ||
            draftLine.WarehouseCode
          )
      );

    const currentOnHand =
      whRecord
        ? whRecord.Qty ??
          whRecord.qty ??
          0
        : 0;

    setDraftLine({
      ...line,
      OnHand: currentOnHand,
    });
  }, [
    line,
    index,
    isService,
  ]);

  useEffect(() => {
    if (isService) return;

    if (
      line.WarehouseCode &&
      line.BPLid === undefined
    ) {
      const branchId =
        resolveBranchForWarehouse(
          line.WarehouseCode,
          warehouses
        );

      if (branchId !== undefined) {
        updateLine(
          line.ItemCode,
          {
            BPLid: branchId,
          }
        );
      }
    }
  }, [
    isService,
    line.WarehouseCode,
    line.BPLid,
    warehouses,
  ]);
const glAccountData = [
  {
    Code: "400001",
    Name: "Sales Revenue",
  },
  {
    Code: "400002",
    Name: "Service Revenue",
  },
  {
    Code: "500001",
    Name: "General Expenses",
  },
];

const glAccountColumns = [
  {
    key: "Code",
    label: "G/L Account",
  },
  {
    key: "Name",
    label: "G/L Account Name",
  },
];
useEffect(() => {
  calculateAndUpdate(draftLine);
}, [
  draftLine.Quantity,
  draftLine.Price,
  draftLine.UnitPrice,

  draftLine.LineTotal,

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
  const calculateAndUpdate = (
  lineData: SalesDocumentLine
) => {
  const discount =
    Number(lineData.DiscountPercent) || 0;

  const selectedTax =
    freightsWithCharges.find(
      (t: any) =>
        String(t.Code ?? t.code ?? "") ===
        String(lineData.TaxCode ?? "")
    );

  const taxRate =
    Number(selectedTax?.Rate) || 0;

  const f1 = calculateFreightTax(
    Number(lineData.Freight1LCAmount || 0),
    lineData.Freight1TaxGroup || "",
    freightsWithCharges
  );

  const f2 = calculateFreightTax(
    Number(lineData.Freight2LCAmount || 0),
    lineData.Freight2TaxGroup || "",
    freightsWithCharges
  );

  const f3 = calculateFreightTax(
    Number(lineData.Freight3LCAmount || 0),
    lineData.Freight3TaxGroup || "",
    freightsWithCharges
  );

  if (isService) {
    const serviceAmount =
      Number(lineData.LineTotal) || 0;

    const discountedAmount =
      serviceAmount *
      (1 - discount / 100);

    const serviceTax =
      (discountedAmount * taxRate) / 100;

    const freightTax =
      f1.taxAmount +
      f2.taxAmount +
      f3.taxAmount;

    const taxTotal = Number(
      (serviceTax + freightTax).toFixed(2)
    );

    const grossTotal = Number(
      (discountedAmount + taxTotal).toFixed(2)
    );

    const updatedLine = {
      ...lineData,

      TaxRate: taxRate,

      Freight1TaxRate: f1.rate,
      Freight1TaxLCAmount: Number(
        f1.taxAmount.toFixed(2)
      ),

      Freight2TaxRate: f2.rate,
      Freight2TaxLCAmount: Number(
        f2.taxAmount.toFixed(2)
      ),

      Freight3TaxRate: f3.rate,
      Freight3TaxLCAmount: Number(
        f3.taxAmount.toFixed(2)
      ),

      TaxAmount: taxTotal,
      TaxTotal: taxTotal,

      GrossTotal: grossTotal,

      LineTotal: serviceAmount,
    };

    setDraftLine(updatedLine);

    updateLine(
      line.ItemCode,
      updatedLine
    );

    return;
  }

  const quantity =
    Number(lineData.Quantity) || 0;

  const price =
    Number(lineData.Price) || 0;

  const subtotal =
    quantity * price;

  const discounted =
    subtotal *
    (1 - discount / 100);

  const itemTax =
    (discounted * taxRate) / 100;

  const totalTax =
    itemTax +
    f1.taxAmount +
    f2.taxAmount +
    f3.taxAmount;

  const updatedLine = {
    ...lineData,

    TaxRate: taxRate,

    Freight1TaxRate: f1.rate,
    Freight1TaxLCAmount: f1.taxAmount,

    Freight2TaxRate: f2.rate,
    Freight2TaxLCAmount: f2.taxAmount,

    Freight3TaxRate: f3.rate,
    Freight3TaxLCAmount: f3.taxAmount,

    TaxAmount: Number(
      totalTax.toFixed(2)
    ),

    LineTotal: Number(
      (discounted + totalTax).toFixed(2)
    ),
  };

  updateLine(
    line.ItemCode,
    updatedLine
  );
};

  const openCogsModal = (
    field:
      | "CogsOcrCo2"
      | "CogsOcrCo3"
      | "CogsOcrCo4"
  ) => {
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

if (isService) {
  return (
    <>
      {}
      <td className="py-2 px-2 border-r border-neutral-100/10 text-center">
        <Button
          type="button"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-red-100/10"
          onClick={() => removeLine(line.ItemCode)}
          disabled={isLineDisabled}
          title="Remove service"
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

{isFieldVisible("AccountCode") && (
  <td className="py-2 px-2">
    <div className="flex items-center gap-1">
      
      <Input
        className="h-8 w-full text-left bg-neutral-100"
        value={draftLine.AccountCode || ""}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        
  onClick={() => setGlAccountModalOpen(true)}
  //onClick={() => {alert("G/L Account selection modal is not implemented yet.")}}
      
      >
        <Search className="h-4 w-4" />
      </Button>

    </div>
  </td>
)}
      {/* G/L NAME */}
      {isFieldVisible("AccountName") && (
        <td className="py-2 px-2">
          <Input
            className="h-8 w-full text-left bg-neutral-100"
            value={draftLine.AccountName || ""}
            disabled
            readOnly
          />
        </td>
      )}

      {/* DESCRIPTION */}
     {isFieldVisible("Description") && (
  <td className="py-2 px-2">
    <Input
      className="h-8 w-full text-left bg-neutral-100"
      value={draftLine.Description || ""}
      onChange={(e) => {
        patchLine({
          Description: e.target.value,
        });
      }}
    />
  </td>
)}
 {isFieldVisible(
        "DiscountPercent"
      ) && (
        <td className="py-2 px-2">
          <div className="flex items-center gap-1">
            <Input
              name={`DocumentLines.${index}.DiscountPercent`}
              className="h-6 w-full text-right"
              type="number"
              step="any"
              min={0}
              max={100}
              disabled={
                !isCellEditable(
                  "DiscountPercent"
                )
              }
              value={
                draftLine.DiscountPercent ||
                0
              }
              onChange={(e) => {
                const val =
                  Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        e.target
                          .value
                      ) || 0
                    )
                  );

                setDraftLine({
                  ...draftLine,
                  DiscountPercent:
                    val,
                });
              }}
            />

            <LineCellFms
              field="DiscountPercent"
              line={draftLine}
              onPatch={patchLine}
              disabled={
                !isCellEditable(
                  "DiscountPercent"
                )
              }
            />
          </div>
        </td>
      )}
 {isFieldVisible("TaxCode") && (
        <td className="py-2 px-2">
          <div className="flex items-center gap-1">
            <Select
              value={draftLine.TaxCode || ""}
              disabled={!isCellEditable("TaxCode")}
              onValueChange={(val) =>
                patchLine({
                  TaxCode: val,
                })
              }
            >
              <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
                <SelectValue placeholder="Select Tax" />
              </SelectTrigger>

              <SelectContent>
                {freightsWithCharges?.map((grp: any) => {
                  const code =
                    grp.Code || grp.code;

                  const name =
                    grp.Name || grp.name;

                  return (
                    <SelectItem
                      key={code}
                      value={code}
                      className="text-xs"
                    >
                      {code} - {name || code}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <LineCellFms
              field="TaxCode"
              line={draftLine}
              onPatch={patchLine}
              disabled={!isCellEditable("TaxCode")}
            />
          </div>
        </td>
      )}

    {isFieldVisible("LineTotal") && (
  <td className="py-2 px-2">
    <Input
  type="number"
  step="any"
  className="h-6 w-full text-right bg-neutral-100"
  value={draftLine.LineTotal ?? ""}
  disabled={!isCellEditable("LineTotal")}
  onChange={(e) => {
    const value = Number(e.target.value) || 0;

    setDraftLine((prev) => ({
      ...prev,
      LineTotal: value,
    }));
  }}
/>
  </td>
)}
{isFieldVisible(
        "TaxAmount"
      ) && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right bg-neutral-100"
          value={
  isService
    ? draftLine.TaxAmount ?? 0
    : calculateLineTax(
        Number(draftLine.Quantity) || 0,
        Number(draftLine.Price) || 0,
        Number(draftLine.DiscountPercent) || 0,
        Number(draftLine.TaxRate) || 0
      )
}
            disabled
            readOnly
          />
        </td>
      )}

      {/* TAX CODE */}
      {/* {isFieldVisible("TaxCode") && (
        <td className="py-2 px-2">
          <div className="flex items-center gap-1">
            <Select
              value={draftLine.TaxCode || ""}
              disabled={!isCellEditable("TaxCode")}
              onValueChange={(val) =>
                patchLine({
                  TaxCode: val,
                })
              }
            >
              <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
                <SelectValue placeholder="Select Tax" />
              </SelectTrigger>

              <SelectContent>
                {freightsWithCharges?.map((grp: any) => {
                  const code =
                    grp.Code || grp.code;

                  const name =
                    grp.Name || grp.name;

                  return (
                    <SelectItem
                      key={code}
                      value={code}
                      className="text-xs"
                    >
                      {code} - {name || code}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <LineCellFms
              field="TaxCode"
              line={draftLine}
              onPatch={patchLine}
              disabled={!isCellEditable("TaxCode")}
            />
          </div>
        </td>
      )} */}
            {/* FREIGHT 1 TYPE */}
      {isFieldVisible(
        "Freight1Type"
      ) && (
        <td className="py-2 px-2">
          <Select
            value={
              draftLine.Freight1Type ||
              ""
            }
            disabled={
              !isCellEditable(
                "Freight1Type"
              )
            }
            onValueChange={(val) => {
              const selectedType =
                freightTypes?.find(
                  (t: any) =>
                    t.ExpnsCode?.toString() ===
                    val
                );

              const defaultTax =
                selectedType?.VatGroupO ||
                "";

              const updated = {
                ...draftLine,
                Freight1Type:
                  val,
                Freight1TaxGroup:
                  defaultTax,
              };

              setDraftLine(
                updated
              );

              calculateAndUpdate(
                updated
              );
            }}
          >
            <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>

            <SelectContent>
              {freightTypes?.map(
                (type: any) => {
                  const code =
                    type.ExpnsCode;

                  const name =
                    type.ExpnsName;

                  return (
                    <SelectItem
                      key={code}
                      value={code?.toString()}
                      className="text-xs"
                    >
                      {name}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </td>
      )}

      {/* FREIGHT 1 AMOUNT */}
      {isFieldVisible(
        "Freight1LCAmount"
      ) && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            disabled={
              !isCellEditable(
                "Freight1LCAmount"
              )
            }
            value={
              draftLine.Freight1LCAmount ||
              0
            }
            onChange={(e) => {
              const value =
                Number(
                  e.target.value
                );

              setDraftLine(
                (prev) => ({
                  ...prev,
                  Freight1LCAmount:
                    value,
                })
              );
            }}
            onBlur={() =>
              calculateAndUpdate(
                draftLine
              )
            }
          />
        </td>
      )}

      {/* FREIGHT 2 TYPE */}
      {isFieldVisible(
        "Freight2Type"
      ) && (
        <td className="py-2 px-2">
          <Select
            value={
              draftLine.Freight2Type ||
              ""
            }
            disabled={
              !isCellEditable(
                "Freight2Type"
              )
            }
            onValueChange={(val) => {
              const selectedType =
                freightTypes?.find(
                  (t: any) =>
                    t.ExpnsCode?.toString() ===
                    val
                );

              const defaultTax =
                selectedType?.VatGroupO ||
                "";

              const updated = {
                ...draftLine,
                Freight2Type:
                  val,
                Freight2TaxGroup:
                  defaultTax,
              };

              setDraftLine(
                updated
              );

              calculateAndUpdate(
                updated
              );
            }}
          >
            <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>

            <SelectContent>
              {freightTypes?.map(
                (type: any) => {
                  const code =
                    type.ExpnsCode;

                  const name =
                    type.ExpnsName;

                  return (
                    <SelectItem
                      key={code}
                      value={code?.toString()}
                      className="text-xs"
                    >
                      {name}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </td>
      )}

      {/* FREIGHT 2 AMOUNT */}
      {isFieldVisible(
        "Freight2LCAmount"
      ) && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            disabled={
              !isCellEditable(
                "Freight2LCAmount"
              )
            }
            value={
              draftLine.Freight2LCAmount ||
              0
            }
            onChange={(e) => {
              const value =
                Number(
                  e.target.value
                );

              setDraftLine(
                (prev) => ({
                  ...prev,
                  Freight2LCAmount:
                    value,
                })
              );
            }}
            onBlur={() =>
              calculateAndUpdate(
                draftLine
              )
            }
          />
        </td>
      )}

      {/* FREIGHT 3 TYPE */}
      {isFieldVisible(
        "Freight3Type"
      ) && (
        <td className="py-2 px-2">
          <Select
            value={
              draftLine.Freight3Type ||
              ""
            }
            disabled={
              !isCellEditable(
                "Freight3Type"
              )
            }
            onValueChange={(val) => {
              const selectedType =
                freightTypes?.find(
                  (t: any) =>
                    t.ExpnsCode?.toString() ===
                    val
                );

              const defaultTax =
                selectedType?.VatGroupO ||
                "";

              const updated = {
                ...draftLine,
                Freight3Type:
                  val,
                Freight3TaxGroup:
                  defaultTax,
              };

              setDraftLine(
                updated
              );

              calculateAndUpdate(
                updated
              );
            }}
          >
            <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>

            <SelectContent>
              {freightTypes?.map(
                (type: any) => {
                  const code =
                    type.ExpnsCode;

                  const name =
                    type.ExpnsName;

                  return (
                    <SelectItem
                      key={code}
                      value={code?.toString()}
                      className="text-xs"
                    >
                      {name}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </td>
      )}

      {/* FREIGHT 3 AMOUNT */}
      {isFieldVisible(
        "Freight3LCAmount"
      ) && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            disabled={
              !isCellEditable(
                "Freight3LCAmount"
              )
            }
            value={
              draftLine.Freight3LCAmount ||
              0
            }
            onChange={(e) => {
              const value =
                Number(
                  e.target.value
                );

              setDraftLine(
                (prev) => ({
                  ...prev,
                  Freight3LCAmount:
                    value,
                })
              );
            }}
            onBlur={() =>
              calculateAndUpdate(
                draftLine
              )
            }
          />
        </td>
      )}

      {/* UDFS / FBR FIELDS */}
      <LineUDFCells
        docType={config.type}
        line={draftLine}
        disabled={isLineDisabled}
        allowedFields={fieldAccess}
        fmsContext={Object.fromEntries(
          Object.entries(draftLine)
            .filter(
              ([, v]) =>
                v !== null &&
                v !== undefined &&
                typeof v !== "object"
            )
            .map(([k, v]) => [
              k,
              String(v),
            ])
        )}
        onPatch={(patch) => {
          const updated = {
            ...draftLine,
            ...patch,
          };

          setDraftLine(updated);

          updateLine(
            line.ItemCode,
            updated
          );
        }}
      />
      
{/* <GenericModal
  open={glAccountModalOpen}
  onClose={() => setGlAccountModalOpen(false)}
  data={glAccountData}
  onSelect={(value) => {
  const selectedAccount = glAccountData.find(
    (account) => account.Code === value
  );

  if (!selectedAccount) return;

  patchLine({
    AccountCode: selectedAccount.Code,
    AccountName: selectedAccount.Name,
    Description: selectedAccount.Name,
    ItemCode: selectedAccount.Code,
    ItemName: selectedAccount.Name,
  });

  setGlAccountModalOpen(false);
}}
  columns={glAccountColumns}
  title="Select G/L Account"
/> */}
<GenericModal
  open={glAccountModalOpen}
  onClose={() => setGlAccountModalOpen(false)}
  data={chartOfAccounts}
  onSelect={(value) => {
    const selectedAccount = chartOfAccounts.find(
      (account: any) => account.Code === value
    );

    if (!selectedAccount) return;

    patchLine({
      AccountCode: selectedAccount.Code,
      AccountName: selectedAccount.Name,
      Description: selectedAccount.Name,
      ItemCode: selectedAccount.Code,
      ItemName: selectedAccount.Name,
    });

    setGlAccountModalOpen(false);
  }}
  columns={glAccountColumns}
  title="Select G/L Account"
  onLoadMore={loadMoreChartOfAccounts}
  hasMore={chartOfAccountsHasMore}
  isLoading={chartOfAccountsLoading}
/>
    </>
  );
}
  /*
   * -------------------------------------------------------
   * ITEM MODE
   * -------------------------------------------------------
   */

  return (
    <>
      {/* ACTIONS */}
      <td className="py-2 px-2 border-r border-neutral-100/10 text-center">
        <Button
          type="button"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-red-100/10"
          onClick={() =>
            removeLine(
              line.ItemCode
            )
          }
          disabled={isLineDisabled}
          title={
            isLineUpdateBlocked
              ? "Lines cannot be removed on financial documents in update mode"
              : isLineClosed
              ? "Line is closed"
              : "Remove line"
          }
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

      {/* ITEM CODE */}
      {isFieldVisible(
        "ItemCode"
      ) && (
        <td className="px-12 py-2">
          <span className="font-medium">
            {line.ItemCode}
          </span>
        </td>
      )}

      {/* ITEM NAME */}
      {isFieldVisible(
        "ItemName"
      ) && (
        <td className="px-2 py-2">
          <span className="block text-left">
            {draftLine.ItemName}
          </span>
        </td>
      )}

      {/* QUANTITY */}
      {isFieldVisible(
        "Quantity"
      ) && (
        <td className="py-2 px-2">
          <div className="flex items-center gap-1">
            <Input
              name={`DocumentLines.${index}.Quantity`}
              className="h-6 w-full text-right"
              type="number"
              step="any"
              value={
                draftLine.Quantity
              }
              onChange={(e) => {
                const val =
                  Number(
                    e.target.value
                  );

                qtyGuard.track(
                  val
                );

                setDraftLine({
                  ...draftLine,
                  Quantity:
                    val,
                });
              }}
              onBlur={(e) => {
                const {
                  ok,
                  value,
                } =
                  qtyGuard.resolve(
                    e.target.value
                  );

                if (!ok) {
                  setDraftLine(
                    (prev) => ({
                      ...prev,
                      Quantity:
                        value,
                    })
                  );
                }
              }}
              disabled={
                !isCellEditable(
                  "Quantity"
                )
              }
            />

            <LineCellFms
              field="Quantity"
              line={draftLine}
              onPatch={patchLine}
              disabled={
                !isCellEditable(
                  "Quantity"
                )
              }
            />
          </div>
        </td>
      )}

      {/* ON HAND */}
      {isFieldVisible(
        "OnHand"
      ) && (
        <td className="py-2 px-2">
          <Input
            name={`DocumentLines.${index}.OnHand`}
            className="h-6 w-full text-right bg-neutral-100"
            type="number"
            value={
              draftLine.OnHand ??
              0
            }
            disabled
            readOnly
          />
        </td>
      )}

      {/* PRICE */}
      {isFieldVisible(
        "Price"
      ) && (
        <td className="py-2 px-2">
          <div className="flex items-center gap-1">
            <Input
              name={`DocumentLines.${index}.Price`}
              className="h-6 w-full text-right"
              type="number"
              step="any"
              min={0}
              disabled={
                !isCellEditable(
                  "Price"
                )
              }
              value={
                draftLine.Price
              }
              onChange={(e) => {
                const val =
                  Number(
                    e.target.value
                  );

                priceGuard.track(
                  val
                );

                setDraftLine({
                  ...draftLine,
                  Price: val,
                });
              }}
              onBlur={(e) => {
                const {
                  ok,
                  value,
                } =
                  priceGuard.resolve(
                    e.target.value
                  );

                if (!ok) {
                  setDraftLine(
                    (prev) => ({
                      ...prev,
                      Price:
                        value,
                    })
                  );
                }
              }}
            />

            <LineCellFms
              field="Price"
              line={draftLine}
              onPatch={patchLine}
              disabled={
                !isCellEditable(
                  "Price"
                )
              }
            />
          </div>
        </td>
      )}

      {/* DISCOUNT */}
      {isFieldVisible(
        "DiscountPercent"
      ) && (
        <td className="py-2 px-2">
          <div className="flex items-center gap-1">
            <Input
              name={`DocumentLines.${index}.DiscountPercent`}
              className="h-6 w-full text-right"
              type="number"
              step="any"
              min={0}
              max={100}
              disabled={
                !isCellEditable(
                  "DiscountPercent"
                )
              }
              value={
                draftLine.DiscountPercent ||
                0
              }
              onChange={(e) => {
                const val =
                  Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        e.target
                          .value
                      ) || 0
                    )
                  );

                setDraftLine({
                  ...draftLine,
                  DiscountPercent:
                    val,
                });
              }}
            />

            <LineCellFms
              field="DiscountPercent"
              line={draftLine}
              onPatch={patchLine}
              disabled={
                !isCellEditable(
                  "DiscountPercent"
                )
              }
            />
          </div>
        </td>
      )}

      {/* TAX CODE */}
      {isFieldVisible(
        "TaxCode"
      ) && (
        <td className="py-2 px-2">
          <div className="flex items-center gap-1">
            <Select
              value={
                draftLine.TaxCode ||
                ""
              }
              disabled={
                !isCellEditable(
                  "TaxCode"
                )
              }
              onValueChange={(val) =>
                patchLine({
                  TaxCode: val,
                })
              }
            >
              <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
                <SelectValue placeholder="Select Tax" />
              </SelectTrigger>

              <SelectContent>
                {freightsWithCharges?.map(
                  (grp: any) => {
                    const code =
                      grp.Code ||
                      grp.code;

                    const name =
                      grp.Name ||
                      grp.name;

                    return (
                      <SelectItem
                        key={code}
                        value={code}
                        className="text-xs"
                      >
                        {code} -{" "}
                        {name ||
                          code}
                      </SelectItem>
                    );
                  }
                )}
              </SelectContent>
            </Select>

            <LineCellFms
              field="TaxCode"
              line={draftLine}
              onPatch={patchLine}
              disabled={
                !isCellEditable(
                  "TaxCode"
                )
              }
            />
          </div>
        </td>
      )}

      {/* TAX AMOUNT */}
      {isFieldVisible(
        "TaxAmount"
      ) && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right bg-neutral-100"
            value={calculateLineTax(
              Number(
                draftLine.Quantity
              ) || 0,
              Number(
                draftLine.Price
              ) || 0,
              Number(
                draftLine.DiscountPercent
              ) || 0,
              Number(
                draftLine.TaxRate
              ) || 0
            )}
            disabled
            readOnly
          />
        </td>
      )}

      {/* WAREHOUSE */}
      {isFieldVisible(
        "WarehouseCode"
      ) && (
        <td className="py-2 px-2">
          <div className="flex items-center gap-1 w-full justify-center">
            <Input
              className="h-6 w-full bg-gray-100 text-gray-500 cursor-not-allowed text-center text-[10px]"
              value={
                draftLine.WarehouseCode ||
                ""
              }
              disabled
              readOnly
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() =>
                setWhDialogOpen(
                  true
                )
              }
              disabled={
                !isCellEditable(
                  "WarehouseCode"
                )
              }
            >
              <Search className="h-4 w-4" />
            </Button>

            <LineCellFms
              field="WarehouseCode"
              line={draftLine}
              onPatch={patchLine}
              disabled={
                !isCellEditable(
                  "WarehouseCode"
                )
              }
            />
          </div>
        </td>
      )}

      {/* BRANCH */}
      {multiBranchEnabled &&
        isFieldVisible(
          "BPLid"
        ) && (
          <td className="py-2 px-2">
            <Input
              className="h-6 w-full bg-gray-100 text-gray-500 cursor-not-allowed text-center text-[10px]"
              value={resolveBranchName(
                draftLine.BPLid,
                allBranches
              )}
              disabled
              readOnly
            />
          </td>
        )}

      {/* UOM CODE */}
     {isFieldVisible(
        "UoMCode"
      ) && (
        <td className="py-2 px-2">
          <div className="flex items-center gap-1">
            <Input
              className="h-6 w-full text-center bg-neutral-100"
              value={
                draftLine.UoMCode ||
                ""
              }
              disabled
              readOnly
            />

            {!isManualUom(
              draftLine.UoMCode
            ) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() =>
                  setUomDialogOpen(
                    true
                  )
                }
                disabled={
                  !isCellEditable(
                    "UoMCode"
                  )
                }
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            <LineCellFms
              field="UoMCode"
              line={draftLine}
              onPatch={patchLine}
              disabled={
                !isCellEditable(
                  "UoMCode"
                )
              }
            />
          </div>
        </td>
      )}

      {/* UOM NAME */}
       {isFieldVisible(
        "UoMName"
      ) && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-center bg-neutral-100"
            value={
              !draftLine.UoMCode ||
              draftLine.UoMCode ===
                "-1"
                ? ""
                : draftLine.MeasureUnit ||
                  getUoMName(
                    draftLine.UoMCode
                  ) ||
                  ""
            }
            disabled
            readOnly
          />
        </td>
      )} 

      {/* LINE TOTAL */}
      {isFieldVisible(
        "LineTotal"
      ) && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            value={
              draftLine.LineTotal ||
              0
            }
            disabled
            readOnly
          />
        </td>
      )}

      {/* FREIGHT 1 TYPE */}
      {isFieldVisible(
        "Freight1Type"
      ) && (
        <td className="py-2 px-2">
          <Select
            value={
              draftLine.Freight1Type ||
              ""
            }
            disabled={
              !isCellEditable(
                "Freight1Type"
              )
            }
            onValueChange={(val) => {
              const selectedType =
                freightTypes?.find(
                  (t: any) =>
                    t.ExpnsCode?.toString() ===
                    val
                );

              const defaultTax =
                selectedType?.VatGroupO ||
                "";

              const updated = {
                ...draftLine,
                Freight1Type:
                  val,
                Freight1TaxGroup:
                  defaultTax,
              };

              setDraftLine(
                updated
              );

              calculateAndUpdate(
                updated
              );
            }}
          >
            <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>

            <SelectContent>
              {freightTypes?.map(
                (type: any) => {
                  const code =
                    type.ExpnsCode;

                  const name =
                    type.ExpnsName;

                  return (
                    <SelectItem
                      key={code}
                      value={code?.toString()}
                      className="text-xs"
                    >
                      {name}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </td>
      )}

      {/* FREIGHT 1 AMOUNT */}
      {isFieldVisible(
        "Freight1LCAmount"
      ) && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            disabled={
              !isCellEditable(
                "Freight1LCAmount"
              )
            }
            value={
              draftLine.Freight1LCAmount ||
              0
            }
            onChange={(e) => {
              const value =
                Number(
                  e.target.value
                );

              setDraftLine(
                (prev) => ({
                  ...prev,
                  Freight1LCAmount:
                    value,
                })
              );
            }}
            onBlur={() =>
              calculateAndUpdate(
                draftLine
              )
            }
          />
        </td>
      )}

      {/* FREIGHT 2 TYPE */}
      {isFieldVisible(
        "Freight2Type"
      ) && (
        <td className="py-2 px-2">
          <Select
            value={
              draftLine.Freight2Type ||
              ""
            }
            disabled={
              !isCellEditable(
                "Freight2Type"
              )
            }
            onValueChange={(val) => {
              const selectedType =
                freightTypes?.find(
                  (t: any) =>
                    t.ExpnsCode?.toString() ===
                    val
                );

              const defaultTax =
                selectedType?.VatGroupO ||
                "";

              const updated = {
                ...draftLine,
                Freight2Type:
                  val,
                Freight2TaxGroup:
                  defaultTax,
              };

              setDraftLine(
                updated
              );

              calculateAndUpdate(
                updated
              );
            }}
          >
            <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>

            <SelectContent>
              {freightTypes?.map(
                (type: any) => {
                  const code =
                    type.ExpnsCode;

                  const name =
                    type.ExpnsName;

                  return (
                    <SelectItem
                      key={code}
                      value={code?.toString()}
                      className="text-xs"
                    >
                      {name}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </td>
      )}

      {/* FREIGHT 2 AMOUNT */}
      {isFieldVisible(
        "Freight2LCAmount"
      ) && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            disabled={
              !isCellEditable(
                "Freight2LCAmount"
              )
            }
            value={
              draftLine.Freight2LCAmount ||
              0
            }
            onChange={(e) => {
              const value =
                Number(
                  e.target.value
                );

              setDraftLine(
                (prev) => ({
                  ...prev,
                  Freight2LCAmount:
                    value,
                })
              );
            }}
            onBlur={() =>
              calculateAndUpdate(
                draftLine
              )
            }
          />
        </td>
      )}

      {/* FREIGHT 3 TYPE */}
      {isFieldVisible(
        "Freight3Type"
      ) && (
        <td className="py-2 px-2">
          <Select
            value={
              draftLine.Freight3Type ||
              ""
            }
            disabled={
              !isCellEditable(
                "Freight3Type"
              )
            }
            onValueChange={(val) => {
              const selectedType =
                freightTypes?.find(
                  (t: any) =>
                    t.ExpnsCode?.toString() ===
                    val
                );

              const defaultTax =
                selectedType?.VatGroupO ||
                "";

              const updated = {
                ...draftLine,
                Freight3Type:
                  val,
                Freight3TaxGroup:
                  defaultTax,
              };

              setDraftLine(
                updated
              );

              calculateAndUpdate(
                updated
              );
            }}
          >
            <SelectTrigger className="h-6 w-full border rounded px-2 text-xs">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>

            <SelectContent>
              {freightTypes?.map(
                (type: any) => {
                  const code =
                    type.ExpnsCode;

                  const name =
                    type.ExpnsName;

                  return (
                    <SelectItem
                      key={code}
                      value={code?.toString()}
                      className="text-xs"
                    >
                      {name}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </td>
      )}

      {/* FREIGHT 3 AMOUNT */}
      {isFieldVisible(
        "Freight3LCAmount"
      ) && (
        <td className="py-2 px-2">
          <Input
            className="h-6 w-full text-right"
            type="number"
            step="any"
            disabled={
              !isCellEditable(
                "Freight3LCAmount"
              )
            }
            value={
              draftLine.Freight3LCAmount ||
              0
            }
            onChange={(e) => {
              const value =
                Number(
                  e.target.value
                );

              setDraftLine(
                (prev) => ({
                  ...prev,
                  Freight3LCAmount:
                    value,
                })
              );
            }}
            onBlur={() =>
              calculateAndUpdate(
                draftLine
              )
            }
          />
        </td>
      )}

      {/* UDFs */}
      <LineUDFCells
        docType={config.type}
        line={draftLine}
        disabled={isLineDisabled}
        allowedFields={
          fieldAccess
        }
        fmsContext={Object.fromEntries(
          Object.entries(
            draftLine
          )
            .filter(
              ([, v]) =>
                v !== null &&
                v !==
                  undefined &&
                typeof v !==
                  "object"
            )
            .map(
              ([k, v]) => [
                k,
                String(v),
              ]
            )
        )}
        onPatch={(patch) => {
          const updated = {
            ...draftLine,
            ...patch,
          };

          setDraftLine(
            updated
          );

          updateLine(
            line.ItemCode,
            updated
          );
        }}
      />

      {/* WAREHOUSE DIALOG */}
      <WarehouseSelectorDialog
        open={whDialogOpen}
        onClose={() =>
          setWhDialogOpen(
            false
          )
        }
        onSelect={(wh: any) => {
          const qtyInWhs =
            line.QtyInWhs ||
            [];

          const whRecord =
            qtyInWhs.find(
              (w: any) =>
                (w.WarehouseCode ||
                  w.warehouseCode) ===
                wh.WhsCode
            );

          const whOnHand =
            whRecord
              ? whRecord.Qty ??
                whRecord.qty ??
                0
              : 0;

          const updated = {
            ...draftLine,
            WarehouseCode:
              wh.WhsCode,
            BPLid:
              wh.BPLid,
            OnHand:
              whOnHand,
          };

          setDraftLine(
            updated
          );

          updateLine(
            line.ItemCode,
            updated
          );
        }}
        itemCode={
          line.ItemCode
        }
        itemQtyInWhs={
          line.QtyInWhs
        }
      />

      {/* UOM DIALOG */}
      <UoMSelectorDialog
        open={uomDialogOpen}
        onClose={() =>
          setUomDialogOpen(
            false
          )
        }
        onSelect={(uom) => {
          patchLine({
            UoMCode: uom.Code,
            MeasureUnit:
              uom.Name,
          });
        }}
      />

      {/* COGS MODAL */}
      <GenericModal
        open={cogsModalOpen}
        onClose={() =>
          setCogsModalOpen(
            false
          )
        }
        onSelect={(val) => {
          setDraftLine({
            ...draftLine,
            [activeField]: val,
          });

          setCogsModalOpen(
            false
          );
        }}
        data={cogsData}
        columns={[
          {
            key: "Code",
            label: "Code",
          },
          {
            key: "Name",
            label: "Name",
          },
        ]}
        title="Select Distribution Rule"
        getSelectValue={(item) =>
          item.Code
        }
      />
    </>
  );
}
 
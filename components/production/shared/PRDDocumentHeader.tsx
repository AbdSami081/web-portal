import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { usePRDDocConfig } from "./PRDDocumentLayout";
import { getPRDOrder } from "@/api+/sap/production/productionService";

export function PRDDocumentHeader() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { loadFromDocument } = useIFPRDDocument();
  const config = usePRDDocConfig();

   const fetchDocument = async (baseRef: string) => {
    
      var documentData:any;
      if (!baseRef) {
        toast.error("Invalid Document Number entered.");
        return;
      }

      setIsLoading(true);
      try {
          // if (config.type === DocumentType.IssueForProduction) 
          // {
          //     documentData = await getPRDOrder(Number(baseRef));
          // }
          // documentData = {
          //     AbsoluteEntry: 155,
          //     DocumentNumber: 155,
          //     Series: 23,
          //     ItemNo: "P10001",
          //     ProductionOrderStatus: "boposPlanned",
          //     ProductionOrderType: "bopotStandard",
          //     PlannedQuantity: 100.0,
          //     CompletedQuantity: 0.0,
          //     RejectedQuantity: 0.0,
          //     PostingDate: "2021-06-21T00:00:00Z",
          //     DueDate: "2021-06-21T00:00:00Z",
          //     ProductionOrderOriginEntry: null,
          //     ProductionOrderOriginNumber: null,
          //     ProductionOrderOrigin: "bopooManual",
          //     UserSignature: 1,
          //     Remarks: null,
          //     ClosingDate: null,
          //     ReleaseDate: null,
          //     CustomerCode: null,
          //     Warehouse: "01",
          //     InventoryUOM: null,
          //     JournalRemarks: "Production Order - P10001",
          //     TransactionNumber: null,
          //     CreationDate: "2021-06-21T00:00:00Z",
          //     Printed: "tNO",
          //     DistributionRule: "",
          //     Project: "",
          //     DistributionRule2: "",
          //     DistributionRule3: "",
          //     DistributionRule4: "",
          //     DistributionRule5: "",
          //     UoMEntry: -1,
          //     StartDate: "2021-06-21T00:00:00Z",
          //     ProductDescription: "PC - 8x core, DDR 32GB, 2TB HDD",
          //     Priority: 100,
          //     RoutingDateCalculation: "raOnStartDate",
          //     UpdateAllocation: "bouaManual",
          //     SAPPassport: null,
          //     AttachmentEntry: null,
          //     PickRemarks: null,
          //     ProductionOrderLines: [
          //         {
          //             DocumentAbsoluteEntry: 155,
          //             LineNumber: 0,
          //             ItemNo: "C00001",
          //             BaseQuantity: 1.0,
          //             PlannedQuantity: 100.0,
          //             IssuedQuantity: 0.0,
          //             ProductionOrderIssueType: "im_Manual",
          //             Warehouse: "01",
          //             VisualOrder: 0,
          //             DistributionRule: null,
          //             LocationCode: null,
          //             Project: null,
          //             DistributionRule2: null,
          //             DistributionRule3: null,
          //             DistributionRule4: null,
          //             DistributionRule5: null,
          //             UoMEntry: -1,
          //             UoMCode: -1,
          //             WipAccount: null,
          //             ItemType: "pit_Item",
          //             LineText: null,
          //             AdditionalQuantity: 0.0,
          //             ResourceAllocation: null,
          //             StartDate: "2021-06-21T00:00:00Z",
          //             EndDate: "2021-06-21T00:00:00Z",
          //             StageID: null,
          //             RequiredDays: 0.0,
          //             ItemName: "Motherboard BTX",
          //             WeightOfRecycledPlastic: null,
          //             PlasticPackageExemptionReason: null,
          //             SerialNumbers: [],
          //             BatchNumbers: []
          //         },
          //         {
          //             DocumentAbsoluteEntry: 155,
          //             LineNumber: 1,
          //             ItemNo: "C00003",
          //             BaseQuantity: 1.0,
          //             PlannedQuantity: 100.0,
          //             IssuedQuantity: 0.0,
          //             ProductionOrderIssueType: "im_Manual",
          //             Warehouse: "01",
          //             VisualOrder: 1,
          //             DistributionRule: null,
          //             LocationCode: null,
          //             Project: null,
          //             DistributionRule2: null,
          //             DistributionRule3: null,
          //             DistributionRule4: null,
          //             DistributionRule5: null,
          //             UoMEntry: -1,
          //             UoMCode: -1,
          //             WipAccount: null,
          //             ItemType: "pit_Item",
          //             LineText: null,
          //             AdditionalQuantity: 0.0,
          //             ResourceAllocation: null,
          //             StartDate: "2021-06-21T00:00:00Z",
          //             EndDate: "2021-06-21T00:00:00Z",
          //             StageID: null,
          //             RequiredDays: 0.0,
          //             ItemName: "Quadcore CPU 3.4 GHz",
          //             WeightOfRecycledPlastic: null,
          //             PlasticPackageExemptionReason: null,
          //             SerialNumbers: [],
          //             BatchNumbers: []
          //         }
          //     ],
          //     ProductionOrdersSalesOrderLines: [],
          //     ProductionOrdersStages: [],
          //     ProductionOrdersDocumentReferences: []
          // }
           documentData = {
              Series: 23,
              ProductionOrderLines: [
                  {
                    ItemNo: "ASDW23123",
                    ItemName: "Test Item 1",
                    PlannedQuantity: 100,
                    Warehouse: "01",
                    ItemType: "pit_Item"
                  }
              ],
          }

          if (documentData) {
            loadFromDocument(documentData)
            // setValue("DocDate", documentData.DocDate?.split("T")[0]);
            // setValue("DocDueDate", documentData.DocDueDate?.split("T")[0]);
            // setValue("CardCode", documentData.CardCode);
            // setValue("CardName", documentData.CardName);
            // setValue("DocStatus", documentData.DocumentStatus);
            // setValue("Address2", documentData.Address2);
            // setValue("Address", documentData.Address);
            // setValue("DocEntry", documentData.DocEntry);
          } else {
            toast.info(`Document number ${baseRef} not found.`);
          }
        } catch (error) {
          toast.error("An error occurred while fetching the document.");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Label className="w-20">Order Number</Label>
          <Input
            type="text"
            {...register("BaseRef")}
            className="h-8 w-48"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchDocument(searchValue); 
              }
            }}
            placeholder="Enter Order Number"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => fetchDocument(searchValue)} 
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" /> 
            )}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Label className="w-20">Reference</Label>
          <Input
            type="text"
            {...register("Ref2")}
            className="h-8 w-48"
            placeholder="Enter Reference"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex justify-between items-center w-full">
            <Label className="text-sm w-28">Document Date</Label>
            <Input type="date" {...register("TaxDate")} className="h-8 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

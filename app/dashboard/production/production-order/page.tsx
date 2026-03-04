"use client"

import { productionOrderSchema, ProductionOrderFormData } from "@/lib/schemas/productionOrderSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { useMemo, useEffect } from "react";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { postProductionOrder, patchProductionOrder } from "@/api+/sap/production/productionService";
import { toast } from "sonner";

export default function ProductionOrderPage() {
    const { reset: resetStore } = useIFPRDDocument();

    useEffect(() => {
        return () => {
            resetStore();
        };
    }, [resetStore]);

    const defaultValues: ProductionOrderFormData = useMemo(() => ({
        ItemNo: "",
        ProductDescription: "",
        PlannedQuantity: 1,
        Warehouse: "",
        Priority: 100,
        StartDate: new Date().toISOString().split("T")[0],
        CreationDate: new Date().toISOString().split("T")[0],
        DueDate: new Date().toISOString().split("T")[0],
        Comments: "",
        Remarks: "",
        PickRmrk: "",
        AbsoluteEntry: 0,
        PostingDate: new Date().toISOString().split("T")[0],
        ProductionOrderType: "bopotStandard",
    }), []);

    const handleSubmit = async (data: ProductionOrderFormData) => {
        const { lines, attachments } = useIFPRDDocument.getState();

        const payload: any = {
            Remarks: data.Remarks || data.Comments,
            Attachments2_Lines: attachments.map((att) => ({
                FileExtension: att.FileName.split('.').pop(),
                FileName: att.FileName.split('.').slice(0, -1).join('.'),
                SourcePath: att.SourcePath,
                FreeText: att.FreeText,
                CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
            })),
        };

        try {
            let res;
            if (data.AbsoluteEntry && data.AbsoluteEntry > 0) {
                res = await patchProductionOrder(data.AbsoluteEntry, payload);
                toast.success("Production Order updated successfully");
            } else {
                payload.ItemNo = data.ItemNo;
                payload.PlannedQuantity = data.PlannedQuantity;
                payload.PostingDate = data.PostingDate || data.CreationDate;
                payload.StartDate = data.StartDate;
                payload.DueDate = data.DueDate;
                payload.Warehouse = data.Warehouse;
                payload.Priority = data.Priority;
                payload.ProductionOrderType = data.ProductionOrderType || "bopotStandard";
                payload.PickRemarks = data.PickRmrk || "Created via Web Portal";
                payload.ProductionOrderLines = lines.map(line => ({
                    ItemNo: line.ItemNo,
                    BaseQuantity: line.BaseQuantity || 1,
                    PlannedQuantity: line.PlannedQuantity,
                    IssuedQuantity: line.IssuedQuantity || 0,
                    ProductionOrderIssueType: line.ProductionOrderIssueType || "im_Manual",
                    Warehouse: line.Warehouse || data.Warehouse
                }));
                res = await postProductionOrder(payload);
                toast.success("Production Order created successfully");
            }

            if (res || (data.AbsoluteEntry && data.AbsoluteEntry > 0)) {
                resetStore();
            }
        } catch (error) {
            toast.error("Failed to process Production Order");
        }
    };

    return (
        <PRDDocumentLayout
            schema={productionOrderSchema}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            docType={DocumentType.ProductionOrder}
        >
            <PRDDocumentHeader />
            <PRDDocumentItems />
            <PRDDocumentFooter />
        </PRDDocumentLayout>
    );
}

"use client"

import { productionOrderSchema, ProductionOrderFormData } from "@/lib/schemas/productionOrderSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { useMemo, useEffect } from "react";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { postProductionOrder } from "@/api+/sap/production/productionService";
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
    }), []);

    const handleSubmit = async (data: ProductionOrderFormData) => {
        const { lines } = useIFPRDDocument.getState();

        const payload = {
            ItemNo: data.ItemNo,
            PlannedQuantity: data.PlannedQuantity,
            PostingDate: data.PostingDate || data.CreationDate,
            StartDate: data.StartDate,
            DueDate: data.DueDate,
            Warehouse: data.Warehouse,
            Priority: data.Priority,
            ProductionOrderType: "bopotStandard", // Default value
            Remarks: data.Remarks || data.Comments,
            PickRemarks: data.PickRmrk || "Created via Web Portal",
            ProductionOrderLines: lines.map(line => ({
                ItemNo: line.ItemNo,
                BaseQuantity: line.BaseQuantity || 1,
                PlannedQuantity: line.PlannedQuantity,
                IssuedQuantity: line.IssuedQuantity || 0,
                ProductionOrderIssueType: line.ProductionOrderIssueType || "im_Manual",
                Warehouse: line.Warehouse || data.Warehouse
            }))
        };

        try {
            const res = await postProductionOrder(payload);
            if (res) {
                toast.success("Production Order created successfully");
                resetStore();
            }
        } catch (error) {
            toast.error("Failed to create Production Order");
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

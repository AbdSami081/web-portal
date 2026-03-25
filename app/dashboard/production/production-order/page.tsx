"use client"

import { productionOrderSchema, ProductionOrderFormData } from "@/lib/schemas/productionOrderSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { useMemo, useEffect } from "react";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { saveProductionDocument } from "@/api+/sap/production/productionService";
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
        ProductionOrderStatus: "boposPlanned",
    }), []);

    const handleSubmit = async (data: ProductionOrderFormData) => {
        const { lines, attachments } = useIFPRDDocument.getState();

        try {
            const result = await saveProductionDocument(DocumentType.ProductionOrder, data, lines, attachments);
            const docNum = useIFPRDDocument.getState().DocNum;
            toast.success(data.AbsoluteEntry && data.AbsoluteEntry > 0 ? `Production Order #${docNum || data.AbsoluteEntry} updated successfully` : `Production Order #${result?.DocNum || result?.DocumentNumber } created successfully`);
            resetStore();
        } catch (error: any) {
            console.error("Error while processing Production Order:", error);
            toast.error(error.message || "Failed to process Production Order");
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

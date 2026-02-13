"use client"

import { productionOrderSchema, ProductionOrderFormData } from "@/lib/schemas/productionOrderSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { useMemo, useEffect } from "react";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";

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
        AbsoluteEntry: 0,
    }), []);

    const handleSubmit = async (data: ProductionOrderFormData) => {
        try {
            console.log("Submitting Production Order:", data);
            // Implementation for posting would go here
        } catch (error) {
            console.error("Error while creating production order:", error);
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

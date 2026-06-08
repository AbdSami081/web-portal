"use client"

import { productionOrderSchema, ProductionOrderFormData } from "@/lib/schemas/productionOrderSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { useMemo, useEffect } from "react";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { patchProductionOrder, saveProductionDocument } from "@/api+/sap/production/productionService";
import { toast } from "sonner";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { DocumentType } from "@/types/master/DocumentType";
import { useRouter } from "next/navigation";

export default function ProductionOrderPage() {
    const { reset: resetStore, setSourceNavigation } = useIFPRDDocument();
    const router = useRouter();

    useEffect(() => {
        // Mark the source as ProductionOrder for navigation tracking
        setSourceNavigation(DocumentType.ProductionOrder);
        
        return () => {
            // Only reset if we're not navigating to ITR/IssueForProduction
            // This will be handled in PRDDocumentLayout based on destination
        };
    }, [setSourceNavigation]);

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
            const result = await saveProductionDocument(
                DocumentType.ProductionOrder,
                data,
                lines,
                []
            );

            const savedDocEntry = Number(data.AbsoluteEntry || result?.AbsoluteEntry || result?.DocEntry || 0);

            if (savedDocEntry > 0 && attachments.length > 0) {
                const attachmentResult = await uploadAndPatchAttachments(
                    attachments,
                    "ProductionOrder",
                    savedDocEntry,
                    (docEntry, payload) => patchProductionOrder(docEntry, {
                        ItemNo: data.ItemNo,
                        Remarks: data.Remarks || data.Comments,
                        ProductionOrderStatus: data.ProductionOrderStatus || "boposPlanned",
                        ...payload,
                    })
                );

                if (attachmentResult.uploadedCount > 0) {
                    toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
                }
            }

            const docNum = useIFPRDDocument.getState().DocNum;

            toast.success(
                data.AbsoluteEntry && data.AbsoluteEntry > 0
                    ? `Production Order #${docNum || data.AbsoluteEntry} updated successfully`
                    : `Production Order #${result?.DocNum || result?.DocumentNumber} created successfully`
            );
        
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

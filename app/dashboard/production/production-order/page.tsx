"use client"

import { productionOrderSchema, ProductionOrderFormData } from "@/lib/schemas/productionOrderSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { useMemo, useEffect } from "react";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { saveProductionDocument } from "@/api+/sap/production/productionService";
import { toast } from "sonner";
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";
import { DocumentType } from "@/types/master/DocumentType";

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
            const newAttachments = attachments.filter(att => att.File);
            const existingAttachments = attachments.filter(att => !att.File);

            let uploadedAttachments: any[] = [];

            if (newAttachments.length > 0) {
                try {
                    const filesToUpload = newAttachments.map(att => att.File as File);

                    const uploadResults = await uploadAttachments(filesToUpload, "ProductionOrder");

                    toast.success(`${uploadResults.length} attachments uploaded successfully`);

                    uploadedAttachments = newAttachments.map((att, index) => ({
                        ...att,
                        SourcePath: uploadResults[index].path, 
                    }));
                } catch (error) {
                    console.error("Attachment upload failed", error);
                    toast.error("Failed to upload attachments");
                    return;
                }
            }

            const processedAttachments = [...existingAttachments, ...uploadedAttachments];

            const result = await saveProductionDocument(
                DocumentType.ProductionOrder,
                data,
                lines,
                processedAttachments
            );

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

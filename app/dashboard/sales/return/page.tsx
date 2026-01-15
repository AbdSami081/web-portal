"use client"

import { postSalesReturn } from "@/api+/sap/quotation/salesService";
import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";

import {
  QuotationFormData,
  quotationSchema,
} from "@/lib/schemas/quotationSchema";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { toast } from "sonner";

export default function SalesReturnPage() {
    const loadFromDocument = useSalesDocument((state) => state.loadFromDocument);
    // const {loadFromDocument} = useSalesDocument();

  const defaultValues: QuotationFormData = {
    CardCode: "",
    CardName: "",
    DocDate: new Date().toISOString().split("T")[0],
    DocDueDate: new Date().toISOString().split("T")[0],
    DiscountPercent: 0,
    Freight: 0,
    Rounding: 0,
    Comments: "",
    TotalBeforeDiscount: 0,
    TaxTotal: 0,
    DocTotal: 0,
    TaxDate:"",
    DocumentLines: [],
  };

 const handleSubmit = async (data: QuotationFormData) => {
     const { lines, DocTotal } = useSalesDocument.getState();
 
     // Destructure the data and exclude extra fields 
    // const { CardName, DocDate, DocDueDate, TaxDate, ...restData } = data;
    
    
    const payload = {
       ...data,
       DocTotal,
       DocumentLines: lines,
     };

    console.log("Submitting Sales Return Payload:", payload);
     try {
       const documentData = await postSalesReturn(payload); 
 
       if (!documentData?.DocEntry) {
         throw new Error("Failed to create return");
       }
       
       loadFromDocument(documentData)
       // setValue("DocDate", documentData.DocDate?.split("T")[0]);
       // setValue("DocDueDate", documentData.DocDueDate?.split("T")[0]);
       // setValue("CardCode", documentData.CardCode);
       // setValue("CardName", documentData.CardName);
       // setValue("DocStatus", documentData.DocumentStatus);
       // setValue("Address2", documentData.Address2);
       // setValue("Address", documentData.Address);
       // setValue("DocEntry", documentData.DocEntry);
 
       toast.success(`Return #${documentData.DocNum} created successfully`);
 
     } catch (error) {
       console.error("Error while creating return:", error);
     }
   };
 

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={16}
    >
      <DocumentHeader />
      <DocumentItems />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}






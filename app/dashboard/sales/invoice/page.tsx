"use client"
// import {
//   json,
//   type ActionFunctionArgs,
//   type LoaderFunctionArgs,
// } from "@remix-run/node";
import axios from "axios";
// import { useToast } from "@/hooks/use-toast";

import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; 
import {
  QuotationFormData,
  quotationSchema,
} from "@/lib/schemas/quotationSchema";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentType } from "@/types/sales/salesDocuments.type";
// import { encodeToastParam } from "/lib/toastQuery";

// export async function loader({ request }: LoaderFunctionArgs) {
//   return json({});
// }

// export async function action({ request }: ActionFunctionArgs) {
//   return json({ success: true });
// }

export default function NewQuotationPage() {
  // const { toast } = useToast();
  const router = useRouter();

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
    const { lines } = useSalesDocument.getState();
    const payload = {
      ...data,
      DocumentLines: lines,
    };
    console.log("Submitting Quotation Payload:", payload);
    // console.log("lines from Zustand:", useSalesDocument.getState().lines);

    // try {
    //   const res = await axios.post("/api/sap/salesdocument", {
    //     type: DocumentType.Quotation,
    //     data: payload,
    //   });
    //   if (res.status !== 201) {
       
    //     const serverErrorMessage =
    //       res.data?.error || "Unknown error occurred while creating quotation";
        
    //     throw new Error("Failed to create quotation");
    //   }

    //   const doc = res.data?.data;
    //   if (!doc?.DocEntry) throw new Error("Missing DocEntry from response");

      
    //   const toastPayload = {
    //     title: "Quotation Created",
    //     description: `Quotation #${doc.DocNum} saved successfully`,
    //   };
      
    //   // Navigate SPA-style
    //   router.push(`/dashboard/sales/quotations/${doc.DocEntry}?toast=${JSON.stringify(toastPayload)}`);
      
    // } catch (error: any) {
    //   console.error("Error creating quotation:", error);  
    //   const message =
    //     error?.response?.data?.error ||
    //     error?.message ||
    //     "Unknown SAP error occurred";
    
    // }



    try {
  const res = {
    status: 201,
    data: {
      data: {
        DocEntry: Math.floor(Math.random() * 10000), // Random ID
        DocNum: Math.floor(Math.random() * 1000000), // Random Doc Number
        CardCode: payload.CardCode,
        CardName: payload.CardName,
        DocDate: payload.DocDate || new Date().toISOString().split("T")[0],
        DocTotal: payload.DocTotal,
        DocumentLines: lines || [],
       
      },
    },
  };


  if (res.status !== 201) {
    throw new Error("Failed to create invoice");
  }

  const doc = res.data?.data;
  if (!doc?.DocEntry) throw new Error("Missing DocEntry from response");

  // 🧾 Dummy toast payload
  const toastPayload = {
    title: "Quotation Created (Dummy)",
    description: `Quotation #${doc.DocNum} saved successfully`,
  };
  console.log("Quotation Created (Dummy):", doc);
  // ✅ Navigate SPA-style with simulated data
  console.log("Doc.Entry:", doc.DocEntry);
  
} catch (error) {
  console.error("Error while creating quotation:", error);
}

  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={13}
    >
      <DocumentHeader />
      <DocumentItems />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}






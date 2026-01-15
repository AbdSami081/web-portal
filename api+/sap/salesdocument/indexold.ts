// import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
// import { json } from "zod";
// import { z } from "zod";
// import { sapApi } from "@/lib/sap/service_layer/auth";
// import {
//   DocumentType,
//   SalesQuotation,
// } from "@/types/sales/salesDocuments.type";

// /**
//  * Generic SAP Sales Document creation route
//  * Accepts a payload with a "resource" field (e.g., "Quotations", "Orders", "DeliveryNotes", "Invoices")
//  * and forwards the rest of the body as-is to SAP Service Layer
//  */

// export async function loader({ request }: LoaderFunctionArgs) {
//   // This route is not intended to be accessed directly, so we return an empty response
//   return json({ success: true });
// }

// const postBodySchema = z.object({
//   type: z.nativeEnum(DocumentType),
//   data: z.record(z.any()), // You can later narrow by per-type schema
// });
// export async function action({ request }: ActionFunctionArgs) {
//   try {
//     //console.log("🚀 Creating sales document:");
//     const body = await request.json();
//     const parsed = postBodySchema.safeParse(body);
//     //console.log("🚀 Creating sales document:", body);
//     if (!parsed.success) {
//       return json(
//         { success: false, error: "Invalid document format" },
//         { status: 400 }
//       );
//     }
//     const test = true;
//     if (test) {
//       const data = {
//         DocEntry: 500,
//         DocNum: 500,
//       };
//       return json(
//         { success: true, message: "Test mode", data },
//         { status: 201 }
//       );
//     }

//     const { type, data } = parsed.data;
//     const endpoint = getSAPDocumentEndpoint(type);

//     const response = await sapApi(endpoint, {
//       method: "POST",
//       data: data,
//     });
//     if (response.status === 201) {
//       //console.log("🚀 response document:", response);
//       const documentData = response?.data;
//       return json({
//         success: true,
//         message: "Successfully Created",
//         data: documentData,
//       });
//     }
//     console.error("❌ Failed to create document:", response);
//     return json(
//       { success: false, error: "Failed to create document" },
//       { status: 500 }
//     );
//   } catch (error: any) {
//     console.error("❌ Failed to create sales document:", error);
//     return json(
//       { success: false, error: error.message || "Unknown error" },
//       { status: 500 }
//     );
//   }
// }

// function getSAPDocumentEndpoint(type: DocumentType): string {
//   switch (type) {
//     case DocumentType.Quotation:
//       return "/Quotations";
//     case DocumentType.Order:
//       return "/Orders";
//     case DocumentType.Delivery:
//       return "/Deliveries";
//     case DocumentType.ARInvoice:
//       return "/Invoices";
//     default:
//       throw new Error(`Invalid DocumentType: ${type}`);
//   }
// }

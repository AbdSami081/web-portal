// File: app/routes/resources/master-data.tsx
// import { json } from "@remix-run/node";
// import { MasterDataService } from "~/lib/sap/service_layer/masterDataService";

// export async function loader({ request }: { request: Request }) {
//   try {
//     const url = new URL(request.url);
//     const top = Number(url.searchParams.get("top") || "50");
//     const skip = Number(url.searchParams.get("skip") || "0");
//     const search = url.searchParams.get("search") || "";
//     const response = await MasterDataService.getWarehouses({
//       top,
//       skip,
//       search,
//     });
//     const warehouses = response || [];
//     return json({ warehouses });
//   } catch (error) {
//     console.error("❌ Error fetching warehouses:", error);
//     return json({ warehouses: [] }); // Return an empty array on error
//   }
// }

import apiClient from "@/lib/apiClient";
import { Warehouse } from "@/types/warehouse/warehouse";

export const getwarehouses = async (): Promise<Warehouse[]> => {
  try {
    const res = await apiClient.get(`api/Sales/GetWarehouse`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Failed to fetch warehouse", err);
    return [];
  }
};


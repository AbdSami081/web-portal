// // 1) Create a loader at app/routes/api/sap/master-data/business-partners.ts
// import { json } from "zod"; 
// import { MasterDataService } from "@/lib/sap/service_layer/masterDataService"; 

// export async function loader({ request }: { request: Request }) {
//   try {
//     const url = new URL(request.url);
//     const top = Number(url.searchParams.get("top") || "50");
//     const skip = Number(url.searchParams.get("skip") || "0");
//     const search = url.searchParams.get("search") || "";
//     console.log("Fetching business partners with params:", {
//       top,
//       skip,
//       search,
//     });
//     const businessPartners = await MasterDataService.getCustomers({
//       top,
//       skip,
//       search,
//     });
//     return json({ businessPartners });
//   } catch (error) {
//     console.error("❌ Error fetching business partners:", error);
//     return json({ businessPartners: [] }); // Return an empty array on error
//   }
// }
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import axios from "axios";
import { API_URL } from "@/types/config";

export const getCustomers = async (search = "", skip = 0, top = 10): Promise<BusinessPartner[]> => {
  try {
    const res = await axios.get(`${API_URL}GetCustomers`, {
      params: {
        search: search,
        skip: skip,
        top: top
      }
    });

    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Failed to fetch customers", err);
    return [];
  }
};

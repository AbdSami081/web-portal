// import { json, LoaderFunctionArgs } from "@remix-run/node";
// import { MasterDataService } from "~/lib/sap/service_layer/masterDataService";
// export async function loader({ request  }: LoaderFunctionArgs) {
//   try {
//     //console.log("items_api loader...");
//     // get search params from the request
//     const url = new URL(request.url);
//     const searchParams = url.searchParams.get("search") || "";
//     const top = parseInt(url.searchParams.get("top") || "50", 50);
//     const skip = parseInt(url.searchParams.get("skip") || "0", 50);
//     //console.log("items_api_skip", skip);
//     //const filter = url.searchParams.get("filter") || "";
//     //const orderBy = url.searchParams.get("orderBy") || "ItemCode";
//     //const order = url.searchParams.get("order") || "asc";
//     const search = searchParams.replace(/'/g, "''"); // Escape single quote
//     //console.log("Search:", search, "Top:", top, "Skip:", skip);
//     const response = await MasterDataService.getItems(search, top, skip);
//     //console.log("Items_Remix_API_Response:", response);
//     const data = response || [];
//     return json({ data });
//   } catch (error) {
//     console.error("❌ Error fetching items lists:", error);
//     return json([]); // Return an empty array on error
//   }
// }

// 1) Create a loader at app/routes/api/sap/master-data/items.ts
// import { json } from "zod";
// import { MasterDataService } from "@/lib/sap/service_layer/masterDataService";

// export async function loader({ request }: { request: Request }) {
//   const url = new URL(request.url);
//   const top = Number(url.searchParams.get("top") || "50");
//   const skip = Number(url.searchParams.get("skip") || "0");
//   const search = url.searchParams.get("search") || "";

//   const items = await MasterDataService.getItems({ top, skip, search });
//   return json({ items });
// }

import apiClient from "@/lib/apiClient";
import { Item } from "@/types/sales/Item.type";

export const getItemsList = async (search = "", skip = 0, top = 10): Promise<Item[]> => {
  try {
    const res = await apiClient.get(`api/Sales/GetItems`, {
      params: {
        search: search,
        skip: skip,
        top: top
      },
    });

    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Failed to fetch items", err);
    return [];
  }
};
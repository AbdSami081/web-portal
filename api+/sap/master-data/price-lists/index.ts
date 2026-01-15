import { json } from "zod";
import { MasterDataService } from "@/lib/sap/service_layer/masterDataService";
export async function loader() {
  try {
    const response = await MasterDataService.getPriceLists();
    //console.log("Price Lists:", response);
    const priceLists = response.data || [];
    return json({ priceLists });
  } catch (error) {
    console.error("❌ Error fetching price lists:", error);
    return json({ priceLists: [] }); // Return an empty array on error
  }
}

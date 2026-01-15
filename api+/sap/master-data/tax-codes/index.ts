import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { MasterDataService } from "~/lib/sap/service_layer/masterDataService";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const taxCodes = await MasterDataService.getTaxCodes();
    return json({ taxCodes });
  } catch (error: any) {
    console.error("❌ Failed to fetch tax codes:", error);
    return json({ error: "Failed to fetch tax codes" }, { status: 500 });
  }
}

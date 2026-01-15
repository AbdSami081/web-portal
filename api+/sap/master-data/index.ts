// File: app/routes/resources/master-data.tsx
import { json } from "@remix-run/node";
import { MasterDataService } from "~/lib/sap/service_layer/masterDataService";

export async function loader() {
  const response = await MasterDataService.fetchMasterData();
  if (!response) {
    return json({ error: "Failed to fetch master data" }, { status: 500 });
  }
  const { items, customers, warehouses, priceLists, vatGroups, uoms } = response;
  if (!items || !customers) {
    return json(
      { error: "Incomplete master data items & customer" },
      { status: 500 }
    );
  }
  if (!warehouses || !priceLists || !vatGroups || !uoms) {
    console.log(
      "Incomplete master data for warehouses, priceLists, vatGroups, uoms"
    );
    //return json({ error: "Incomplete master data" }, { status: 500 });
  }
  return json({ items, customers, warehouses, priceLists, vatGroups, uoms });
}

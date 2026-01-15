// app/lib/sap/ItemMasterService.ts

import { sapApi } from "./auth";

type FetchItemsParams = {
  top?: number;
  skip?: number;
  searchTerm?: string;
};

export async function fetchItems({ top = 20, skip = 0, searchTerm = "" }: FetchItemsParams) {
  const query = new URLSearchParams({
    $select: "ItemCode,ItemName",
    $top: top.toString(),
    $skip: skip.toString(),
  });

  if (searchTerm) {
    query.append("$filter", `contains(ItemName,'${searchTerm}')`);
  }

  try {
    const response = await sapApi.get(`/Items?${query.toString()}`, {
      headers: {
        Prefer: `odata.maxpagesize=${top}`, // Optional, can be tuned
      },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching items from SAP:", error);
    throw new Error("Failed to fetch items from SAP");
  }
}

import { cachedGet } from "@/lib/apiClient";

export interface PriceList {
  id: number;
  name: string;
}

export async function getPriceLists(): Promise<PriceList[]> {
  const data = await cachedGet<any>("api/Master/GetPriceList", {
    timeout: 10000,
  });
  const lists = Array.isArray(data)
    ? data
    : data?.value ?? data?.priceLists ?? data?.data ?? [];

  if (!Array.isArray(lists)) {
    throw new Error("Invalid price lists response.");
  }

  return lists
    .map((list: any) => ({
      id: Number(list.id ?? list.PriceListNo ?? list.PriceListNum ?? list.ListNum),
      name: String(list.name ?? list.PriceListName ?? list.Name ?? ""),
    }))
    .filter((list: PriceList) => Number.isFinite(list.id) && list.name);
}

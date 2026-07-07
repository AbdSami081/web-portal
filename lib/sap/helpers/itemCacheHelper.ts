import { getItemsList } from "@/api+/sap/master-data/items";
import { Item } from "@/types/sales/Item.type";

const cache = new Map<string, Item>();
const pending = new Map<string, Promise<Item | undefined>>();

export async function fetchItemByCode(itemCode: string): Promise<Item | undefined> {
  if (!itemCode) return undefined;

  const cached = cache.get(itemCode);
  if (cached) return cached;

  const inFlight = pending.get(itemCode);
  if (inFlight) return inFlight;

  const request = getItemsList(itemCode, 0, 1)
    .then((items) => {
      const item = items.find((i) => i.ItemCode === itemCode);
      if (item) cache.set(itemCode, item);
      return item;
    })
    .finally(() => {
      pending.delete(itemCode);
    });

  pending.set(itemCode, request);
  return request;
}

export async function fetchItemsByCodes(itemCodes: string[]): Promise<Map<string, Item>> {
  const uniqueCodes = [...new Set(itemCodes.filter(Boolean))];
  const results = await Promise.all(uniqueCodes.map((code) => fetchItemByCode(code)));

  const map = new Map<string, Item>();
  uniqueCodes.forEach((code, index) => {
    const item = results[index];
    if (item) map.set(code, item);
  });
  return map;
}

export function clearItemCache() {
  cache.clear();
  pending.clear();
}

import { getItemsList, getItemsByCodes } from "@/api+/sap/master-data/items";
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

const BULK_CHUNK_SIZE = 500;

/**
 * Bulk-fetch many item codes in fixed-size chunks — one network round-trip
 * per chunk instead of one per code, so this scales to tens of thousands of
 * codes (e.g. a large Excel paste) without opening thousands of requests.
 * Populates the same cache `fetchItemByCode` reads, and reads from it first
 * so already-known codes never re-fetch. `onProgress` fires after each chunk
 * (not per-row) so callers can show a lightweight progress indicator.
 */
export async function fetchItemsByCodesBulk(
  itemCodes: string[],
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, Item>> {
  const uniqueCodes = [...new Set(itemCodes.filter(Boolean))];
  const result = new Map<string, Item>();

  const uncached: string[] = [];
  for (const code of uniqueCodes) {
    const cached = cache.get(code);
    if (cached) {
      result.set(code, cached);
    } else {
      uncached.push(code);
    }
  }

  let done = 0;
  onProgress?.(done, uncached.length);

  for (let i = 0; i < uncached.length; i += BULK_CHUNK_SIZE) {
    const chunk = uncached.slice(i, i + BULK_CHUNK_SIZE);
    const items = await getItemsByCodes(chunk);
    for (const item of items) {
      cache.set(item.ItemCode, item);
      result.set(item.ItemCode, item);
    }
    done += chunk.length;
    onProgress?.(Math.min(done, uncached.length), uncached.length);
  }

  return result;
}

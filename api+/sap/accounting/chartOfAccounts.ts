import apiClient from "@/lib/apiClient";

export interface ChartOfAccount {
  Code: string;
  Name: string;
  ActiveAccount?: string;
  Postable?: string;
}

export interface ChartOfAccountsPage {
  items: ChartOfAccount[];
  hasMore: boolean;
}

const PAGE_SIZE = 20;

async function fetchPage(skip: number, search = ""): Promise<ChartOfAccountsPage> {
  try {
    const res = await apiClient.get("api/Accounting/ChartOfAccounts", {
      params: { skip, ...(search ? { search } : {}) },
    });
    const raw = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    const items: ChartOfAccount[] = Array.isArray(raw?.value)
      ? raw.value
      : Array.isArray(raw)
        ? raw
        : [];
    const hasMore = Boolean(raw?.["odata.nextLink"]) || items.length === PAGE_SIZE;
    return { items, hasMore };
  } catch (error) {
    console.error("Get Chart Of Accounts Error:", error);
    return { items: [], hasMore: false };
  }
}

let cachedAccounts: ChartOfAccount[] = [];
let cachedSkip = 0;
let cachedHasMore = true;
let firstLoad: Promise<ChartOfAccountsPage> | null = null;

export async function loadChartOfAccounts(): Promise<ChartOfAccountsPage> {
  if (cachedAccounts.length > 0 || !cachedHasMore) {
    return { items: cachedAccounts, hasMore: cachedHasMore };
  }
  if (!firstLoad) {
    firstLoad = (async () => {
      const page = await fetchPage(0);
      if (page.items.length === 0 && !page.hasMore) {
        firstLoad = null;
        return { items: [], hasMore: true };
      }
      cachedAccounts = page.items;
      cachedSkip = page.items.length;
      cachedHasMore = page.hasMore;
      return { items: cachedAccounts, hasMore: cachedHasMore };
    })();
  }
  return firstLoad;
}

export async function loadMoreChartOfAccounts(): Promise<ChartOfAccountsPage> {
  if (!cachedHasMore) return { items: cachedAccounts, hasMore: false };
  const page = await fetchPage(cachedSkip);
  cachedAccounts = [...cachedAccounts, ...page.items];
  cachedSkip += page.items.length;
  cachedHasMore = page.hasMore;
  return { items: cachedAccounts, hasMore: cachedHasMore };
}

export function searchChartOfAccounts(term: string): Promise<ChartOfAccountsPage> {
  return fetchPage(0, term.trim());
}

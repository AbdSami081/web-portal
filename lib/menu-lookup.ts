import { MenuItem, SERVER_MENUS } from "./menu-data";

export interface ObjectMenuInfo {
  title: string;
  url: string;
  group?: string;
}

function buildObjectMenuMap(
  items: MenuItem[],
  map: Map<number, ObjectMenuInfo> = new Map()
): Map<number, ObjectMenuInfo> {
  for (const item of items) {
    if (item.objectCode !== undefined && item.objectCode !== null) {
      const code = Number(item.objectCode);
      if (!Number.isNaN(code)) {
        map.set(code, { title: item.title, url: item.url });
      }
    }
    if (item.items?.length) buildObjectMenuMap(item.items, map);
  }
  return map;
}

const OBJECT_CODE_ALIASES: Record<number, number> = {
  540000006: 54,
};

export function normalizeObjectCode(objectType: string | number): number {
  const code = Number(objectType);
  if (Number.isNaN(code)) return code;
  return OBJECT_CODE_ALIASES[code] ?? code;
}

const OBJECT_MENU_MAP = buildObjectMenuMap(SERVER_MENUS);

function buildObjectMenuUrlsMap(
  items: MenuItem[],
  map: Map<number, ObjectMenuInfo[]> = new Map()
): Map<number, ObjectMenuInfo[]> {
  for (const item of items) {
    if (item.objectCode !== undefined && item.objectCode !== null) {
      const code = Number(item.objectCode);
      if (!Number.isNaN(code)) {
        const existing = map.get(code) || [];
        existing.push({ title: item.title, url: item.url });
        map.set(code, existing);
      }
    }
    if (item.items?.length) buildObjectMenuUrlsMap(item.items, map);
  }
  return map;
}

const OBJECT_MENU_URLS_MAP = buildObjectMenuUrlsMap(SERVER_MENUS);

export interface ObjectTypeDisambiguationHint {
  cardType?: string | null;
  isProductionLinked?: boolean | null;
}

const AMBIGUOUS_CODE_RESOLVERS: Record<number, (hint: ObjectTypeDisambiguationHint) => string | undefined> = {
  204: (hint) => {
    if (hint.cardType === "cCustomer" || hint.cardType === "C") return "/dashboard/sales/dp_request";
    if (hint.cardType === "cSupplier" || hint.cardType === "S") return "/dashboard/purchase/apdownpaymentinvoice";
    return undefined;
  },
  60: (hint) => {
    if (hint.isProductionLinked === true) return "/dashboard/production/issue-for-production";
    if (hint.isProductionLinked === false) return "/dashboard/inventory/Good_Issue";
    return undefined;
  },
};

function buildUrlToMenuMap(
  items: MenuItem[],
  map: Map<string, ObjectMenuInfo> = new Map(),
  groupTitle?: string
): Map<string, ObjectMenuInfo> {
  for (const item of items) {
    if (item.url) map.set(item.url, { title: item.title, url: item.url, group: groupTitle });
    if (item.items?.length) buildUrlToMenuMap(item.items, map, groupTitle ?? item.title);
  }
  return map;
}

const URL_TO_MENU_MAP = buildUrlToMenuMap(SERVER_MENUS);

export function getMenuInfoByObjectCode(
  objectType: string | number,
  hint?: ObjectTypeDisambiguationHint
): ObjectMenuInfo | undefined {
  const code = normalizeObjectCode(objectType);
  if (Number.isNaN(code)) return undefined;

  const resolver = AMBIGUOUS_CODE_RESOLVERS[code];
  if (resolver && hint) {
    const url = resolver(hint);
    if (url) {
      const matched = URL_TO_MENU_MAP.get(url);
      if (matched) return matched;
    }
  }

  return OBJECT_MENU_MAP.get(code);
}

export function getMenuUrlsByObjectCode(objectType: string | number): string[] {
  const code = normalizeObjectCode(objectType);
  if (Number.isNaN(code)) return [];
  return (OBJECT_MENU_URLS_MAP.get(code) || []).map((m) => m.url);
}

const DRAFT_MODULE_URLS_BY_GROUP: Record<string, string> = {
  Sales: "/dashboard/sales/draft",
  Purchasing: "/dashboard/purchase/draft",
  Inventory: "/dashboard/inventory/draft",
  Production: "/dashboard/production/draft",
};

function buildObjectCodeGroupsMap(): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const group of SERVER_MENUS) {
    if (!group.items?.length) continue;
    for (const leaf of group.items) {
      if (leaf.objectCode === undefined || leaf.objectCode === null) continue;
      const code = Number(leaf.objectCode);
      if (Number.isNaN(code)) continue;
      const existing = map.get(code) || [];
      if (!existing.includes(group.title)) existing.push(group.title);
      map.set(code, existing);
    }
  }
  return map;
}

const OBJECT_CODE_GROUPS_MAP = buildObjectCodeGroupsMap();

export function getDraftModuleUrl(objectType: string | number, hint?: ObjectTypeDisambiguationHint): string | null {
  const code = normalizeObjectCode(objectType);
  if (Number.isNaN(code)) return null;

  const groups = OBJECT_CODE_GROUPS_MAP.get(code) || [];
  if (groups.length === 0) return null;

  let groupTitle = groups[0];
  if (groups.length > 1 && hint) {
    const resolvedUrl = AMBIGUOUS_CODE_RESOLVERS[code]?.(hint);
    const resolvedGroup = resolvedUrl ? URL_TO_MENU_MAP.get(resolvedUrl)?.group : undefined;
    if (resolvedGroup) groupTitle = resolvedGroup;
  }

  return DRAFT_MODULE_URLS_BY_GROUP[groupTitle] ?? null;
}

export function buildDocumentUrl(
  menuUrl: string,
  opts: {
    objectType: string;
    objectEntry?: string;
    draftEntry?: string;
    isDraft: boolean;
    approvalRequestCode?: number;
    approvalStatus?: string;
    disambiguationHint?: ObjectTypeDisambiguationHint;
  }
): string {
  if (opts.isDraft && opts.draftEntry) {
    const draftModuleUrl = getDraftModuleUrl(opts.objectType, opts.disambiguationHint);
    if (draftModuleUrl) {
      const params = new URLSearchParams();
      params.set("draftEntry", opts.draftEntry);
      params.set("docType", String(opts.objectType));
      if (opts.approvalStatus) {
        params.set("approvalStatus", opts.approvalStatus);
      }
      return `${draftModuleUrl}?${params.toString()}`;
    }
  }

  const params = new URLSearchParams();
  if (opts.objectEntry) {
    params.set("docEntry", opts.objectEntry);
  }
  if (opts.isDraft && opts.draftEntry) {
    params.set("draftEntry", opts.draftEntry);
    params.set("draft", "1");
  }
  if (opts.approvalStatus) {
    params.set("approvalStatus", opts.approvalStatus);
  }

  const queryString = params.toString();
  return queryString ? `${menuUrl}?${queryString}` : menuUrl;
}
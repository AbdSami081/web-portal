import { MenuItem, SERVER_MENUS } from "./menu-data";

export interface ObjectMenuInfo {
  title: string;
  url: string;
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

const OBJECT_MENU_MAP = buildObjectMenuMap(SERVER_MENUS);

export function getMenuInfoByObjectCode(objectType: string | number): ObjectMenuInfo | undefined {
  const code = Number(objectType);
  if (Number.isNaN(code)) return undefined;
  return OBJECT_MENU_MAP.get(code);
}

export function getDraftModuleUrl(objectType: string | number): string | null {
  const code = Number(objectType);
  if ([13, 15, 16, 17, 23].includes(code)) return "/dashboard/sales/draft";
  if ([67, 1250000001].includes(code)) return "/dashboard/inventory/draft";
  if ([202, 59, 60].includes(code)) return "/dashboard/production/draft";
  return null;
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
  }
): string {
  if (opts.isDraft && opts.draftEntry) {
    const draftModuleUrl = getDraftModuleUrl(opts.objectType);
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
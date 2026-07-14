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

export function buildDocumentUrl(
  menuUrl: string,
  opts: { objectType: string; objectEntry?: string; draftEntry?: string; isDraft: boolean }
): string {
  const params = new URLSearchParams();
  params.set("documentCode", String(opts.objectType));

  if (opts.objectEntry) {
    params.set("docEntry", opts.objectEntry);
  }
  if (opts.isDraft && opts.draftEntry) {
    params.set("draftEntry", opts.draftEntry);
    params.set("draft", "1");
  }

  return `${menuUrl}?${params.toString()}`;
}
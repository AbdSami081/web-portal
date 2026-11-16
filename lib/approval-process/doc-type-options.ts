import { SERVER_MENUS, collectLeafItems } from "@/lib/menu-data";

export type DocTypeOption = { objType: string; label: string };

const EXCLUDED_MODULE_TITLES = new Set(["Administration", "Reporting"]);

export function computeConfiguredModuleIds(
  portalConfig: { modules?: string; Code?: string; code?: string }[]
): Set<string> {
  const ids = new Set<string>();
  portalConfig.forEach((cfg) => {
    const mid = cfg.modules || cfg.Code || cfg.code;
    if (!mid) return;
    mid.split(",").forEach((m) => {
      const trimmed = m.trim().toLowerCase();
      if (trimmed) ids.add(trimmed);
    });
  });
  return ids;
}

export function getDocTypeOptions(allowedModuleIds?: Set<string>): DocTypeOption[] {
  const allowedMenus = SERVER_MENUS.filter((menu) => !EXCLUDED_MODULE_TITLES.has(menu.title)).filter(
    (menu) => !allowedModuleIds || allowedModuleIds.has(menu.id.toLowerCase())
  );

  const byObjType = new Map<string, DocTypeOption>();

  for (const item of collectLeafItems(allowedMenus)) {
    if (item.objectCode === undefined || item.objectCode === null) continue;
    const rawType = String(item.objectCode);
    const objType = rawType === "54" ? "540000006" : rawType;
    const existing = byObjType.get(objType);
    if (existing) {
      if (!existing.label.split(" / ").includes(item.title)) {
        existing.label = `${existing.label} / ${item.title}`;
      }
      continue;
    }
    byObjType.set(objType, { objType, label: item.title });
  }

  return Array.from(byObjType.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );
}

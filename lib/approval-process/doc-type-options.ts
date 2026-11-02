import { SERVER_MENUS, collectLeafItems } from "@/lib/menu-data";

export type DocTypeOption = { objType: string; label: string };

export function getDocTypeOptions(): DocTypeOption[] {
  const byObjType = new Map<string, DocTypeOption>();

  for (const item of collectLeafItems(SERVER_MENUS)) {
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

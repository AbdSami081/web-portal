import { getFieldDef } from "@/lib/config/documentFieldsConfig";

export const getFieldSettings = (
  objtype: number,
  fieldGroup: "headerFieds" | "linesFieds",
  fieldName: string
) => {
  const def = getFieldDef(objtype, fieldGroup, fieldName);
  if (def?.enabled === false) {
    return { visible: false, enable: false };
  }
  return { visible: true, enable: true };
};

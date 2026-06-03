import { formSettings } from "./clientConfig";

export const getFieldSettings = (
  objtype: number,
  fieldGroup: "headerFieds" | "linesFieds",
  fieldName: string
) => {
  const docSettings = formSettings.documents.find(
    (doc) => doc.objtype === objtype
  );
  if (!docSettings) {
    return { visible: true, enable: true };
  }

  const group = docSettings[fieldGroup];
  
  const key = Object.keys(group).find(
    (k) => k.toLowerCase() === fieldName.toLowerCase()
  );

  if (key) {
    return group[key as keyof typeof group];
  }

  // Fallback: check additional array
  if ("additional" in docSettings) {
    const found = (docSettings.additional as unknown as readonly { key: string; visible: boolean; enable: boolean }[]).find(
      (item) => item.key.toLowerCase() === fieldName.toLowerCase()
    );
    if (found) {
      return { visible: found.visible, enable: found.enable };
    }
  }

  return { visible: true, enable: true };
};
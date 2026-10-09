export interface RightDef {
  action: string;
  label: string;
  enabled: boolean;
}

export const DOCUMENT_SPECIAL_RIGHTS: RightDef[] = [
  { action: "Print", label: "Print", enabled: true },
  { action: "FMS", label: "FMS", enabled: true },
  { action: "FieldInspector", label: "Field Inspector", enabled: true },
  { action: "RelationshipMap", label: "Relationship Map", enabled: true },
  { action: "CloseDocument", label: "Close Document", enabled: true },
];

export const GLOBAL_RIGHTS: RightDef[] = [
  { action: "Bell", label: "Approval Rights", enabled: true },
  { action: "ShowBPBalances", label: "Show BP Balances", enabled: true },
];

export const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  [...DOCUMENT_SPECIAL_RIGHTS, ...GLOBAL_RIGHTS].map((d) => [d.action, d.label])
);

export const DOCUMENT_SPECIAL_RIGHTS_ACTIONS = DOCUMENT_SPECIAL_RIGHTS.filter((d) => d.enabled).map((d) => d.action);

export const GLOBAL_RIGHTS_ACTIONS = GLOBAL_RIGHTS.filter((d) => d.enabled).map((d) => d.action);

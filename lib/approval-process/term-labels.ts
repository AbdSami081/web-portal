export const WP_CONDITION_TYPES: { id: number; label: string }[] = [
  { id: 1, label: "Gross total" },
  { id: 2, label: "Discount %" },
  { id: 3, label: "Deviation from budget" },
  { id: 4, label: "Deviation from credit limit" },
  { id: 5, label: "Line quantity" },
];

export const WP_OPERATORS: { code: number; label: string }[] = [
  { code: 1, label: "Equal to" },
  { code: 2, label: "Not equal to" },
  { code: 3, label: "Greater than" },
  { code: 4, label: "Greater or equal" },
  { code: 5, label: "Less than" },
  { code: 6, label: "Less or equal" },
];

export function condLabel(condId: number) {
  return WP_CONDITION_TYPES.find((c) => c.id === condId)?.label ?? `Condition ${condId}`;
}

export function opLabel(opCode: number) {
  return WP_OPERATORS.find((o) => o.code === opCode)?.label ?? `Op ${opCode}`;
}

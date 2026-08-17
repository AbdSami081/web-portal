export const DEFAULT_BPL_ID = 5;

export const withDefaultBPLId = <T extends Record<string, unknown>>(payload: T): T & { BPL_IDAssignedToInvoice: number } => ({
  ...payload,
  BPL_IDAssignedToInvoice: DEFAULT_BPL_ID,
});

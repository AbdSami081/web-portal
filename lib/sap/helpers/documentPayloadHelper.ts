import { useBranchStore } from "@/stores/useBranchStore";

export const resolveBranchId = (documentBranch?: number | null): number | undefined => {
  return documentBranch ?? useBranchStore.getState().sessionDefaultBranch ?? undefined;
};

export const withDefaultBPLId = <T extends Record<string, unknown>>(
  payload: T,
  documentBranch?: number | null
): T & { BPL_IDAssignedToInvoice?: number } => {
  const payloadBranch = (payload as any).BPL_IDAssignedToInvoice ?? (payload as any).BPLId;
  const branchId = resolveBranchId(documentBranch ?? payloadBranch);
  return branchId === undefined
    ? payload
    : { ...payload, BPL_IDAssignedToInvoice: branchId };
};

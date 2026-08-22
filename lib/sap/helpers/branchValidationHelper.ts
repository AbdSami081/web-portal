import { useBranchStore } from "@/stores/useBranchStore";

export const isBranchRequired = (): boolean => {
  return useBranchStore.getState().assignedBranches.length > 0;
};

export const isBranchMissing = (documentBranch?: number | null): boolean => {
  if (!isBranchRequired()) return false;
  const branchId = documentBranch ?? useBranchStore.getState().sessionDefaultBranch;
  return branchId === undefined || branchId === null;
};

export const isBranchInactive = (documentBranch?: number | null): boolean => {
  const branchId = documentBranch ?? useBranchStore.getState().sessionDefaultBranch;
  if (branchId === undefined || branchId === null) return false;
  const branch = useBranchStore.getState().assignedBranches.find((b) => b.BPLID === branchId);
  return branch?.Disabled === "tYES";
};

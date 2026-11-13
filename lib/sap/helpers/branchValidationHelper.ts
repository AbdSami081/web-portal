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
  const { assignedBranches, allBranches } = useBranchStore.getState();
  const branches = assignedBranches.length > 0 ? assignedBranches : allBranches;
  const branch = branches.find((b) => Number(b.BPLID) === Number(branchId));
  if (!branch) return assignedBranches.length > 0;
  return ["tyes", "yes", "true", "y", "1"].includes(
    String(branch.Disabled).trim().toLowerCase(),
  );
};

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Branch } from "@/api+/sap/branch";

interface BranchStore {
  sessionDefaultBranch: number | null;
  assignedBranches: Branch[];
  allBranches: Branch[];
  needsBranchSelection: boolean;
  suggestedDefaultBranch: number | null;
  setSessionDefaultBranch: (branchId: number) => void;
  setAssignedBranches: (branches: Branch[]) => void;
  setAllBranches: (branches: Branch[]) => void;
  setNeedsBranchSelection: (needs: boolean) => void;
  setSuggestedDefaultBranch: (branchId: number | null) => void;
  clearBranch: () => void;
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      sessionDefaultBranch: null,
      assignedBranches: [],
      allBranches: [],
      needsBranchSelection: false,
      suggestedDefaultBranch: null,
      setSessionDefaultBranch: (branchId) => set({ sessionDefaultBranch: branchId, needsBranchSelection: false }),
      setAssignedBranches: (branches) => set({ assignedBranches: branches }),
      setAllBranches: (branches) => set({ allBranches: branches }),
      setNeedsBranchSelection: (needs) => set({ needsBranchSelection: needs }),
      setSuggestedDefaultBranch: (branchId) => set({ suggestedDefaultBranch: branchId }),
      clearBranch: () => set({ sessionDefaultBranch: null, assignedBranches: [], allBranches: [], needsBranchSelection: false, suggestedDefaultBranch: null }),
    }),
    {
      name: "branch-session",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

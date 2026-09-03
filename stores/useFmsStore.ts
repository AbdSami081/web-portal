import { create } from "zustand";
import { FmsConfigDto } from "@/api+/sap/fms/fmsService";

interface FmsState {
  /** Map of docType -> array of active FMS configs */
  configs: Record<number, FmsConfigDto[]>;
  setConfigs: (docType: number, data: FmsConfigDto[]) => void;
  clearConfigs: (docType?: number) => void;
}

export const useFmsStore = create<FmsState>((set) => ({
  configs: {},
  setConfigs: (docType, data) =>
    set((state) => ({ configs: { ...state.configs, [docType]: data } })),
  clearConfigs: (docType) =>
    set((state) => {
      if (docType !== undefined) {
        const next = { ...state.configs };
        delete next[docType];
        return { configs: next };
      }
      return { configs: {} };
    }),
}));

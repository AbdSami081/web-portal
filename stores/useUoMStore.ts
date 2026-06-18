import { create } from "zustand";
import { getUOMs } from "@/api+/sap/master-data/uom/index";

interface UoM {
  AbsEntry: number;
  Code: string;
  Name: string;
}

interface UoMStore {
  uoms: UoM[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  loadUoMs: () => Promise<void>;
  getUoMName: (code: string | number | null | undefined) => string;
  reset: () => void;
}

export const useUoMStore = create<UoMStore>((set, get) => ({
  uoms: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  loadUoMs: async () => {
    const state = get();
    if (state.isLoaded || state.isLoading) {
      console.log("[UoM] Data already loaded or loading in progress");
      return;
    }

    console.log("[UoM] Starting to load UoM master data...");
    set({ isLoading: true, error: null });
    try {
      const data = await getUOMs();
      set({ uoms: data, isLoaded: true, isLoading: false });
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to load UoMs";
      console.error("[UoM] Error loading UoM data:", errorMsg);
      set({ error: errorMsg, isLoading: false });
    }
  },

  getUoMName: (code: string | number | null | undefined) => {
    if (code === undefined || code === null) return "";

    const state = get();
    const codeStr = String(code);
    if (!codeStr.trim() || codeStr === "-1") return "";

    const uom = state.uoms.find(u => {
      const absEntryStr = String(u.AbsEntry);
      const codeMatch = u.Code === codeStr || u.Code === code;
      const absEntryMatch = absEntryStr === codeStr || u.AbsEntry === code;
      return codeMatch || absEntryMatch;
    });

    const result = uom?.Name?.trim() || "";
    
    if (!uom && state.uoms.length > 0) {
      console.warn(`[UoM] No match found for code: ${code}`);
    }
    return result;
  },

  reset: () => {
    console.log("[UoM] Resetting UoM store");
    set({ uoms: [], isLoaded: false, isLoading: false, error: null });
  },
}));

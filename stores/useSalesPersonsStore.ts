import { create } from "zustand";
import { getSalesPersons } from "@/api+/sap/master-data/salesPersons";

export interface SalesPerson {
  SalesEmployeeCode: number;
  SalesEmployeeName: string;
}

interface SalesPersonsStore {
  salesPersons: SalesPerson[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  loadSalesPersons: () => Promise<void>;
  getSalesPersonName: (code: number | string | null | undefined) => string;
  reset: () => void;
}

export const useSalesPersonsStore = create<SalesPersonsStore>((set, get) => ({
  salesPersons: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  loadSalesPersons: async () => {
    const state = get();
    if (state.isLoaded || state.isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const data = await getSalesPersons();
      set({ salesPersons: data, isLoaded: true, isLoading: false });
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to load Sales Persons";
      console.error("[SalesPersons] Error loading sales persons data:", errorMsg);
      set({ error: errorMsg, isLoading: false });
    }
  },

  getSalesPersonName: (code) => {
    if (code === undefined || code === null) return "";
    const codeStr = String(code).trim();
    if (!codeStr || codeStr === "-1") return "";

    const person = get().salesPersons.find((p) => String(p.SalesEmployeeCode) === codeStr);
    return person?.SalesEmployeeName?.trim() || "";
  },

  reset: () => {
    set({ salesPersons: [], isLoaded: false, isLoading: false, error: null });
  },
}));

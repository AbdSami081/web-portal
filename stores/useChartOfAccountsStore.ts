import { create } from "zustand";
import { getChartOfAccounts } from "@/api+/sap/financial/financialService";

interface ChartOfAccount {
  Code: string;
  Name: string;
  Balance: number;
  ActiveAccount: string;
  AccountLevel: number;
  AccountType: string;
  AcctCurrency: string;
  FatherAccountKey: string | null;
  FormatCode: string;
}

interface ChartOfAccountsState {
  chartOfAccounts: ChartOfAccount[];
  isLoading: boolean;
  loadChartOfAccounts: () => Promise<void>;
  reset: () => void;
}

export const useChartOfAccountsStore =
  create<ChartOfAccountsState>((set) => ({
    chartOfAccounts: [],
    isLoading: false,

    loadChartOfAccounts: async () => {
      set({ isLoading: true });

      const response = await getChartOfAccounts();

      set({
        chartOfAccounts: response?.value || [],
        isLoading: false,
      });
    },

    reset: () => {
      set({
        chartOfAccounts: [],
        isLoading: false,
      });
    },
  }));
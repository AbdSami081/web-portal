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
  hasMore: boolean;
  loadChartOfAccounts: () => Promise<void>;
  loadMoreChartOfAccounts: () => Promise<void>;
  reset: () => void;
}

export const useChartOfAccountsStore =
  create<ChartOfAccountsState>((set, get) => ({
    chartOfAccounts: [],
    isLoading: false,
    hasMore: false,

    loadChartOfAccounts: async () => {
      set({ isLoading: true });

      try {
        const response = await getChartOfAccounts(0);
        const page: ChartOfAccount[] = response?.value || [];

        set({
          chartOfAccounts: page,
          hasMore: !!response?.["@odata.nextLink"],
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to load chart of accounts:", error);
        set({ isLoading: false });
      }
    },

    loadMoreChartOfAccounts: async () => {
      const { chartOfAccounts, isLoading } = get();
      if (isLoading) return;

      set({ isLoading: true });

      try {
        const response = await getChartOfAccounts(chartOfAccounts.length);
        const page: ChartOfAccount[] = response?.value || [];

        set({
          chartOfAccounts: [...chartOfAccounts, ...page],
          hasMore: !!response?.["@odata.nextLink"],
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to load more chart of accounts:", error);
        set({ isLoading: false });
      }
    },

    reset: () => {
      set({
        chartOfAccounts: [],
        isLoading: false,
        hasMore: false,
      });
    },
  }));

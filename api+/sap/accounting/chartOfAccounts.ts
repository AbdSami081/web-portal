import apiClient from "@/lib/apiClient";

export interface ChartOfAccount {
  Code: string;
  Name: string;
  AccountType?: string;
  ActiveAccount?: string;
}

export const getChartOfAccounts = async (): Promise<ChartOfAccount[]> => {
  try {
    const res = await apiClient.get("api/Accounting/ChartOfAccounts");
    const raw = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    const list = raw?.value ?? raw?.ChartOfAccounts ?? raw ?? [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Get Chart Of Accounts Error:", error);
    return [];
  }
};


import apiClient from "@/lib/apiClient";

export const getChartOfAccounts = async () => {
  const response = await apiClient.get(
    "api/Accounting/ChartOfAccounts"
  );
console.log(response.data);
  return response.data;
};


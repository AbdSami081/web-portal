import apiClient from "@/lib/apiClient";

export const getChartOfAccounts = async (skip = 0, search?: string) => {
  const params: Record<string, string | number> = {};
  if (skip > 0) params.skip = skip;
  if (search) params.search = search;
  const response = await apiClient.get(
    "api/Accounting/ChartOfAccounts",
    { params: Object.keys(params).length > 0 ? params : undefined }
  );
  return response.data;
};


import { sapApi } from "./auth";

export const fetchData = async (
  endpoint: string,
  params: URLSearchParams,
  logMessage: string
) => {
  try {
    const response = await sapApi.get(`${endpoint}?${params.toString()}`, {
      headers: {
        Prefer: "odata.maxpagesize=" + params.get("top"),
      },
    });
    const data = response?.data?.value || [];
    if (endpoint === "/Items") {
      //console.log("endpoint", endpoint);
      //const decoded = decodeURIComponent(params.toString());
      //console.log("params", decoded);
      //console.log("records fetched from: " + logMessage);
      console.log(`records fetched from ${logMessage}: `, data.length);
    }
    return data;
  } catch (error: any) {
    console.error(
      `❌ Error fetching data from ${endpoint}:`,
      error?.response?.data || error.message
    );
    return [];
  }
};

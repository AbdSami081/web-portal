import apiClient, { reportingApiClient } from "@/lib/apiClient";

export interface ReportData {
  Code?: string;
  Name?: string;
  U_EmployeeId: string;
  U_EmployeeName: string;
  U_UserCode: string;
  U_FileName: string;
  U_ActualFileName: string;
  U_ExtType: string;
  U_FilePath: string;
}

export const uploadReport = async (formData: FormData) => {
  const response = await apiClient.post("api/ReportingAPI/Upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getReports = async (employeeId?: string): Promise<ReportData[]> => {
  const url = employeeId 
    ? `api/ReportingAPI/GetReports?employeeId=${encodeURIComponent(employeeId)}` 
    : "api/ReportingAPI/GetReports";
  const response = await apiClient.get(url);
  return response.data || [];
};

// export const downloadReport = async (params: any) => {
//     const response = await reportingApiClient.post("api/reports/render", params);
//     return response;
// };

export const downloadReport = async (params: any) => {
  const response = await reportingApiClient.post(
    "api/reports/render",
    params,
    { responseType: "blob" } 
  );

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "PNLReport.pdf";
  link.click();
};
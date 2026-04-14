import apiClient, { reportingApiClient } from "@/lib/apiClient";
import axios from "axios";

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
  U_ReportCode?: string;
  U_CanView?: string | boolean;
  U_CanPrint?: string | boolean;
}

export interface ReportFolderItem {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: ReportFolderItem[];
}

export interface ImportReportPayload {
  reportName: string;
  module: string;
  subModule?: string;
  fileName: string;
  filePath: string;
  userCode: string;
  userName: string;
}

export interface ReportAccessPayload {
  userCode: string;
  reportCodes: string[];
}

export const getReportFolders = async (): Promise<ReportFolderItem[]> => {
  try {
    const response = await apiClient.get("api/ReportingAPI/GetFolders");
    return response.data || [];
  } catch (error) {
    console.error("Internal API failure:", error);
    return [];
  }
};

export const importReport = async (payload: ImportReportPayload[]) => {
  const response = await apiClient.post("api/ReportingAPI/Import", payload);
  return response.data;
};

export const getAuthorizedReports = async (userCode: string): Promise<ReportData[]> => {
  try {
    const response = await apiClient.get(
      `api/ReportingAPI/GetAuthorizedReports?userCode=${encodeURIComponent(userCode)}`
    );
    return response.data || [];
  } catch (error) {
    console.error("Error fetching authorized reports:", error);
    throw error;
  }
};

export const saveReportAccess = async (payload: ReportAccessPayload) => {
  const response = await apiClient.post("api/ReportingAPI/SaveReportAccess", payload);
  return response.data;
};

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
  link.download = "Report.pdf";
  link.click();
};

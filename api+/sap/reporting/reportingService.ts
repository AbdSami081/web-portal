import apiClient, { reportingApiClient } from "@/lib/apiClient";
import axios from "axios";

export interface ReportParameter {
  U_ParamName: string;
  U_ComponentType: string;
  U_ParamType: string;
}

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
  Parameters?: ReportParameter[];
}

export interface ReportFolderItem {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: ReportFolderItem[];
}

export interface ImportReportPayload {
  reportName: string;
  fileName: string;
  filePath: string;
  userCode: string;
  userName: string;
  parameters: any[];
}

export interface ReportAccessPayload {
  userCode: string;
  reportCodes: string[];
}

export const getReportParameters = async (filePath: string) => {
  const response = await reportingApiClient.get(`/api/reports/GetReportParameters?filePath=${encodeURIComponent(filePath)}`);
  return response.data;
};

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
  const response = await apiClient.post("api/ReportingAPI/ImportReports", payload);
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

export const getReports = async (employeeId: string): Promise<ReportData[]> => {
  const url = `api/ReportingAPI/GetReports?employeeId=${employeeId}`
  const response = await apiClient.get(url);
  return response.data || [];
};

export const downloadReport = async (payload: any) => {
  const response = await reportingApiClient.post(
    "/api/reports/render",
    payload,
    { responseType: "blob" }
  );

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  return url;
};

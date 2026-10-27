import apiClient, { reportingApiClient } from "@/lib/apiClient";
import axios from "axios";

export interface ReportParameterValue {
  Value: string;
  Description?: string;
}

// Shape of a parameter as PERSISTED by SAP_BUSINESS_ONE_WEB_API (the
// @REPORTS_PARAMETERS UDT) and returned by GetReports/GetAuthorizedReports — used for
// ReportData.Parameters below and by ReportParameterModal.tsx.
export interface ReportParameter {
  U_ParamName: string;
  U_ComponentType: string;
  U_ParamType: string;
  U_ParamValues?: ReportParameterValue[];
  // True when U_ParamValues is only a capped first page from CrystalReportService's
  // SQL-literal resolver (a parameter named e.g. "@Select * From OITM") rather than a
  // small, fixed, authored list — ReportParameterModal uses this to decide whether to
  // offer search + "Next" (via searchParameterValues) instead of a plain closed list.
  Searchable?: boolean;
}

// Shape of a parameter as returned LIVE by CrystalReportingAPI's
// GetReportParametersWithValues endpoint (lowercase keys — see
// Models/ReportParameterInfo.cs in that project). Distinct from ReportParameter
// above: this is what you get straight from Crystal, before it's been imported/
// persisted into the UDT.
export interface LiveReportParameterValue {
  value: string;
  description?: string;
}

export interface LiveReportParameter {
  name: string;
  type: string;
  componentType: string;
  values?: LiveReportParameterValue[];
  searchable?: boolean;
}

// One page of a searchable dropdown parameter's values (CrystalReportingAPI's
// SearchParameterValues) — hasMore tells the modal whether to keep showing "Next".
export interface ReportParameterSearchResult {
  values: ReportParameterValue[];
  hasMore: boolean;
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
  U_DocType?: string;
  U_Module?: string;
  U_ObjectCode?: string;
  U_IsDefault?: string;
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
  docType: "Report" | "Layout";
  module?: string;
  objectCode: string;
  isDefault: "Y" | "N";
}

export interface ReportAccessPayload {
  userCode: string;
  reportCodes: string[];
}






export const isEmbeddedQueryParam = (paramName: string): boolean =>
  /^@?\s*select\s+/i.test(paramName || "");

export const getReportParameters = async (
  filePath: string,
  database?: string
): Promise<LiveReportParameter[]> => {
  const params = new URLSearchParams({ filePath });
  if (database) params.append("database", database);

  const response = await reportingApiClient.get(
    `api/reports/GetReportParametersWithValues?${params.toString()}`
  );
  return response.data;
};

// Pages/searches a single Searchable dropdown parameter (CrystalReportingAPI's
// SearchParameterValues) — paramName must be passed back exactly as returned by
// getReportParameters/the persisted catalog so it still matches the "@Select Col
// From Table" pattern server-side.
export const searchParameterValues = async (
  filePath: string,
  paramName: string,
  database: string | undefined,
  search: string,
  offset: number,
  limit = 20
): Promise<ReportParameterSearchResult> => {
  const params = new URLSearchParams({
    filePath,
    paramName,
    offset: String(offset),
    limit: String(limit),
  });
  if (database) params.append("database", database);
  if (search) params.append("search", search);

  const response = await reportingApiClient.get(
    `api/reports/SearchParameterValues?${params.toString()}`
  );
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

export const getReports = async (employeeId?: string, companyDB?: string): Promise<ReportData[]> => {
  const params = new URLSearchParams();
  if (employeeId && employeeId.trim() !== "" && employeeId !== "ALL") {
    params.append("employeeId", employeeId);
  }
  if (companyDB && companyDB.trim() !== "") {
    params.append("companyDB", companyDB);
  }
  const queryString = params.toString();
  const url = queryString ? `api/ReportingAPI/GetReports?${queryString}` : `api/ReportingAPI/GetReports`;
  const response = await apiClient.get(url);
  return response.data || [];
};

export const getLayouts = async (objectCode: string | number): Promise<ReportData[]> => {
  try {
    const response = await apiClient.get(`api/ReportingAPI/GetLayouts/${objectCode}`);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching layouts:", error);
    return [];
  }
};

export const downloadReport = async (payload: any) => {
  const normalized = {
    FilePath: payload?.FilePath,
    database: payload?.database ?? "",
    format: payload?.format || "pdf",
    parameters: payload?.parameters ?? payload?.Parameters ?? {},
  };

  
  const response = await reportingApiClient.post(
    "api/reports/render",
    normalized,
    { responseType: "blob" }
  );

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  return url;
};

export const updateComponent = async (payload: any) => {
  const response = await apiClient.post("api/ReportingAPI/UpdateReportLayout", payload);
  return response.data;
};

export const deleteComponent = async (code: string, type: string, companyDB?: string) => {
  const params = new URLSearchParams({
    code,
    type,
  });
  if (companyDB) {
    params.append("companyDB", companyDB);
  }
  const response = await apiClient.delete(`api/ReportingAPI/DeleteReportLayout?${params.toString()}`);
  return response.data;
};




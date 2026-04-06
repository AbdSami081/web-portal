import apiClient from "@/lib/apiClient";

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
  try {
    const response = await apiClient.post("api/ReportingAPI/Upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading report:", error);
    throw error;
  }
};

export const getReports = async (employeeId?: string): Promise<ReportData[]> => {
  try {
    const url = employeeId 
      ? `api/ReportingAPI/GetReports?employeeId=${encodeURIComponent(employeeId)}` 
      : "api/ReportingAPI/GetReports";
    const response = await apiClient.get(url);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
};

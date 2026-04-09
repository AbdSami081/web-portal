import apiClient from "@/lib/apiClient";

export interface OhemUser {
  empId: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface UserAccessEntry {
  moduleId: string;
  componentId: string;
}

export interface UserAccessSavePayload {
  userID: string;
  companyDB: string;
  permissions: { moduleID: string; componentID: string }[];
}

export const getUsers = async (companyDB: string): Promise<OhemUser[]> => {
  const response = await apiClient.get<{ success: boolean; data: OhemUser[] }>(
    `api/Authorization/users`,
    { params: { companyDB } }
  );
  return response.data.data ?? [];
};

export const getUserAccess = async (
  empId: string,
  companyDB: string
): Promise<UserAccessEntry[]> => {
  const response = await apiClient.get<{ success: boolean; data: UserAccessEntry[] }>(
    `api/Authorization/user-access/${empId}`,
    { params: { companyDB } }
  );
  return response.data.data ?? [];
};

export const saveUserAccess = async (payload: UserAccessSavePayload): Promise<void> => {
  await apiClient.post("api/Authorization/save", {
    userID: payload.userID,
    companyDB: payload.companyDB,
    permissions: payload.permissions,
  });
};

import apiClient, { cachedGet } from "@/lib/apiClient";
import { dedupeRequest } from "@/lib/api/requestDedupe";
import { getCachedPermissions, setCachedPermissions } from "@/lib/api/permissionsCache";

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
  try {
    const response = await cachedGet<{ success: boolean; data: OhemUser[] }>(
      `api/Authorization/users`,
      { params: { companyDB }, timeout: 10000 }
    );
    return response.data ?? [];
  } catch (error) {
    console.error("Failed to fetch users from SAP API:", error);
    return [
      { empId: "1", firstName: "Mock", lastName: "Admin", fullName: "Mock Admin" },
      { empId: "2", firstName: "Test", lastName: "User", fullName: "Test User" }
    ];
  }
};

export const getUserAccess = async (
  empId: string,
  companyDB: string
): Promise<UserAccessEntry[]> => {
  const cached = getCachedPermissions(empId, companyDB);
  if (cached) return cached;

  const cacheKey = `user-access:${empId}:${companyDB}`;

  return dedupeRequest(cacheKey, async () => {
    const response = await apiClient.get<{ success: boolean; data: UserAccessEntry[] }>(
      `api/Authorization/user-access/${empId}`,
      { params: { companyDB }, timeout: 10000 }
    );
    const data = response.data.data ?? [];
    setCachedPermissions(empId, companyDB, data);
    return data;
  });
};

export const saveUserAccess = async (payload: UserAccessSavePayload): Promise<void> => {
  await apiClient.post("api/Authorization/save", {
    userID: payload.userID,
    companyDB: payload.companyDB,
    permissions: payload.permissions,
  });
};

export interface WebPortalConfigEntry {
  code: string;
  name: string;
  modules?: string;
  Code?: string;
  Name?: string;
}

export const getModules = async (companyDB: string): Promise<WebPortalConfigEntry[]> => {
  const response = await cachedGet<{ success: boolean; data: WebPortalConfigEntry[] }>(
    `api/Authorization/GetModules`,
    { params: { companyDB }, timeout: 10000 }
  );
  return response.data ?? [];
};

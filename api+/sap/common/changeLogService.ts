import apiClient from "@/lib/apiClient";

export interface ChangeLogRequest {
  Object: string;
  PrimaryKey: string;
}

export interface ChangeLogEntry {
  instance: number;
  objectCode: number;
  updated: string;
  updatedByUserCode: string;
  updatedByUserName: string;
  updatedOnAt: string;
  created: string;
  createdByUserCode: string;
  createdByUserName: string;
  createdOnAt: string;
}

export const getChangeLogEntries = async (
  payload: ChangeLogRequest
): Promise<ChangeLogEntry[]> => {
  const response = await apiClient.post<unknown>(
    "/api/ChangeLog/GetChangeLog",
    payload
  );
  const body = response.data;
  const result =
    body && typeof body === "object" && !Array.isArray(body)
      ? ("data" in body ? body.data : "value" in body ? body.value : body)
      : body;

  if (!Array.isArray(result)) {
    throw new Error("Unexpected Change Log API response.");
  }

  return result as ChangeLogEntry[];
};


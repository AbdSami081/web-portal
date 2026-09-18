import apiClient from "@/lib/apiClient";

export interface SapDatabase {
  CompanyName: string;
  CompanyDB: string;
}

export interface PublicConfig {
  Version: string;
  SapDatabases: SapDatabase[];
}

let cached: Promise<PublicConfig | null> | null = null;

const fetchPublicConfig = async (): Promise<PublicConfig | null> => {
  try {
    const res = await apiClient.get<PublicConfig>("api/PublicConfig");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch public config:", error);
    return null;
  }
};

export const getPublicConfig = async (force = false): Promise<PublicConfig | null> => {
  if (force || !cached) {
    cached = fetchPublicConfig();
  }
  const result = await cached;
  if (result === null) cached = null;
  return result;
};

import apiClient from "@/lib/apiClient";

export interface Branch {
  BPLID: number;
  BPLName: string;
  Disabled?: string;
  // GetBranches returns the full SAP BusinessPlaces object (no $select) — address/alias
  // fields exist on it but their exact names aren't confirmed yet, so they're accessed
  // loosely until verified against a live response.
  [key: string]: unknown;
}

export const getBranches = async (): Promise<Branch[]> => {
  const res = await apiClient.get("api/Branch/GetBranches");
  const data = res.data as any;
  const list = Array.isArray(data) ? data : data?.value;
  // Inactive branches are kept (not filtered out) so an assigned-but-inactive branch still
  // appears in the dropdown — it's blocked at save time instead, not hidden.
  return Array.isArray(list) ? list : [];
};

export interface MyBranches {
  branches: { BPLID: number }[];
  defaultBranch: number | null;
}

export const getMyBranches = async (): Promise<MyBranches> => {
  try {
    const res = await apiClient.get("api/Branch/GetMyBranches");
    return {
      branches: res.data?.branches ?? [],
      defaultBranch: res.data?.defaultBranch ?? null,
    };
  } catch {
    return { branches: [], defaultBranch: null };
  }
};

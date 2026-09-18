import apiClient from "@/lib/apiClient";

export interface AdminSettings {
  NotifyRequester: string;
  notifyRqr: string;
  EnableApprovalProcessInDI: boolean;
  CanUpdateApprovedDocument: boolean;
  CanOriginatorUpdateDraft: boolean;
  CanAuthorizerUpdateDraft: boolean;
  IsApprovalProcessEnabled: boolean | null;
  SendApprovalEmailNotification: boolean | null;
  MultiBranchEnabled: boolean;
}
export interface Field {
  FieldId: number;
  ObjectId: number;
  FieldName: string;
}

// Updated request model 
export interface AssignUserFieldsRequest { UserCode: string; DocType: string; FieldKeys: string[]; }

let cached: Promise<AdminSettings | null> | null = null;

const fetchAdminSettings = async (): Promise<AdminSettings | null> => {
  try {
    const res = await apiClient.get<AdminSettings>("api/Administration/GetAdminSettings");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch admin settings:", error);
    return null;
  }
};

export const getAdminSettings = async (force = false): Promise<AdminSettings | null> => {
  if (force || !cached) {
    cached = fetchAdminSettings();
  }
  const result = await cached;
  if (result === null) cached = null;
  return result;

};






// Get all master fields
export const getAllFields = async (
  userCode: string,
  docType: string
): Promise<Field[]> => {
  try {
    console.log("Fetching fields for user:", userCode, "and document type:", docType);
    const res = await apiClient.get<Field[]>(
      "api/Master/GetAllFields",
      {
        params: {
          userCode,
          docType,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error("Failed to fetch fields:", error);
    return [];
  }
};




// Assign selected fields to user
export const assignUserFields = async (
  userCode: string,
  docType: string,
  fieldKeys: string[]
) => {
  try {
    console.log("Assigning fields:", { userCode, docType, fieldKeys });
    const res = await apiClient.post(
      "api/Master/assign-fields",
      {
        UserCode: userCode,
        DocType: docType,
        FieldKeys: fieldKeys,
      }
    );

    return res.data;
  } catch (error) {
    console.error("Failed to assign user fields:", error);
    throw error;
  }
};
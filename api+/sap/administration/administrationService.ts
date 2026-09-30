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




// Reconcile @WP_FIELDS_CFG for one docType against the frontend's own field
// catalog (lib/config/fieldManifest.ts) — insert rows for new fields, hard-
// delete rows for fields no longer rendered anywhere. Called automatically
// whenever the Field Access admin screen opens a document, so this table
// never needs a hand-run SQL script again.
export const syncFieldsConfig = async (
  docType: string,
  fields: { fieldName: string; fieldTitle: string; fieldType: "H" | "L" }[]
): Promise<{ inserted: number; deleted: number }> => {
  try {
    const res = await apiClient.post("api/Master/SyncFieldsConfig", {
      DocType: docType,
      Fields: fields.map((f) => ({
        FieldName: f.fieldName,
        FieldTitle: f.fieldTitle,
        FieldType: f.fieldType,
      })),
    });
    return { inserted: res.data?.Inserted ?? 0, deleted: res.data?.Deleted ?? 0 };
  } catch (error) {
    console.error("Failed to sync fields config:", error);
    return { inserted: 0, deleted: 0 };
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
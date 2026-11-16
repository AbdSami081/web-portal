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






// Get all master fields. Failures propagate so callers keep the last good
// permission list instead of treating an error as "no fields assigned".
export const getAllFields = async (
  userCode: string,
  docType: string
): Promise<Field[]> => {
  const res = await apiClient.get<Field[]>(
    "api/Master/GetAllFields",
    {
      params: {
        userCode,
        docType,
      },
    }
  );

  return Array.isArray(res.data) ? res.data : [];
};

export const copyUserFieldAccess = async (
  sourceUserCode: string,
  targetUserCodes: string[]
): Promise<{ sourceRowCount: number; targetCount: number }> => {
  const res = await apiClient.post<Record<string, unknown>>("api/Master/copy-field-access", {
    SourceUserCode: sourceUserCode,
    TargetUserCodes: targetUserCodes,
  });
  const data = res.data ?? {};
  const sourceRowCount = Number(data.sourceRowCount ?? data.SourceRowCount ?? 0);
  const targetCount = Number(data.targetCount ?? data.TargetCount ?? 0);
  return {
    sourceRowCount: Number.isFinite(sourceRowCount) ? sourceRowCount : 0,
    targetCount: Number.isFinite(targetCount) ? targetCount : 0,
  };
};




// Reconcile @WP_FIELDS_CFG for one docType against the frontend's own field
// catalog. Inserts rows for new fields and refreshes titles. It does not
// delete existing field rows or any user's field access.
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
import apiClient from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FmsConfigDto {
  code: string;
  name?: string;
  id?: string | number; // alias for code backwards-compatibility
  docType: number;
  targetField: string;
  fieldTitle: string;
  /** "H" header | "L" line | "F" footer | "UDF" */
  fieldScope?: string | null;
  queryText: string;
  /** "Manual" | "Auto" */
  triggerType: string;
  triggerField?: string | null;
  isActive: string;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface FmsExecuteRequest {
  docType: number;
  code?: string | null;
  queryId?: number | string | null;
  queryText?: string | null;
  targetField?: string | null;
  /** Current form values e.g. { CardCode: "CUS0002", DocDate: "2026-08-31" } */
  formContext?: Record<string, string>;
}

export interface FmsExecuteResult {
  success: boolean;
  /** Scalar value when query returns exactly 1 row, 1 column */
  value?: string | null;
  /** Multiple rows returned — show selection modal */
  rows?: Record<string, unknown>[] | null;
  columns?: string[] | null;
  errorMessage?: string | null;
}

export interface FmsTestQueryRequest {
  queryText: string;
  formContext?: Record<string, string>;
}

// ─── Normalizers (handles SAP B1 UDT Code/Name and U_ columns) ────────────────

const normalizeConfig = (raw: any): FmsConfigDto => {
  const code = String(raw?.code ?? raw?.Code ?? raw?.id ?? raw?.Id ?? "");
  return {
    code,
    name: raw?.name ?? raw?.Name ?? "",
    id: code,
    docType: Number(raw?.docType ?? raw?.DocType ?? 0),
    targetField: raw?.targetField ?? raw?.TargetField ?? "",
    fieldTitle: raw?.fieldTitle ?? raw?.FieldTitle ?? "",
    fieldScope: raw?.fieldScope ?? raw?.FieldScope ?? raw?.U_FieldScope ?? null,
    queryText: raw?.queryText ?? raw?.QueryText ?? "",
    triggerType: raw?.triggerType ?? raw?.TriggerType ?? "Manual",
    triggerField: raw?.triggerField ?? raw?.TriggerField ?? null,
    isActive: raw?.isActive ?? raw?.IsActive ?? "Y",
    createdBy: raw?.createdBy ?? raw?.CreatedBy ?? null,
    createdAt: raw?.createdAt ?? raw?.CreatedAt ?? null,
  };
};

const normalizeResult = (raw: any): FmsExecuteResult => ({
  success: Boolean(raw?.success ?? raw?.Success ?? false),
  value: raw?.value ?? raw?.Value ?? null,
  rows: raw?.rows ?? raw?.Rows ?? null,
  columns: raw?.columns ?? raw?.Columns ?? null,
  errorMessage: raw?.errorMessage ?? raw?.ErrorMessage ?? null,
});

// ─── API Methods ───────────────────────────────────────────────────────────────

export interface FmsFieldOption {
  name: string;
  title: string;
  /** "H" | "L" | "F" | "UDF" */
  fieldType?: string | null;
  dataType?: string | null;
  /** "config" (from @WP_FIELDS_CFG) | "udf" (from CUFD) */
  source?: string | null;
}

/**
 * Load the selectable target fields for a document type. The API merges the
 * `@WP_FIELDS_CFG` UDT with every real UDF on the document's header/line tables.
 * Returns [] on any failure so the setup modal can fall back to free-text input.
 */
export const getFmsFields = async (docType: number): Promise<FmsFieldOption[]> => {
  try {
    const res = await apiClient.get<any[]>(`api/FMS/fields?docType=${docType}`);
    const list = Array.isArray(res.data) ? res.data : [];
    return list
      .map((r) => {
        const name = String(
          r?.name ?? r?.Name ?? r?.U_FieldName ?? r?.fieldName ?? ""
        ).trim();
        const title = String(
          r?.title ?? r?.Title ?? r?.U_FieldTitle ?? r?.fieldTitle ?? name
        ).trim();
        return {
          name,
          title: title || name,
          fieldType: r?.fieldType ?? r?.FieldType ?? r?.U_FieldType ?? null,
          dataType: r?.dataType ?? r?.DataType ?? r?.U_DataType ?? null,
          source: r?.source ?? r?.Source ?? null,
        };
      })
      .filter((r) => r.name);
  } catch {
    return [];
  }
};

/** Load all active FMS configs for a document type */
export const getFmsConfigs = async (docType: number): Promise<FmsConfigDto[]> => {
  const res = await apiClient.get<any[]>(`api/FMS/configs?docType=${docType}`);
  const list = Array.isArray(res.data) ? res.data : [];
  return list.map(normalizeConfig);
};

/** Save (create or update) an FMS configuration */
export const saveFmsConfig = async (config: FmsConfigDto): Promise<{ code: string; id: string }> => {
  const code = config.code || (config.id ? String(config.id) : "");
  const payload = {
    Code: code,
    Name: config.name || config.fieldTitle || config.targetField,
    DocType: config.docType,
    TargetField: config.targetField,
    FieldTitle: config.fieldTitle || config.targetField,
    FieldScope: config.fieldScope ?? "H",
    QueryText: config.queryText,
    TriggerType: config.triggerType ?? "Manual",
    TriggerField: config.triggerField ?? null,
    IsActive: config.isActive ?? "Y",
  };
  const res = await apiClient.post<any>("api/FMS/config", payload);
  const resCode = String(res.data?.code ?? res.data?.Code ?? res.data?.id ?? res.data?.Id ?? code);
  return { code: resCode, id: resCode };
};

/** Soft-delete an FMS configuration */
export const deleteFmsConfig = async (code: string | number): Promise<void> => {
  await apiClient.delete(`api/FMS/config/${encodeURIComponent(String(code))}`);
};

/** Execute a saved FMS query with current form context values */
export const executeFmsQuery = async (request: FmsExecuteRequest): Promise<FmsExecuteResult> => {
  // The SAP UDT "Code" is a long alphanumeric key (e.g. "20260902095324664"), NOT an int.
  // Only forward QueryId when it is a genuine small integer; otherwise rely on Code.
  const rawId = request.queryId ?? request.code ?? null;
  const numericQueryId =
    rawId != null && /^\d{1,9}$/.test(String(rawId)) ? Number(rawId) : null;

  const payload = {
    DocType: request.docType,
    Code: request.code != null ? String(request.code) : rawId != null ? String(rawId) : null,
    QueryId: numericQueryId,
    QueryText: request.queryText ?? null,
    TargetField: request.targetField ?? null,
    FormContext: request.formContext ?? {},
  };
  const res = await apiClient.post<any>("api/FMS/execute", payload);
  return normalizeResult(res.data);
};

/** Admin preview: test a raw SQL query before saving */
export const testFmsQuery = async (request: FmsTestQueryRequest): Promise<FmsExecuteResult> => {
  const payload = {
    QueryText: request.queryText,
    FormContext: request.formContext ?? {},
  };
  const res = await apiClient.post<any>("api/FMS/test-query", payload);
  return normalizeResult(res.data);
};

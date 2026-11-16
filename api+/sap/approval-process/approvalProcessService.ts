import apiClient from "@/lib/apiClient";
import type {
  WpApprovalStage,
  WpApprovalTemplate,
  WpStageApprover,
  WpTemplateDocumentType,
  WpTemplateFmsLink,
  WpTemplateOriginator,
  WpTemplateStageLink,
  WpTemplateTerm,
} from "@/types/approval-process/wp-approval.types";

const str = (raw: unknown, ...keys: string[]) => {
  for (const k of keys) {
    const v = (raw as Record<string, unknown>)?.[k];
    if (v !== undefined && v !== null) return String(v);
  }
  return "";
};

const num = (raw: unknown, ...keys: string[]) => {
  for (const k of keys) {
    const v = (raw as Record<string, unknown>)?.[k];
    if (v !== undefined && v !== null) return Number(v);
  }
  return 0;
};

export function normalizeTemplate(raw: unknown): WpApprovalTemplate {
  return {
    code: str(raw, "code", "Code"),
    templateName: str(raw, "templateName", "TemplateName", "U_TemplateName"),
    conds: (str(raw, "conds", "Conds", "U_Conds") || "Y") as "Y" | "N",
    active: (str(raw, "active", "Active", "U_Active") || "Y") as "Y" | "N",
    appOnUpd: (str(raw, "appOnUpd", "AppOnUpd", "U_AppOnUpd") || "N") as "Y" | "N",
    priority: num(raw, "priority", "Priority", "U_Priority"),
    selfAprOk: (str(raw, "selfAprOk", "SelfAprOk", "U_SelfAprOk") || "N") as "Y" | "N",
  };
}

export function normalizeStage(raw: unknown): WpApprovalStage {
  return {
    code: str(raw, "code", "Code"),
    stageName: str(raw, "stageName", "StageName", "U_StageName"),
    maxReqr: num(raw, "maxReqr", "MaxReqr", "U_MaxReqr") || 1,
    maxRejReqr: num(raw, "maxRejReqr", "MaxRejReqr", "U_MaxRejReqr") || 1,
  };
}

export function normalizeOriginator(raw: unknown): WpTemplateOriginator {
  return {
    id: str(raw, "code", "Code") || str(raw, "id", "Id"),
    wtmCode: str(raw, "wtmCode", "WtmCode", "U_WtmCode"),
    userId: num(raw, "userId", "UserId", "U_UserId"),
    userName: str(raw, "userName", "UserName"),
  };
}

export function normalizeStageLink(raw: unknown): WpTemplateStageLink {
  return {
    id: str(raw, "code", "Code"),
    wtmCode: str(raw, "wtmCode", "WtmCode", "U_WtmCode"),
    wstCode: str(raw, "wstCode", "WstCode", "U_WstCode"),
    stageName: str(raw, "stageName", "StageName"),
    sortId: num(raw, "sortId", "SortId", "U_SortId"),
  };
}

export function normalizeDocumentType(raw: unknown): WpTemplateDocumentType {
  return {
    id: str(raw, "code", "Code"),
    wtmCode: str(raw, "wtmCode", "WtmCode", "U_WtmCode"),
    objType: str(raw, "objType", "ObjType", "U_ObjType"),
    objTypeLabel: str(raw, "objTypeLabel", "ObjTypeLabel"),
  };
}

export function normalizeTerm(raw: unknown): WpTemplateTerm {
  return {
    id: str(raw, "code", "Code"),
    wtmCode: str(raw, "wtmCode", "WtmCode", "U_WtmCode"),
    condId: num(raw, "condId", "CondId", "U_CondId"),
    condLabel: str(raw, "condLabel", "CondLabel"),
    opCode: num(raw, "opCode", "OpCode", "U_OpCode"),
    opLabel: str(raw, "opLabel", "OpLabel"),
    opValue: str(raw, "opValue", "OpValue", "U_OpValue"),
  };
}

export function normalizeFmsLink(raw: unknown): WpTemplateFmsLink {
  return {
    id: str(raw, "code", "Code"),
    wtmCode: str(raw, "wtmCode", "WtmCode", "U_WtmCode"),
    fmsCfgCode: str(raw, "fmsCfgCode", "FmsCfgCode", "U_FmsCfgCode"),
    fmsTitle: str(raw, "fmsTitle", "FmsTitle"),
  };
}

export function normalizeStageApprover(raw: unknown): WpStageApprover {
  return {
    id: str(raw, "code", "Code"),
    wstCode: str(raw, "wstCode", "WstCode", "U_WstCode"),
    userId: num(raw, "userId", "UserId", "U_UserId"),
    userName: str(raw, "userName", "UserName"),
  };
}

const mapList = <T,>(data: unknown, fn: (r: unknown) => T): T[] => {
  const arr = Array.isArray(data) ? data : [];
  return arr.map(fn);
};

export async function bootstrapPurchaseRequestSl01(): Promise<unknown> {
  const { data } = await apiClient.post("api/WpApproval/bootstrap/purchase-request-sl01");
  return data;
}

export async function bootstrapPurchaseRequestDev01(): Promise<unknown> {
  const { data } = await apiClient.post("api/WpApproval/bootstrap/purchase-request-dev01");
  return data;
}

export async function fetchTemplates(): Promise<WpApprovalTemplate[]> {
  const { data } = await apiClient.get("api/WpApproval/templates");
  return mapList(data, normalizeTemplate);
}

export async function fetchTemplate(code: string): Promise<WpApprovalTemplate | null> {
  try {
    const { data } = await apiClient.get(`api/WpApproval/templates/${encodeURIComponent(code)}`);
    return normalizeTemplate(data);
  } catch {
    return null;
  }
}

export async function createTemplate(
  template: Omit<WpApprovalTemplate, "code">
): Promise<string> {
  const { data } = await apiClient.post("api/WpApproval/templates", {
    TemplateName: template.templateName,
    Conds: template.conds,
    Active: template.active,
    AppOnUpd: template.appOnUpd,
    Priority: template.priority,
    SelfAprOk: template.selfAprOk,
  });
  return str(data, "code", "Code");
}

export async function updateTemplate(template: WpApprovalTemplate): Promise<void> {
  await apiClient.put(`api/WpApproval/templates/${encodeURIComponent(template.code)}`, {
    TemplateName: template.templateName,
    Conds: template.conds,
    Active: template.active,
    AppOnUpd: template.appOnUpd,
    Priority: template.priority,
    SelfAprOk: template.selfAprOk,
  });
}

export async function deleteTemplate(code: string): Promise<void> {
  await apiClient.delete(`api/WpApproval/templates/${encodeURIComponent(code)}`);
}

export async function fetchOriginators(wtmCode: string): Promise<WpTemplateOriginator[]> {
  const { data } = await apiClient.get(
    `api/WpApproval/templates/${encodeURIComponent(wtmCode)}/originators`
  );
  return mapList(data, normalizeOriginator);
}

export async function saveOriginators(
  wtmCode: string,
  rows: WpTemplateOriginator[]
): Promise<void> {
  await apiClient.put(`api/WpApproval/templates/${encodeURIComponent(wtmCode)}/originators`, {
    Rows: rows.map((r) => ({ WtmCode: wtmCode, UserId: r.userId })),
  });
}

export async function fetchTemplateStages(wtmCode: string): Promise<WpTemplateStageLink[]> {
  const { data } = await apiClient.get(
    `api/WpApproval/templates/${encodeURIComponent(wtmCode)}/stages`
  );
  return mapList(data, normalizeStageLink);
}

export async function saveTemplateStages(
  wtmCode: string,
  rows: WpTemplateStageLink[]
): Promise<void> {
  await apiClient.put(`api/WpApproval/templates/${encodeURIComponent(wtmCode)}/stages`, {
    Rows: rows.map((r, i) => ({
      WtmCode: wtmCode,
      WstCode: r.wstCode,
      SortId: r.sortId || i + 1,
    })),
  });
}

export async function fetchDocumentTypes(wtmCode: string): Promise<WpTemplateDocumentType[]> {
  const { data } = await apiClient.get(
    `api/WpApproval/templates/${encodeURIComponent(wtmCode)}/document-types`
  );
  return mapList(data, normalizeDocumentType);
}

export async function saveDocumentTypes(
  wtmCode: string,
  rows: WpTemplateDocumentType[]
): Promise<void> {
  await apiClient.put(`api/WpApproval/templates/${encodeURIComponent(wtmCode)}/document-types`, {
    Rows: rows.map((r) => ({ WtmCode: wtmCode, ObjType: r.objType })),
  });
}

export async function fetchTerms(wtmCode: string): Promise<WpTemplateTerm[]> {
  const { data } = await apiClient.get(
    `api/WpApproval/templates/${encodeURIComponent(wtmCode)}/terms`
  );
  return mapList(data, normalizeTerm);
}

export async function saveTerms(wtmCode: string, rows: WpTemplateTerm[]): Promise<void> {
  await apiClient.put(`api/WpApproval/templates/${encodeURIComponent(wtmCode)}/terms`, {
    Rows: rows.map((r) => ({
      WtmCode: wtmCode,
      CondId: r.condId,
      OpCode: r.opCode,
      OpValue: r.opValue,
    })),
  });
}

export async function fetchFmsLinks(wtmCode: string): Promise<WpTemplateFmsLink[]> {
  const { data } = await apiClient.get(
    `api/WpApproval/templates/${encodeURIComponent(wtmCode)}/fms-links`
  );
  return mapList(data, normalizeFmsLink);
}

export async function saveFmsLinks(
  wtmCode: string,
  rows: WpTemplateFmsLink[]
): Promise<{ from: string; to: string }[]> {
  const { data } = await apiClient.put(
    `api/WpApproval/templates/${encodeURIComponent(wtmCode)}/fms-links`,
    {
      Rows: rows.map((r) => ({ WtmCode: wtmCode, FmsCfgCode: r.fmsCfgCode, FmsTitle: r.fmsTitle })),
    }
  );
  const remapped = (data as { RemappedFmsCodes?: { From?: string; To?: string }[] })?.RemappedFmsCodes;
  if (!Array.isArray(remapped)) return [];
  return remapped
    .map((r) => ({ from: String(r.From ?? ""), to: String(r.To ?? "") }))
    .filter((r) => r.from && r.to);
}

export async function fetchStages(): Promise<WpApprovalStage[]> {
  const { data } = await apiClient.get("api/WpApproval/stages");
  return mapList(data, normalizeStage);
}

export async function fetchStage(code: string): Promise<WpApprovalStage | null> {
  try {
    const { data } = await apiClient.get(`api/WpApproval/stages/${encodeURIComponent(code)}`);
    return normalizeStage(data);
  } catch {
    return null;
  }
}

export async function createStage(stage: Omit<WpApprovalStage, "code">): Promise<string> {
  const { data } = await apiClient.post("api/WpApproval/stages", {
    StageName: stage.stageName,
    MaxReqr: stage.maxReqr,
    MaxRejReqr: stage.maxRejReqr,
  });
  return str(data, "code", "Code");
}

export async function updateStage(stage: WpApprovalStage): Promise<void> {
  await apiClient.put(`api/WpApproval/stages/${encodeURIComponent(stage.code)}`, {
    StageName: stage.stageName,
    MaxReqr: stage.maxReqr,
    MaxRejReqr: stage.maxRejReqr,
  });
}

export async function deleteStage(code: string): Promise<void> {
  await apiClient.delete(`api/WpApproval/stages/${encodeURIComponent(code)}`);
}

export async function fetchStageApprovers(wstCode: string): Promise<WpStageApprover[]> {
  const { data } = await apiClient.get(
    `api/WpApproval/stages/${encodeURIComponent(wstCode)}/approvers`
  );
  return mapList(data, normalizeStageApprover);
}

export async function saveStageApprovers(
  wstCode: string,
  rows: WpStageApprover[]
): Promise<void> {
  await apiClient.put(`api/WpApproval/stages/${encodeURIComponent(wstCode)}/approvers`, {
    Rows: rows.map((r) => ({ WstCode: wstCode, UserId: r.userId })),
  });
}

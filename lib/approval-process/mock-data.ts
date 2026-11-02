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

export const WP_CONDITION_TYPES: { id: number; label: string }[] = [
  { id: 1, label: "Gross total" },
  { id: 2, label: "Discount %" },
  { id: 3, label: "Deviation from budget" },
  { id: 4, label: "Deviation from credit limit" },
];

export const WP_OPERATORS: { code: number; label: string }[] = [
  { code: 1, label: "Equal to" },
  { code: 2, label: "Not equal to" },
  { code: 3, label: "Greater than" },
  { code: 4, label: "Greater or equal" },
  { code: 5, label: "Less than" },
  { code: 6, label: "Less or equal" },
];

let templates: WpApprovalTemplate[] = [
  {
    code: "WP-TPL-001",
    templateName: "Purchase Order — High Value",
    conds: "Y",
    active: "Y",
    appOnUpd: "N",
    priority: 10,
    selfAprOk: "N",
  },
  {
    code: "WP-TPL-002",
    templateName: "Sales Order — Credit Check",
    conds: "Y",
    active: "Y",
    appOnUpd: "Y",
    priority: 20,
    selfAprOk: "N",
  },
];

let stages: WpApprovalStage[] = [
  { code: "WP-STG-001", stageName: "Department Manager", maxReqr: 1, maxRejReqr: 1 },
  { code: "WP-STG-002", stageName: "Finance Controller", maxReqr: 1, maxRejReqr: 1 },
  { code: "WP-STG-003", stageName: "CFO Sign-off", maxReqr: 2, maxRejReqr: 1 },
];

let originators: WpTemplateOriginator[] = [
  { id: "o1", wtmCode: "WP-TPL-001", userId: 1, userName: "Dev01" },
  { id: "o2", wtmCode: "WP-TPL-001", userId: 5, userName: "Purchase01" },
  { id: "o3", wtmCode: "WP-TPL-002", userId: 1, userName: "Dev01" },
];

let templateStages: WpTemplateStageLink[] = [
  {
    id: "ts1",
    wtmCode: "WP-TPL-001",
    wstCode: "WP-STG-001",
    stageName: "Department Manager",
    sortId: 1,
  },
  {
    id: "ts2",
    wtmCode: "WP-TPL-001",
    wstCode: "WP-STG-002",
    stageName: "Finance Controller",
    sortId: 2,
  },
  {
    id: "ts3",
    wtmCode: "WP-TPL-002",
    wstCode: "WP-STG-001",
    stageName: "Department Manager",
    sortId: 1,
  },
  {
    id: "ts4",
    wtmCode: "WP-TPL-002",
    wstCode: "WP-STG-003",
    stageName: "CFO Sign-off",
    sortId: 2,
  },
];

let documentTypes: WpTemplateDocumentType[] = [
  { id: "d1", wtmCode: "WP-TPL-001", objType: "22", objTypeLabel: "Purchase Order" },
  { id: "d2", wtmCode: "WP-TPL-002", objType: "17", objTypeLabel: "Sales Order" },
];

let terms: WpTemplateTerm[] = [
  {
    id: "t1",
    wtmCode: "WP-TPL-001",
    condId: 1,
    condLabel: "Gross total",
    opCode: 3,
    opLabel: "Greater than",
    opValue: "10000",
  },
  {
    id: "t2",
    wtmCode: "WP-TPL-002",
    condId: 4,
    condLabel: "Deviation from credit limit",
    opCode: 3,
    opLabel: "Greater than",
    opValue: "0",
  },
];

let fmsLinks: WpTemplateFmsLink[] = [
  {
    id: "f1",
    wtmCode: "WP-TPL-001",
    fmsCfgCode: "FMS-PO-APPR-01",
    fmsTitle: "PO total exceeds branch limit",
  },
];

let stageApprovers: WpStageApprover[] = [
  { id: "a1", wstCode: "WP-STG-001", userId: 10, userName: "Manager01" },
  { id: "a2", wstCode: "WP-STG-002", userId: 11, userName: "Finance01" },
  { id: "a3", wstCode: "WP-STG-003", userId: 12, userName: "CFO01" },
  { id: "a4", wstCode: "WP-STG-003", userId: 13, userName: "CFO02" },
];

const clone = <T,>(value: T): T => structuredClone(value);

export function listTemplates(): WpApprovalTemplate[] {
  return clone(templates);
}

export function getTemplate(code: string): WpApprovalTemplate | undefined {
  return clone(templates.find((t) => t.code === code));
}

export function saveTemplate(template: WpApprovalTemplate): void {
  const idx = templates.findIndex((t) => t.code === template.code);
  if (idx >= 0) templates[idx] = { ...template };
  else templates.push({ ...template });
}

export function deleteTemplate(code: string): void {
  templates = templates.filter((t) => t.code !== code);
  originators = originators.filter((o) => o.wtmCode !== code);
  templateStages = templateStages.filter((s) => s.wtmCode !== code);
  documentTypes = documentTypes.filter((d) => d.wtmCode !== code);
  terms = terms.filter((t) => t.wtmCode !== code);
  fmsLinks = fmsLinks.filter((f) => f.wtmCode !== code);
}

export function listStages(): WpApprovalStage[] {
  return clone(stages);
}

export function getStage(code: string): WpApprovalStage | undefined {
  return clone(stages.find((s) => s.code === code));
}

export function saveStage(stage: WpApprovalStage): void {
  const idx = stages.findIndex((s) => s.code === stage.code);
  if (idx >= 0) {
    stages[idx] = { ...stage };
    templateStages = templateStages.map((link) =>
      link.wstCode === stage.code ? { ...link, stageName: stage.stageName } : link
    );
  } else {
    stages.push({ ...stage });
  }
}

export function deleteStage(code: string): void {
  stages = stages.filter((s) => s.code !== code);
  templateStages = templateStages.filter((s) => s.wstCode !== code);
  stageApprovers = stageApprovers.filter((a) => a.wstCode !== code);
}

export function listOriginators(wtmCode?: string): WpTemplateOriginator[] {
  const rows = wtmCode ? originators.filter((o) => o.wtmCode === wtmCode) : originators;
  return clone(rows);
}

export function saveOriginators(wtmCode: string, rows: WpTemplateOriginator[]): void {
  originators = originators.filter((o) => o.wtmCode !== wtmCode).concat(rows);
}

export function listTemplateStages(wtmCode?: string): WpTemplateStageLink[] {
  const rows = wtmCode ? templateStages.filter((s) => s.wtmCode === wtmCode) : templateStages;
  return clone(rows.sort((a, b) => a.sortId - b.sortId));
}

export function saveTemplateStages(wtmCode: string, rows: WpTemplateStageLink[]): void {
  templateStages = templateStages.filter((s) => s.wtmCode !== wtmCode).concat(rows);
}

export function listDocumentTypes(wtmCode?: string): WpTemplateDocumentType[] {
  const rows = wtmCode ? documentTypes.filter((d) => d.wtmCode === wtmCode) : documentTypes;
  return clone(rows);
}

export function saveDocumentTypes(wtmCode: string, rows: WpTemplateDocumentType[]): void {
  documentTypes = documentTypes.filter((d) => d.wtmCode !== wtmCode).concat(rows);
}

export function listTerms(wtmCode?: string): WpTemplateTerm[] {
  const rows = wtmCode ? terms.filter((t) => t.wtmCode === wtmCode) : terms;
  return clone(rows);
}

export function saveTerms(wtmCode: string, rows: WpTemplateTerm[]): void {
  terms = terms.filter((t) => t.wtmCode !== wtmCode).concat(rows);
}

export function listFmsLinks(wtmCode?: string): WpTemplateFmsLink[] {
  const rows = wtmCode ? fmsLinks.filter((f) => f.wtmCode === wtmCode) : fmsLinks;
  return clone(rows);
}

export function saveFmsLinks(wtmCode: string, rows: WpTemplateFmsLink[]): void {
  fmsLinks = fmsLinks.filter((f) => f.wtmCode !== wtmCode).concat(rows);
}

export function listStageApprovers(wstCode?: string): WpStageApprover[] {
  const rows = wstCode ? stageApprovers.filter((a) => a.wstCode === wstCode) : stageApprovers;
  return clone(rows);
}

export function saveStageApprovers(wstCode: string, rows: WpStageApprover[]): void {
  stageApprovers = stageApprovers.filter((a) => a.wstCode !== wstCode).concat(rows);
}

export function nextTemplateCode(): string {
  const n = templates.length + 1;
  return `WP-TPL-${String(n).padStart(3, "0")}`;
}

export function nextStageCode(): string {
  const n = stages.length + 1;
  return `WP-STG-${String(n).padStart(3, "0")}`;
}

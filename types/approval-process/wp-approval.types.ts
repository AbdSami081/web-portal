/** WP custom approval configuration (mirrors SAP OWTM / OWST / WTM* / WST1). */

export type YesNo = "Y" | "N";

export interface WpApprovalTemplate {
  code: string;
  templateName: string;
  conds: YesNo;
  active: YesNo;
  appOnUpd: YesNo;
  priority: number;
  selfAprOk: YesNo;
}

export interface WpTemplateOriginator {
  id: string;
  wtmCode: string;
  userId: number;
  userName: string;
}

export interface WpTemplateStageLink {
  id: string;
  wtmCode: string;
  wstCode: string;
  stageName: string;
  sortId: number;
}

export interface WpTemplateDocumentType {
  id: string;
  wtmCode: string;
  objType: string;
  objTypeLabel: string;
}

export interface WpTemplateTerm {
  id: string;
  wtmCode: string;
  condId: number;
  condLabel: string;
  opCode: number;
  opLabel: string;
  opValue: string;
}

export interface WpTemplateFmsLink {
  id: string;
  wtmCode: string;
  fmsCfgCode: string;
  fmsTitle: string;
}

export interface WpApprovalStage {
  code: string;
  stageName: string;
  maxReqr: number;
  maxRejReqr: number;
}

export interface WpStageApprover {
  id: string;
  wstCode: string;
  userId: number;
  userName: string;
}

export type WpApprovalProcessTab =
  | "general"
  | "originators"
  | "stages"
  | "document-types"
  | "terms"
  | "fms-queries";

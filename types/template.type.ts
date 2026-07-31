export interface ApprovalTemplate {
  Code: number;
  Name: string;
  Remarks: string;

  UseTerms: string;
  IsActive: string;
  IsActiveWhenUpdatingDocuments: string;

  ApprovalTemplateUsers: {
    UserID: number;
  }[];

  ApprovalTemplateStages: {
    SortID: number;
    ApprovalStageCode: number;
    Remarks: string;
  }[];

  ApprovalTemplateDocuments: {
    DocumentType: string;
  }[];

  ApprovalTemplateTerms: {
    ConditionType: string;
    OperationType: string;
    Value: string;
  }[];

  ApprovalTemplateQueries: any[];
}

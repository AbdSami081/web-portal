import apiClient from "@/lib/apiClient";

export interface SAPMessage {
  MessageCode: number;
  User: number;
  Priority: string;            
  Subject: string;
  Text: string;
  ApprovalRequestCode: number;
  ApprovalStatus: string;       
  ApprovalRemarks: string;
  ApprovalCreationDate: string;  
  DraftEntry: string;
  DraftType: string;             
  ObjectType: string;            
  ObjectEntry: string;
  Document?: string;   
  SourceDraftNumber?: number | null;          
}

export const PAGE_SIZE = 20;

export interface AlertsPage {
  messages: SAPMessage[];
  hasMore: boolean;
  nextSkip: number;
}

interface ODataResponse {
  "odata.nextLink"?: string;
  "@odata.nextLink"?: string;
  value?: SAPMessage[];
}

export const getMyAlerts = async (skip = 0, top = PAGE_SIZE): Promise<AlertsPage> => {
  const response = await apiClient.get<ODataResponse | SAPMessage[]>(
    `api/Notifications/GetMyAlerts`,
    { params: { skip, top }, timeout: 60000 }
  );
  const data = response.data as any;

  let messages: SAPMessage[] = [];

  if (data && Array.isArray(data.value)) {
    messages = data.value;
  } else if (Array.isArray(data)) {
    messages = data;
  }

  const nextLink: string | undefined = data?.["@odata.nextLink"] ?? data?.["odata.nextLink"];
  const hasMore = !!nextLink || messages.length === top;

  return {
    messages,
    hasMore,
    nextSkip: skip + top,
  };
};

export const getMyAlertsCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get<{ count: number }>("api/Notifications/GetMyAlertsCount");
    return response.data?.count ?? 0;
  } catch {
    return 0;
  }
};
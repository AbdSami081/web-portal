import apiClient from "@/lib/apiClient";

export interface MessageDataLine {
  Value: string;
  Object: string;
  ObjectKey: string;
}

export interface MessageDataColumn {
  ColumnName: string;
  Link: string;
  MessageDataLines: MessageDataLine[];
}

export interface RecipientInfo {
  UserCode: string;
  UserType: string;
  NameTo: string;
  SendEmail: string;
  EmailAddress: string;
  SendSMS: string;
  CellularNumber: string;
  SendFax: string;
  FaxNumber: string;
  SendInternal: string;
}

export interface SAPMessage {
  Code: number;
  User: number;
  Priority: string;
  Subject: string;
  Text: string;
  Attachment: any;
  MessageDataColumns: MessageDataColumn[];
  RecipientCollection: RecipientInfo[];
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
    { params: { skip, top } }
  );
  const data = response.data as any;

  let messages: SAPMessage[] = [];

  // SAP B1 OData returns { value: [...], "@odata.nextLink": "..." }
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

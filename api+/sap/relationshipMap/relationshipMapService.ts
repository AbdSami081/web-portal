import apiClient from "@/lib/apiClient";

export interface RelationshipBPDto {
  CardCode: string;
  CardName: string;
  CardType?: string;
}

export interface RelationshipNodeDto {
  Id: string;
  DocEntry: number;
  DocNum: number;
  ObjType: number;
  DocTypeName: string;
  DocDate: string;
  DocDueDate?: string | null;
  DocStatus: string; // "O" or "C"
  DocCur: string;
  DocTotal: number;
  PaidToDate?: number | null;
  IsCurrent: boolean;
  Level: number;
}

export interface RelationshipEdgeDto {
  From: string;
  To: string;
  FromDocEntry: number;
  FromObjType: number;
  ToDocEntry: number;
  ToObjType: number;
}

export interface RelationshipMapResponseDto {
  BusinessPartner: RelationshipBPDto | null;
  Nodes: RelationshipNodeDto[];
  Edges: RelationshipEdgeDto[];
}

export const getRelationshipMap = async (
  docType: number,
  docEntry: number
): Promise<RelationshipMapResponseDto> => {
  const res = await apiClient.get<RelationshipMapResponseDto>(
    `api/RelationshipMap?docType=${docType}&docEntry=${docEntry}`
  );
  return res.data;
};

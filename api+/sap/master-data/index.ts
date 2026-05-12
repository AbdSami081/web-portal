
import apiClient from "@/lib/apiClient";

export const getDocumentUDFs = async (tableName: string): Promise<any[]> => {

    const res = await apiClient.get(`api/Master/GetDocumentUDFs?tableName=${tableName}`);
    return res.data;
};


import apiClient from "@/lib/apiClient";

export const getDocumentUDFs = async (tableName: string): Promise<any[]> => {
    // Skip the API call if tableName is empty.
    // Draft documents don't require UDFs on this page, and this prevents unnecessary errors.
    if(!tableName) return [];
    const res = await apiClient.get(`api/Master/GetDocumentUDFs?tableName=${tableName}`);
    return res.data;
};

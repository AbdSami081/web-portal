import apiClient from "@/lib/apiClient";

export const getDocumentsList = async (resourceName: string, skip = 0, top = 20): Promise<any[]> => {
    try {
        const res = await apiClient.get(`api/Documents/getAll/${resourceName}?skip=${skip}&top=${top}`);
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        return data?.value || (Array.isArray(data) ? data : []);
    } catch (err) {
        console.error(`Failed to fetch documents list for ${resourceName}`, err);
        return [];
    }
};

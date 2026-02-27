export const getSapErrorMessage = (error: any): string => {
    if (error?.response?.data?.error?.message) {
        const sapError = error.response.data.error.message;
        // SAP errors often have a structured format, we can return the whole thing or clean it up
        return sapError.value || sapError || "An unexpected SAP error occurred";
    }

    if (error?.response?.data?.error) {
        return error.response.data.error;
    }

    if (error?.message) {
        return error.message;
    }

    return "An unexpected error occurred";
};

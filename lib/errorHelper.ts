export const getSapErrorMessage = (error: any): string => {
    if (error?.response?.data?.detail) {
        return error.response.data.detail;
    }
    if (error?.data?.detail) {
        return error.data.detail;
    }
    if (error?.detail) {
        return error.detail;
    }

    if (error?.response?.data?.error?.message) {
        const sapError = error.response.data.error.message;
        return sapError.value || sapError || "An unexpected SAP error occurred";
    }

    if (error?.response?.data?.error) {
        return error.response.data.error;
    }

    if (error?.response?.data?.title) {
        return error.response.data.title;
    }

    if (error?.message) {
        return error.message;
    }

    return "An unexpected error occurred";
};
export const getSapErrorMessage = (error: any): string => {
    let rawMessage = "";

    if (error?.response?.data?.detail) {
        rawMessage = error.response.data.detail;
    } else if (error?.data?.detail) {
        rawMessage = error.data.detail;
    } else if (error?.detail) {
        rawMessage = error.detail;
    } else if (error?.response?.data?.error?.message) {
        const sapError = error.response.data.error.message;
        rawMessage = sapError?.value || sapError || "";
    } else if (error?.response?.data?.error) {
        rawMessage = typeof error.response.data.error === "string" ? error.response.data.error : JSON.stringify(error.response.data.error);
    } else if (error?.response?.data?.message) {
        rawMessage = error.response.data.message;
    } else if (error?.response?.data?.title) {
        rawMessage = error.response.data.title;
    } else if (error?.message) {
        rawMessage = error.message;
    }

    if (!rawMessage) {
        return "An unexpected error occurred";
    }

    const lower = rawMessage.toLowerCase();
    if (lower.includes("invalid vat group") || lower.includes("vatgroup") || lower.includes("vat group")) {
        return "Invalid Tax Code / VAT Group selected. Please verify and select a valid Tax Code for all line items.";
    }

    return rawMessage;
};
import { sapApi } from "./auth";

export const getBusinessPartners = async () => {
  // Business Partners
  return await sapApi.get(`/BusinessPartners`);
};
export const getBusinessPartner = async (cardCode: string) => {
  // Business Partner
  return await sapApi.get(`/BusinessPartners('${cardCode}')`);
};

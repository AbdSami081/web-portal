import { sapApi } from "./auth";

export const getCustomers = async () => {
  // Customers
  return await sapApi.get(`/BusinessPartners?$filter=CardType eq 'C'`);
};
export const getCustomer = async (cardCode: string) => {
  // Customer
  return await sapApi.get(`/BusinessPartners('${cardCode}')`);
};

export const getCustomerByCode = async (code: string) => {
  // Customer by Code
  return await sapApi.get(`/BusinessPartners?$filter=CardCode eq '${code}'`);
};
export const getCustomerByEmail = async (email: string) => {
  // Customer by Email
  return await sapApi.get(
    `/BusinessPartners?$filter=Email eq '${email}' and CardType eq 'C'`
  );
}
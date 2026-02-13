import { sapApi } from "./auth";

// Get Price Lists
export const getPriceLists = async () => {
  const response = await sapApi.get(
    "/PriceLists?$select=PriceListNo,PriceListName"
  );
  return response.data.value.map((pl:any) => ({
    id: pl.PriceListNo,
    name: pl.PriceListName,
  }));
};

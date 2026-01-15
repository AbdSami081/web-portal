import { useSalesDocument } from "@/stores/sales/useSalesDocument";

export const getCustomerPrice = (ItemPrices: any[]) => {
  const { customer } = useSalesDocument.getState();
  if (customer && ItemPrices) {
    const priceList = ItemPrices?.find(
      (p) => p.PriceList === customer?.PriceListNum
    );
    console.log("priceList", priceList);
    if (priceList) {
      return priceList.Price;
    }
  }
  return 0;
};

// create function for customer currency code with amount
export const setCurrencyCode = (amount: number) => {
  const { customer } = useSalesDocument.getState();
  if (customer) {
    return `${customer.Currency} ${amount}`;
  }
  return amount;
};

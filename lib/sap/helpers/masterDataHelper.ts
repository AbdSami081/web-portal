import { useSalesDocument } from "@/stores/sales/useSalesDocument";

export const getCustomerPrice = (Prices: any[]) => {
  const { customer } = useSalesDocument.getState();
  const priceListNum = customer?.PriceListNum || (customer as any)?.PriceList;

  if (priceListNum && Prices) {
    const priceList = Prices?.find(
      (p: any) => (p.PriceList || p.priceList) === priceListNum
    );

    if (priceList) {
      return (
        priceList.PriceAmount ||
        priceList.Price ||
        priceList.priceAmount ||
        0
      );
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

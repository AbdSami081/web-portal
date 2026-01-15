import { sapApi } from "./auth";
import { getBusinessPartner, getBusinessPartners } from "./businessPartners";
import { getCustomers } from "./customers";
import { getItem, getItems } from "./items";
import { getPriceLists } from "./priceList";

// Example API methods
const SAPServiceLayer = {
  GetBusinessPartners: () => getBusinessPartners(),
  GetBusinessPartner: (cardCode: string) => getBusinessPartner(cardCode),
  GetItem: (itemCode: string) => getItem(itemCode),
  GetItems: () => getItems(),
  // Get Customers
  GetCustomers: () => getCustomers(),
  // Get Warehouses
  GetWarehouses: () => getWarehouses(),
  GetWarehouse: (warehouseCode: string) => getWarehouse(warehouseCode),
  GetPriceList: () => getPriceLists(),
  // Add more methods as needed
  // Logout (optional)
  //   logout: async () => {
  //     if (cachedSessionToken) {
  //       cachedSessionToken = null;
  //     }
  //   },
};
export default SAPServiceLayer;


const getWarehouse = (warehouseCode: string) => sapApi.get(`/Warehouses('${warehouseCode}')`);
const getWarehouses = () => sapApi.get("/Warehouses?$select=WarehouseCode,WarehouseName");
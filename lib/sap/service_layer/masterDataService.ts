// import { sapApi } from "./auth";

import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { Item } from "@/types/sales/Item.type";
import { WarehouseList } from "@/types/warehouse.type";
import { sapApi } from "./auth";
import { fetchData } from "./fetchData";

export const buildODataQuery = ({
  top = 50,
  skip = 0,
  search = "",
  searchFields = [],
  searchMode = "contains",
  orderBy,
  select = [],
  expand,
  filters = [],
  baseFilter,
}: {
  top?: number;
  skip?: number;
  search?: string;
  searchFields?: string[];
  searchMode?: "contains" | "eq";
  orderBy?: string;
  select?: string[];
  expand?: string;
  filters?: string[];
  baseFilter?: string;
}): URLSearchParams => {
  const params = new URLSearchParams();

  if (top) params.append("$top", top.toString());
  if (skip) params.append("$skip", skip.toString());
  if (orderBy) params.append("$orderby", orderBy);
  if (select.length) params.append("$select", select.join(","));
  if (expand) params.append("$expand", expand);

  const searchFilter =
    search && searchFields.length
      ? `(${searchFields
          .map((f) =>
            searchMode === "contains"
              ? `contains(${f}, '${search}')`
              : `${f} eq '${search}'`
          )
          .join(" or ")})`
      : "";
  //console.log("searchFilter", searchFilter);
  const allFilters = [searchFilter, baseFilter, ...filters].filter(Boolean);
  //console.log("allFilters", allFilters);

  if (allFilters.length) {
    params.append("$filter", allFilters.join(" and "));
  }

  return params;
};

export const MasterDataService = {
  async getItems({ top = 50, skip = 0, search = "" } = {}): Promise<any> {
    const params = buildODataQuery({
      top,
      skip,
      search,
      searchFields: ["ItemCode", "ItemName"],
      searchMode: "contains",
      baseFilter: `(SalesItem eq 'tYES')`, // InventoryItem eq 'tYES' and
      select: [
        "ItemCode",
        "ItemName",
        "InventoryItem",
        "SalesItem",
        "PurchaseItem",
        "UoMGroupEntry",
        "InventoryUoMEntry",
        "DefaultSalesUoMEntry",
        "DefaultPurchasingUoMEntry",
        "ItemPrices",
      ],
    });

    const raw = await fetchData("/Items", params, "Items");
      //console.log("raw items", raw);
      const uniqueItems = Object.values(
        raw.reduce((acc:any, item:any) => {
          acc[item.ItemCode] = item;
          return acc;
        }, {} as Record<string, (typeof raw)[number]>)
      );
    // if uniqueItems.length > 0  then add them into Item[] Array
    // const itemArray :Item[] = uniqueItems.map((item: any) => ({
    //   ItemCode: item.ItemCode,
    //   ItemName: item.ItemName,
    //   InventoryItem: item.InventoryItem,
    //   SalesItem: item.SalesItem,
    //   PurchaseItem: item.PurchaseItem,
    //   UoMGroupEntry: item.UoMGroupEntry,
    //   InventoryUoMEntry: item.InventoryUoMEntry,
    //   DefaultSalesUoMEntry: item.DefaultSalesUoMEntry,
    //   DefaultPurchasingUoMEntry: item.DefaultPurchasingUoMEntry,
    // }));
    //console.log("uniqueItems", uniqueItems);
    return uniqueItems || [];
  },
    fetchData: async (
    endpoint: string,
    params: URLSearchParams,
    logMessage: string
  ) => {
    try {

      const response = await sapApi.get(`${endpoint}?${params.toString()}`);
      const data = response?.data?.value || [];
// const data=[];
      if(endpoint === "/Items"){
        
        console.log(logMessage);
        console.log("items fetched from SAP:", data.length);
      }
      return data;
    } catch (error: any) {
      console.error(
        `❌ Error fetching data from ${endpoint}:`,
        error?.response?.data || error.message
      );
      return [];
    }
  },

  async getCustomers({ top = 50, skip = 0, search = "" } = {}): Promise<
    BusinessPartner[]
  > {
    const params = buildODataQuery({
      top,
      skip,
      search,
      searchFields: ["CardCode", "CardName"],
      baseFilter: `CardType eq 'cCustomer'`,
      searchMode: "contains",
      filters: ["CardType eq 'C'"],
      select: ["CardCode", "CardName", "PriceListNum", "Currency"],
      orderBy: "CardCode asc",
    });
    return await fetchData("/BusinessPartners", params, "Customers");
  },

  async getWarehouses({
    top = 50,
    skip = 0,
    search = "",
  } = {}): Promise<WarehouseList> {
    const params = buildODataQuery({
      top,
      skip,
      search,
      select: ["WarehouseCode", "WarehouseName"],
    });
    return await fetchData("/Warehouses", params, "Warehouses");
  },

  async getPriceLists({ top = 50, skip = 0, search = "" } = {}) {
    const params = buildODataQuery({
      top,
      skip,
      search,
      select: ["PriceListNo", "PriceListName"],
    });
    return await fetchData("/PriceLists", params, "PriceLists");
  },

  async getVatGroups({ top = 50, skip = 0, search = "" } = {}) {
    const params = buildODataQuery({
      top,
      skip,
      search,
      baseFilter: "Category eq 'bovcOutputTax'",
      searchFields: ["Code", "Name", "Category"],
      select: ["Code", "Name", "VatGroups_Lines"],
    });
    return await fetchData("/VatGroups", params, "VatGroups");
  },

  async getUOMs() {
    const params = buildODataQuery({
      select: ["AbsEntry", "Code", "Name"],
      //expand: "UoMGroupDefinitionCollection",
    });
    return await fetchData(
      "/UnitOfMeasurementGroups",
      params,
      "UnitOfMeasurementGroups"
    );
    //console.log("UOMs", data);
    //return data;
    //return raw.flatMap((u) => u.UoMGroupDefinitionCollection ?? []);
  },

  async fetchMasterData() {
    const [items, customers, warehouses, priceLists, vatGroups, uoms] =
      await Promise.all([
        this.getItems(),
        this.getCustomers(),
        this.getWarehouses(),
        this.getPriceLists(),
        this.getVatGroups(),
        this.getUOMs(),
      ]);
    //console.log("vatgroups", vatGroups);
    // const uniqueItems = Object.values(
    //   items.reduce((acc, item) => {
    //     acc[item.ItemCode] = item;
    //     return acc;
    //   }, {} as Record<string, typeof items[number]>)
    // );

    return {
      items: items,
      customers,
      warehouses,
      priceLists,
      vatGroups,
      uoms,
    };
  },
};

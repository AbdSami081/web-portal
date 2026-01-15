// import { sapApi } from "./auth";

import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { Item } from "@/types/sales/Item.type";
import { WarehouseList } from "@/types/warehouse.type";
import { sapApi } from "./auth";
import { fetchData } from "./fetchData";

// export const MasterDataService = {
//   // 🔹 Create a new SQL query
//   createSQLQuery: async (sqlCode: string, sqlText: string) => {
//     try {
//       console.log(`🚀 Creating SQL Query: ${sqlCode}`);
//       const payload = {
//         SqlCode: sqlCode,
//         SqlName: sqlCode,
//         SqlText: sqlText,
//       };
//       await sapApi.post("/SQLQueries", payload);
//       console.log(`✅ SQL Query ${sqlCode} created.`);
//     } catch (error: any) {
//       if (error?.response?.status === 409) {
//         console.warn(
//           `⚠️ SQL Query ${sqlCode} already exists. Skipping creation.`
//         );
//       } else {
//         console.error(
//           `❌ Failed to create SQL Query: ${sqlCode}`,
//           error?.response?.data || error.message
//         );
//         throw error;
//       }
//     }
//   },

//   // 🔹 Execute an existing SQL query
//   executeSQLQuery: async (sqlCode: string) => {
//     try {
//       console.log(`🚀 Executing SQL Query: ${sqlCode}`);
//       const response = await sapApi.post(
//         `/SQLQueries('${sqlCode}')/List`
//       );
//       console.log(
//         `✅ Retrieved ${
//           response?.data?.value?.length || 0
//         } records from SQL Query.`
//       );
//       return response?.data?.value || [];
//     } catch (error: any) {
//       console.error(
//         `❌ Failed to execute SQL Query: ${sqlCode}`,
//         error?.response?.data || error.message
//       );
//       throw error;
//     }
//   },

//   // 🔹 Delete an existing SQL query
//   deleteSQLQuery: async (sqlCode: string) => {
//     try {
//       console.log(`🗑️ Deleting SQL Query: ${sqlCode}`);
//       await sapApi.delete(`/SQLQueries('${sqlCode}')`);
//       console.log(`✅ SQL Query ${sqlCode} deleted.`);
//     } catch (error: any) {
//       console.warn(
//         `⚠️ Failed to delete SQL Query ${sqlCode} (may not exist):`,
//         error?.response?.data || error.message
//       );
//     }
//   },

  // fetchData: async (
  //   endpoint: string,
  //   params: URLSearchParams,
  //   logMessage: string
  // ) => {
  //   try {

  //     const response = await sapApi.get(`${endpoint}?${params.toString()}`);
  //     const data = response?.data?.value || [];

  //     if(endpoint === "/Items"){
  //       //console.log("masterdata.response",response);
  //       //const url = `${endpoint}?${params}`;
  //       //console.log(`🔍 Fetching data from ${url}...`);
  //       console.log(logMessage);
  //       console.log("items fetched from SAP:", data.length);
  //       //console.log(JSON.stringify(data, null, 2));
  //     }
  //     //console.log(`✅ Retrieved ${data.length} records from ${endpoint}.`);
  //     return data;
  //   } catch (error: any) {
  //     console.error(
  //       `❌ Error fetching data from ${endpoint}:`,
  //       error?.response?.data || error.message
  //     );
  //     return [];
  //   }
  // },

//   fetchMasterData: async () => {
//     const [items, warehouses, priceLists, customers, taxCodes, uoms] =
//       await Promise.all([
//         MasterDataService.getItems(),
//         MasterDataService.getWarehouses(),
//         MasterDataService.getPriceLists(),
//         MasterDataService.getCustomers(),
//         MasterDataService.getTaxCodes(),
//         MasterDataService.getUOMs(),
//       ]);
//     //console.log("taxCodes", taxCodes);
//     return { items, warehouses, priceLists, customers, taxCodes, uoms };
//   },

//   getItems: async (search = "", top = 50, skip = 0) => {
//     const params = new URLSearchParams();
//     params.append(
//       "$select",
//       [
//         "ItemCode",
//         "ItemName",
//         "InventoryItem",
//         "SalesItem",
//         "PurchaseItem",
//         "UoMGroupEntry",
//         "InventoryUoMEntry",
//         "DefaultSalesUoMEntry",
//         "DefaultPurchasingUoMEntry",
//       ].join(",")
//     );
//     if (top > 0) params.append("$top", top.toString());
//     if (skip > 0) params.append("$skip", skip.toString());

//     const sanitizedSearch = search.replace(/'/g, "''");
//     const baseFilter = `(InventoryItem eq 'tYES' and SalesItem eq 'tYES' and PurchaseItem eq 'tNO')`;
//     const searchFilter = search
//       ? `(contains(ItemName, '${sanitizedSearch}') or ItemCode eq '${sanitizedSearch}')`
//       : "";
//     // params.append(
//     //   "$filter",
//     //   searchFilter ? `${searchFilter} and ${baseFilter}` : baseFilter
//     // );
//     console.log("fetching data with top", top);
//     console.log("fetching data with skip", skip);
//     //console.log("fetching data with baseFilter", baseFilter);
//     //console.log("fetching data with searchFilter", searchFilter);
//     const result = await MasterDataService.fetchData(
//       "/Items",
//       params,
//       `🔍 Fetching SAP Items with top ${top} and skip ${skip}...`
//     );

//     return result;
//   },

//   getWarehouses: async () => {
//     const params = new URLSearchParams();
//     params.append("$select", "WarehouseCode,WarehouseName");
//     return await MasterDataService.fetchData(
//       "/Warehouses",
//       params,
//       "📦 Fetching Warehouses..."
//     );
//   },

//   getCustomers: async (search = "", top = 100) => {
//     const params = new URLSearchParams();
//     params.append("$select", ["CardCode", "CardName", "Currency"].join(","));
//     if (top > 0) params.append("$top", top.toString());

//     const sanitizedSearch = search.replace(/'/g, "''");
//     const baseFilter = `CardType eq 'cCustomer'`;
//     const searchFilter = search
//       ? `(contains(CardName, '${sanitizedSearch}') or CardCode eq '${sanitizedSearch}')`
//       : "";
//     params.append(
//       "$filter",
//       searchFilter ? `${baseFilter} and ${searchFilter}` : baseFilter
//     );
//     return await MasterDataService.fetchData(
//       "/BusinessPartners",
//       params,
//       "👥 Fetching Customers..."
//     );
//   },

//   getPriceLists: async () => {
//     const params = new URLSearchParams();
//     params.append("$select", "PriceListNo,PriceListName");
//     return await MasterDataService.fetchData(
//       "/PriceLists",
//       params,
//       "💰 Fetching Price Lists..."
//     );
//   },

//   getItemPrices: async (itemCode: string, priceList: number) => {
//     const params = new URLSearchParams();
//     params.append("$select", "ItemCode,PriceList,Price");
//     params.append(
//       "$filter",
//       `ItemCode eq '${itemCode}' and PriceList eq ${priceList}`
//     );
//     const results = await MasterDataService.fetchData(
//       "/ItemPrices",
//       params,
//       `💰 Fetching Price for ${itemCode} (List ${priceList})...`
//     );
//     return results?.[0]?.Price ?? 0;
//   },

//   getTaxCodes: async () => {
//     const params = new URLSearchParams();
//     params.append("$select", "Code,Name,Category,Inactive");
//     params.append("$filter", "Inactive eq 'N'");

//     return await MasterDataService.fetchData(
//       "/VatGroups",
//       params,
//       "🧾 Fetching Tax Codes (from VatGroups)..."
//     );
//   },

//   getUOMs: async () => {
//     const params = new URLSearchParams();
//     params.append("$select", "AbsEntry,Name");
//     return await MasterDataService.fetchData(
//       "/UnitOfMeasurementGroups",
//       params,
//       "📏 Fetching Unit of Measures..."
//     );
//   },
// };

// ✅ masterDataService.ts (Enhanced with full SAP OData query support via dynamic builder)


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
  async getItems({ top = 50, skip = 0, search = "" } = {}): Promise<Item[]> {
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
      raw.reduce((acc, item) => {
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

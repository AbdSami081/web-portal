import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { Item } from "@/types/sales/Item.type";
import { VatGroup } from "@/types/sales/VatGroups.type";
import { UoM } from "@/types/sales/UoM.type";

import { create } from "zustand";
import { Warehouse } from "@/types/warehouse.type";
import { getFreightTypes, fetchFreightWithCharges } from "@/api+/sap/master-data/freight";
import { getVatGroups } from "@/api+/sap/master-data/tax-codes";
import { getItemsList } from "@/api+/sap/master-data/items";
import { getCustomers } from "@/api+/sap/master-data/business-partners";
import { getwarehouses } from "@/api+/sap/master-data/warehouses";

interface MasterDataStore {
  items: Record<number, Item[]>;
  customers: BusinessPartner[];
  warehouses: Warehouse[];
  priceLists: [];
  uoms: UoM[];
  freightTypes: any[];
  freightsWithCharges: any[];
  itemSearch: string;
  itemLoading: boolean;
  masterDataLoaded: boolean;
  currentItemPage: number;

  loadMasterData: (cardType?: string, freightCategory?: string) => Promise<void>;
  loadExternalMasterData: (category?: string) => Promise<void>;
  loadItemPage: (page: number) => Promise<void>;
  loadMoreItemPages: () => Promise<void>;
  setItemSearch: (value: string) => void;
  flatItemList: () => Item[];
  reset: () => void;
}

export const useMasterDataStore = create<MasterDataStore>((set, get) => ({
  items: {},
  customers: [],
  warehouses: [],
  priceLists: [],
  uoms: [],
  freightTypes: [],
  freightsWithCharges: [],
  itemSearch: "",
  itemLoading: false,
  masterDataLoaded: false,
  currentItemPage: 1,

  async loadExternalMasterData(category = "") {
    const results = await Promise.allSettled([
      getFreightTypes(),
      fetchFreightWithCharges(category),
    ]);

    const updates: Partial<MasterDataStore> = {};
    if (results[0].status === "fulfilled") updates.freightTypes = results[0].value;
    if (results[1].status === "fulfilled") updates.freightsWithCharges = results[1].value;

    set(updates);
  },

  async loadMasterData(cardType = "", freightCategory = "") {
    if (get().masterDataLoaded && get().warehouses.length > 0) return;
    set({ itemLoading: true });
    try {
      const [items, customers, rawWarehouses] = await Promise.all([
        getItemsList("", 0, 20),
        getCustomers("", 0, 20, cardType),
        getwarehouses()
      ]);

      const warehousesMap = new Map<string, any>();
      for (const w of rawWarehouses) {
        const code = w.WhsCode;
        if (code && !warehousesMap.has(code)) {
          warehousesMap.set(code, {
            WarehouseCode: code,
            WarehouseName: w.WhsName
          });
        }
      }
      const warehouses = Array.from(warehousesMap.values());

      await get().loadExternalMasterData(freightCategory);

      set({
        items: { 1: items },
        customers,
        warehouses,
        masterDataLoaded: true,
        currentItemPage: 1,
        itemLoading: false,
      });
    } catch (error) {
      console.error("Failed to load master data", error);
      set({ itemLoading: false });
    }
  },
  async loadItemPage(page) {
    set({ itemLoading: true });
    try {
      const { itemSearch } = get();
      const skip = (page - 1) * 50;
      const pageItems = await getItemsList(itemSearch, skip, 50);

      set((state) => ({
        items: { ...state.items, [page]: pageItems },
        currentItemPage: page,
        itemLoading: false,
      }));
    } catch (error) {
      console.error("Failed to load item page", error);
      set({ itemLoading: false });
    }
  },

  async loadMoreItemPages() {
    const nextPage = get().currentItemPage + 1;
    await get().loadItemPage(nextPage);
  },

  setItemSearch(value) {
    set({ itemSearch: value, currentItemPage: 1, items: {} });
  },

  flatItemList() {
    return Object.values(get().items).flat();
  },

  reset() {
    set({
      items: {},
      customers: [],
      warehouses: [],
      priceLists: [],
      uoms: [],
      freightTypes: [],
      freightsWithCharges: [],
      itemSearch: "",
      itemLoading: false,
      currentItemPage: 1,
    });
  },
}));

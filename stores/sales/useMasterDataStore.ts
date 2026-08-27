import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { Item } from "@/types/sales/Item.type";
import { UoM } from "@/types/sales/UoM.type";

import { create } from "zustand";
import { Warehouse } from "@/types/warehouse.type";
import { Warehouse as RawWarehouse } from "@/types/warehouse/warehouse";
import { getFreightTypes, fetchFreightWithCharges } from "@/api+/sap/master-data/freight";
import { getItemsList } from "@/api+/sap/master-data/items";
import { getwarehouses } from "@/api+/sap/master-data/warehouses";

interface MasterDataStore {
  items: Record<number, Item[]>;
  customers: BusinessPartner[];
  warehouses: Warehouse[];
  rawWarehouses: RawWarehouse[];
  priceLists: [];
  uoms: UoM[];
  freightTypes: any[];
  freightsWithCharges: any[];
  loadedFreightCategory: string | null;
  itemSearch: string;
  itemLoading: boolean;
  masterDataLoaded: boolean;
  warehousesLoaded: boolean;
  currentItemPage: number;

  loadDocumentEssentials: (freightCategory?: string) => Promise<void>;
  loadMasterData: (cardType?: string, freightCategory?: string) => Promise<void>;
  loadExternalMasterData: (category?: string) => Promise<void>;
  loadWarehouses: () => Promise<RawWarehouse[]>;
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
  rawWarehouses: [],
  priceLists: [],
  uoms: [],
  freightTypes: [],
  freightsWithCharges: [],
  loadedFreightCategory: null,
  itemSearch: "",
  itemLoading: false,
  masterDataLoaded: false,
  warehousesLoaded: false,
  currentItemPage: 1,

  async loadExternalMasterData(category = "") {
    const isFreightTypesLoaded = get().freightTypes.length > 0;
    const isCategoryLoaded = get().loadedFreightCategory === category && get().freightsWithCharges.length > 0;

    if (isFreightTypesLoaded && isCategoryLoaded) {
      return;
    }

    const results = await Promise.allSettled([
      isFreightTypesLoaded ? Promise.resolve(get().freightTypes) : getFreightTypes(),
      fetchFreightWithCharges(category),
    ]);

    const updates: Partial<MasterDataStore> = {
      loadedFreightCategory: category,
    };
    if (results[0].status === "fulfilled") updates.freightTypes = results[0].value;
    if (results[1].status === "fulfilled") updates.freightsWithCharges = results[1].value;

    set(updates);
  },

  async loadWarehouses() {
    if (get().warehousesLoaded && get().rawWarehouses.length > 0) {
      return get().rawWarehouses;
    }

    const rawWarehouses = await getwarehouses();
    const warehousesMap = new Map<string, Warehouse>();

    for (const w of rawWarehouses) {
      const code = w.WhsCode;
      if (code && !warehousesMap.has(code)) {
        warehousesMap.set(code, {
          WarehouseCode: code,
          WarehouseName: w.WhsName,
          BPLid: w.BPLid,
        });
      }
    }

    set({
      rawWarehouses,
      warehouses: Array.from(warehousesMap.values()),
      warehousesLoaded: true,
    });

    return rawWarehouses;
  },

  async loadDocumentEssentials(freightCategory = "O") {
    const isWarehousesLoaded = get().warehousesLoaded;
    const isCategoryLoaded = get().loadedFreightCategory === freightCategory && get().freightsWithCharges.length > 0;

    if (isWarehousesLoaded && isCategoryLoaded) return;

    set({ itemLoading: true });
    try {
      await Promise.all([
        get().loadWarehouses(),
        get().loadExternalMasterData(freightCategory),
      ]);

      set({
        masterDataLoaded: true,
        itemLoading: false,
      });
    } catch (error) {
      console.error("Failed to load document essentials", error);
      set({ itemLoading: false });
    }
  },

  async loadMasterData(cardType = "", freightCategory = "") {
    const category = freightCategory || (cardType === "S" ? "I" : "O");
    await get().loadDocumentEssentials(category);
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
      rawWarehouses: [],
      priceLists: [],
      uoms: [],
      freightTypes: [],
      freightsWithCharges: [],
      loadedFreightCategory: null,
      itemSearch: "",
      itemLoading: false,
      masterDataLoaded: false,
      warehousesLoaded: false,
      currentItemPage: 1,
    });
  },
}));

import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { Item } from "@/types/sales/Item.type";
import { VatGroup } from "@/types/sales/VatGroups.type";
import { UoM } from "@/types/sales/UoM.type";
import axios from "axios";
import { create } from "zustand";
import { Warehouse } from "@/types/warehouse.type";

interface MasterDataStore {
  items: Record<number, Item[]>;
  customers: BusinessPartner[];
  warehouses: Warehouse[];
  priceLists: [];
  vatGroups: VatGroup[];
  uoms: UoM[];
  itemSearch: string;
  itemLoading: boolean;
  currentItemPage: number;

  loadMasterData: () => Promise<void>;
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
  vatGroups: [],
  uoms: [],
  itemSearch: "",
  itemLoading: false,
  currentItemPage: 1,

  async loadMasterData() {
    set({ itemLoading: true });
    try {
      const res = await axios.get("/api/sap/master-data");
      const data = res.data;

      const items = data.items || data.Items || [];
      const customers = data.customers || data.Customers || [];
      const warehouses = data.warehouses || data.Warehouses || [];
      const priceLists = data.priceLists || data.PriceLists || [];
      const vatGroups = data.vatGroups || data.VatGroups || [];
      const uoms = data.uoms || data.UoMs || [];

      set({
        items: { 1: items },
        customers,
        warehouses,
        priceLists,
        vatGroups,
        uoms,
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
      const res = await axios.get(
        `/api/sap/master-data/items?top=50&skip=${skip}&search=${encodeURIComponent(
          itemSearch
        )}`
      );
      const data = res.data;
      const pageItems = data.items || data.Items || [];

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
      vatGroups: [],
      uoms: [],
      itemSearch: "",
      itemLoading: false,
      currentItemPage: 1,
    });
  },
}));

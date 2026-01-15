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
    const res = await axios.get("/api/sap/master-data");
    const { items, customers, warehouses, priceLists, vatGroups, uoms } =
      await res.data;
    //console.log("loadMasterData", vatGroups);
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
  },

  async loadItemPage(page) {
    const { itemSearch, items } = get();
    set({ itemLoading: true });
    const skip = (page - 1) * 50;
    const res = await axios.get(
      `/api/sap/master-data/items?top=50&skip=${skip}&search=${encodeURIComponent(
        itemSearch
      )}`
    );
    const data = await res.data;
    const pageItems = data.items || [];
    // const uniquePageItems = pageItems.filter(
    //   (item) =>
    //     !Object.values(items)
    //       .flat()
    //       .some((i) => i.ItemCode === item.ItemCode)
    // );
    // set((state) => ({
    //   items: { ...state.items, [page]: uniquePageItems },
    //   currentItemPage: page,
    //   itemLoading: false,
    // }));
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

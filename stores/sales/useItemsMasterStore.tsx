// app/stores/useItemsMasterStore.ts
import { create } from "zustand";

type Item = {
  ItemCode: string;
  ItemName: string;
};

type ItemsStore = {
  items: Item[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  searchTerm: string;

  setSearchTerm: (term: string) => void;
  setPage: (page: number) => void;
  fetchItems: () => Promise<void>;
};

export const useItemsMasterStore = create<ItemsStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  page: 1,
  pageSize: 20,
  searchTerm: "",

  setSearchTerm: (term) => set({ searchTerm: term, page: 1 }),
  setPage: (page) => set({ page }),

  fetchItems: async () => {
    const { page, pageSize, searchTerm } = get();
    const skip = (page - 1) * pageSize;

    try {
      set({ loading: true });
      const res = await fetch(
        `/api/sap/items?top=${pageSize}&skip=${skip}&search=${encodeURIComponent(searchTerm)}`
      );
      const json = await res.json();
      set({ items: json.value, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
}));

import { create } from "zustand";
import { getPublicConfig, SapDatabase } from "@/api+/sap/config/publicConfigService";

interface PublicConfigStore {
  sapDatabases: SapDatabase[];
  version: string;
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
}

export const usePublicConfigStore = create<PublicConfigStore>((set, get) => ({
  sapDatabases: [],
  version: "",
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const config = await getPublicConfig();
    set({
      sapDatabases: config?.SapDatabases ?? [],
      version: config?.Version ?? "",
      loaded: true,
      loading: false,
    });
  },
}));

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getDocumentUDFs } from "@/api+/sap/master-data";
import { getMasterTable } from "@/types/master/DocumentTables";

interface UDF {
  Name: string;
  Description: string;
  DefaultValue: string | null;
  FieldID: number;
  Type: string;
  SubType: string;
  ValidValuesMD: {
    Value: string;
    Description: string;
  }[];
}

interface UDFStore {
  definitions: Record<number, UDF[]>;
  isLoading: Record<number, boolean>;
  fetchDefinitions: (docType: number, force?: boolean) => Promise<void>;
}

export const useUDFStore = create<UDFStore>()(
  devtools((set, get) => ({
    definitions: {},
    isLoading: {},

    fetchDefinitions: async (docType: number, force = false) => {
      // Don't refetch if already exists or loading, unless forced
      if (!force && (get().definitions[docType] || get().isLoading[docType])) return;

      set((state) => ({
        isLoading: { ...state.isLoading, [docType]: true }
      }));

      try {
        const tableName = getMasterTable(docType);
        const result = await getDocumentUDFs(tableName);
        
        const udfList = Array.isArray(result) 
          ? result 
          : (result as any)?.value ?? (result as any)?.[0]?.values ?? [];

        set((state) => ({
          definitions: { ...state.definitions, [docType]: udfList },
          isLoading: { ...state.isLoading, [docType]: false }
        }));
      } catch (error) {
        console.error(`Failed to fetch UDF definitions for docType ${docType}:`, error);
        set((state) => ({
          isLoading: { ...state.isLoading, [docType]: false }
        }));
      }
    },
  }))
);

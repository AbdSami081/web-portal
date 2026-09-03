import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getDocumentUDFs } from "@/api+/sap/master-data";
import { getMasterTable, getMasterLineTable } from "@/types/master/DocumentTables";

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
  /** UDFs defined on the document's LINE table (e.g. RDR1), keyed by docType. */
  lineDefinitions: Record<number, UDF[]>;
  lineLoading: Record<number, boolean>;
  fetchDefinitions: (docType: number, force?: boolean) => Promise<void>;
  fetchLineDefinitions: (docType: number, force?: boolean) => Promise<void>;
}

const toUdfList = (result: unknown): UDF[] =>
  Array.isArray(result)
    ? (result as UDF[])
    : ((result as any)?.value ?? (result as any)?.[0]?.values ?? []);

export const useUDFStore = create<UDFStore>()(
  devtools((set, get) => ({
    definitions: {},
    isLoading: {},
    lineDefinitions: {},
    lineLoading: {},

    fetchDefinitions: async (docType: number, force = false) => {
      if (!force && (get().definitions[docType] || get().isLoading[docType])) return;

      set((state) => ({
        isLoading: { ...state.isLoading, [docType]: true }
      }));

      try {
        const tableName = getMasterTable(docType);
        const result = await getDocumentUDFs(tableName);

        set((state) => ({
          definitions: { ...state.definitions, [docType]: toUdfList(result) },
          isLoading: { ...state.isLoading, [docType]: false }
        }));
      } catch (error) {
        console.error(`Failed to fetch UDF definitions for docType ${docType}:`, error);
        set((state) => ({
          isLoading: { ...state.isLoading, [docType]: false }
        }));
      }
    },

    fetchLineDefinitions: async (docType: number, force = false) => {
      if (!force && (get().lineDefinitions[docType] || get().lineLoading[docType])) return;

      const lineTable = getMasterLineTable(docType);
      if (!lineTable) {
        set((state) => ({ lineDefinitions: { ...state.lineDefinitions, [docType]: [] } }));
        return;
      }

      set((state) => ({ lineLoading: { ...state.lineLoading, [docType]: true } }));

      try {
        const result = await getDocumentUDFs(lineTable);
        set((state) => ({
          lineDefinitions: { ...state.lineDefinitions, [docType]: toUdfList(result) },
          lineLoading: { ...state.lineLoading, [docType]: false }
        }));
      } catch (error) {
        console.error(`Failed to fetch LINE UDF definitions for docType ${docType}:`, error);
        set((state) => ({ lineLoading: { ...state.lineLoading, [docType]: false } }));
      }
    },
  }))
);

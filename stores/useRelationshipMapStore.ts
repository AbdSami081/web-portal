import { create } from "zustand";

interface RelationshipMapStore {
  isOpen: boolean;
  docType: number;
  docEntry: number;
  docNum?: number | string;
  menuId?: string;
  openMap: (docType: number, docEntry: number, docNum?: number | string, menuId?: string) => void;
  closeMap: () => void;
}

export const useRelationshipMapStore = create<RelationshipMapStore>((set) => ({
  isOpen: false,
  docType: 0,
  docEntry: 0,
  docNum: undefined,
  menuId: undefined,
  openMap: (docType, docEntry, docNum, menuId) =>
    set({ isOpen: true, docType, docEntry, docNum, menuId }),
  closeMap: () =>
    set({ isOpen: false, docType: 0, docEntry: 0, docNum: undefined, menuId: undefined }),
}));

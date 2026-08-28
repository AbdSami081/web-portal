import { create } from "zustand";

interface RelationshipMapStore {
  isOpen: boolean;
  docType: number;
  docEntry: number;
  docNum?: number | string;
  openMap: (docType: number, docEntry: number, docNum?: number | string) => void;
  closeMap: () => void;
}

export const useRelationshipMapStore = create<RelationshipMapStore>((set) => ({
  isOpen: false,
  docType: 0,
  docEntry: 0,
  docNum: undefined,
  openMap: (docType, docEntry, docNum) =>
    set({ isOpen: true, docType, docEntry, docNum }),
  closeMap: () =>
    set({ isOpen: false, docType: 0, docEntry: 0, docNum: undefined }),
}));

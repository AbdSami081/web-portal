import { useUoMStore } from "@/stores/useUoMStore";

export const getUoMName = (code: string | number | null | undefined): string => {
  return useUoMStore.getState().getUoMName(code);
};

import { create } from "zustand";
import { toast } from "sonner";
import { ApprovalTemplate } from "@/types/template.type";
import { getTemplateDocuments } from "@/api+/sap/Templates/approvalTemplate";

type TemplateStore = {
  templates: ApprovalTemplate[];
  loading: boolean;
  fetchTemplates: () => Promise<void>;
  clearTemplates: () => void;
};

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  loading: false,

  fetchTemplates: async () => {
    set({ loading: true });
    try {
      const res = await getTemplateDocuments();
      set({ templates: res });
      console.log("Templates fetched successfully:", res);
    } catch (err: any) {
      toast.error(err.message || "Template load failed");
    } finally {
      set({ loading: false });
    }
  },

  clearTemplates: () => set({ templates: [] }),
}));

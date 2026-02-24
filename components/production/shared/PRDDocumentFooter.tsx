"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { usePRDDocConfig } from "./PRDDocumentLayout";
import { Button } from "@/components/ui/button";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";
import { AppLabel } from "@/components/Custom/AppLabel";

export default function PRDDocumentFooter() {
  const { watch, register, setValue } = useFormContext();
  const config = usePRDDocConfig();
  const [showItemSelector, setShowItemSelector] = useState(false);

  const handleItemSelect = (selectedItems: any[]) => {
    if (selectedItems.length > 0) {
      const item = selectedItems[0];
      setValue("U_ItemCode", item.itemCode);
      setValue("U_ItemDescription", item.itemName);
    }
    setShowItemSelector(false);
  };

  return (
    <div className="space-y-6 mt-8 border-t pt-6 bg-zinc-50/50 p-6 rounded-xl border border-zinc-100 shadow-sm transition-all hover:shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <AppLabel htmlFor="comments">Remarks</AppLabel>
            <Textarea
              id="comments"
              {...register("Remarks")}
              rows={4}
              placeholder="Enter additional information or notes here..."
              className="resize-none border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100 transition-all text-sm leading-relaxed"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <AppLabel htmlFor="pickRmrk">Pick and Pack Remarks</AppLabel>
            <Textarea
              id="pickRmrk"
              {...register("PickRmrk")}
              rows={4}
              placeholder="Enter pick and pack specific instructions..."
              className="resize-none border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100 transition-all text-sm leading-relaxed"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">

        {watch("ProductionOrderType") === "bopotSpecial" && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <AppLabel>Special Item Selection</AppLabel>
            <div className="flex gap-2">
              <div className="flex-1 h-10 px-3 flex items-center bg-white border border-zinc-100 rounded-lg text-sm text-zinc-500 truncate italic">
                {watch("U_ItemCode") ? `${watch("U_ItemCode")} - ${watch("U_ItemDescription")}` : "No special item selected"}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-4 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 transition-all font-medium whitespace-nowrap"
                onClick={() => setShowItemSelector(true)}
              >
                Select Item
              </Button>
            </div>
          </div>
        )}
      </div>

      <ItemSelectorDialog
        open={showItemSelector}
        onClose={() => setShowItemSelector(false)}
        onSelectItems={handleItemSelect}
        multiple={false}
      />
    </div>
  );
}

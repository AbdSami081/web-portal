import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { AppLabel } from "@/components/Custom/AppLabel";
import { useFmsContext } from "@/hooks/useFMS";
import { FmsFieldButton, fmsKeyDown } from "@/components/Custom/FmsFieldButton";

export default function InvDocumentFooter() {
  const {
    comments,
    setComments,
    journalMemo,
    setJournalMemo,
  } = useInventoryDocument();

  const { triggerFMS } = useFmsContext();
  const { watch, setValue } = useFormContext();

  const formComments = watch("Comments");
  const formJournalMemo = watch("JournalMemo");

  const currentComments = typeof formComments === "string" ? formComments : (comments || "");
  const currentJournalMemo = typeof formJournalMemo === "string" ? formJournalMemo : (journalMemo || "");

  return (
    <>
      <div className="grid grid-cols-2 gap-10 -mt-0">
        <div>
          <AppLabel htmlFor="journalComments">Journal Remarks</AppLabel>
          <Textarea
            id="journalComments"
            value={currentJournalMemo}
            onChange={(e) => {
              setJournalMemo(e.target.value);
              setValue("JournalMemo", e.target.value, { shouldDirty: true });
            }}
            className="h-24 mt-2 w-full"
            placeholder="Enter journal remarks..."
          />
        </div>

        <div>
          <div className="flex items-center gap-1">
            <AppLabel htmlFor="remarks">Remarks</AppLabel>
            <FmsFieldButton field="Comments" />
          </div>
          <Textarea
            id="remarks"
            value={currentComments}
            onChange={(e) => {
              setComments(e.target.value);
              setValue("Comments", e.target.value, { shouldDirty: true });
            }}
            onKeyDown={fmsKeyDown("Comments", triggerFMS)}
            className="h-24 mt-2 w-full"
            placeholder="Enter remarks or comments..."
          />
        </div>
      </div>
    </>
  );
}

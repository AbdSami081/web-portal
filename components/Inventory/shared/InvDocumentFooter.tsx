import { useEffect } from "react";
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
  const { watch } = useFormContext();

  // FMS writes to the RHF "Comments" field; mirror it into the store-bound textarea.
  const fmsComments = watch("Comments");
  useEffect(() => {
    if (typeof fmsComments === "string" && fmsComments !== comments) {
      setComments(fmsComments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fmsComments]);

  return (
    <>
      <div className="grid grid-cols-2 gap-10 -mt-0">
        <div>
          <AppLabel htmlFor="journalComments">Journal Remarks</AppLabel>
          <Textarea
            id="journalComments"
            value={journalMemo}
            onChange={(e) => setJournalMemo(e.target.value)}
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
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            onKeyDown={fmsKeyDown("Comments", triggerFMS)}
            className="h-24 mt-2 w-full"
            placeholder="Enter remarks or comments..."
          />
        </div>
      </div>
    </>
  );
}

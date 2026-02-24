import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { AppLabel } from "@/components/Custom/AppLabel";

export default function InvDocumentFooter() {
  const {
    comments,
    setComments,
    journalMemo,
    setJournalMemo,
  } = useInventoryDocument();

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
          <AppLabel htmlFor="remarks">Remarks</AppLabel>
          <Textarea
            id="remarks"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="h-24 mt-2 w-full"
            placeholder="Enter remarks or comments..."
          />
        </div>
      </div>
    </>
  );
}

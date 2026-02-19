import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";

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
          <Label htmlFor="journalComments">Journal Remarks</Label>
          <Textarea
            id="journalComments"
            value={journalMemo}
            onChange={(e) => setJournalMemo(e.target.value)}
            className="h-24 mt-2 w-full"
            placeholder="Enter journal remarks..."
          />
        </div>

        <div>
          <Label htmlFor="remarks">Remarks</Label>
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

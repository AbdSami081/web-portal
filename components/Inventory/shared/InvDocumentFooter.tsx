import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { AppLabel } from "@/components/Custom/AppLabel";
import { useFmsContext } from "@/hooks/useFMS";
import { FmsFieldButton, fmsKeyDown } from "@/components/Custom/FmsFieldButton";
import { useSalesPersonsStore } from "@/stores/useSalesPersonsStore";

export default function InvDocumentFooter() {
  const {
    comments,
    setComments,
    journalMemo,
    setJournalMemo,
    fieldAccess,
    salesPersonCode,
    setSalesPersonCode,
  } = useInventoryDocument();
  const hasFieldAccess = (f: string) => fieldAccess.includes(f);
  const salesPersons = useSalesPersonsStore((s) => s.salesPersons);

  const { triggerFMS } = useFmsContext();
  const { watch, setValue } = useFormContext();

  const formComments = watch("Comments");
  const formJournalMemo = watch("JournalMemo");

  const currentComments = typeof formComments === "string" ? formComments : (comments || "");
  const currentJournalMemo = typeof formJournalMemo === "string" ? formJournalMemo : (journalMemo || "");

  return (
    <>
      {hasFieldAccess("SalesPersonCode") && (
        <div className="max-w-95 mb-4" data-fms-field="SalesPersonCode">
          <AppLabel htmlFor="SalesPersonCode">Sales Employee</AppLabel>
          <Select
            value={salesPersonCode !== null && salesPersonCode !== undefined ? String(salesPersonCode) : ""}
            onValueChange={(val) => setSalesPersonCode(val === "" ? null : Number(val))}
          >
            <SelectTrigger id="SalesPersonCode" className="w-full mt-2">
              <SelectValue placeholder="Select sales employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sales Employee</SelectLabel>
                {salesPersons.map((p) => (
                  <SelectItem key={p.SalesEmployeeCode} value={String(p.SalesEmployeeCode)}>
                    {p.SalesEmployeeName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-10 -mt-0">
        {hasFieldAccess("JournalMemo") && (
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
        )}

        {hasFieldAccess("Comments") && (
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
        )}
      </div>
    </>
  );
}

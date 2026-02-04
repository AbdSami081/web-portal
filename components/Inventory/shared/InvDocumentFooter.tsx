import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/sap/helpers/currencyFormatter";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import { GenericModal } from "@/modals/GenericModal";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { useInvDocConfig } from "./InvDocumentLayout";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { DocumentType } from "@/types/sales/salesDocuments.type";

export default function InvDocumentFooter() {
  const { watch, register } = useFormContext();
  // const {
  //   comments
  // } = useInventoryDocument();


  const [openModal, setOpenModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const employees = [
    { Name: "Ali Khan", Remarks: "Senior Sales Executive" },
    { Name: "Ahsan Raza", Remarks: "Field Sales Officer" },
    { Name: "Hamza Ahmed", Remarks: "Regional Manager" },
    { Name: "Sara Malik", Remarks: "Assistant Sales Rep" },
  ];


  return (
    <>
      <div className="grid grid-cols-2 gap-10 -mt-0">
        <div>
          <Label htmlFor="journalComments">Journal Remarks</Label>
          <Textarea
            id="journalComments"
            {...register("JournalMemo")}
            className="h-24 mt-2 w-full"
            placeholder="Enter journal remarks..."
          />
        </div>

        <div>
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea
            id="remarks"
            {...register("Comments")}
            className="h-24 mt-2 w-full"
            placeholder="Enter remarks or comments..."
          />
        </div>
      </div>
    </>
  );
}

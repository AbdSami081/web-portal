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
  const { watch } = useFormContext();
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

  const config = useInvDocConfig();

  return (
    <>
      <div className={`flex items-center gap-4 mt-10`}>
        {/* <Label className="text-sm w-28">Sales Employee :</Label>

        <div className={`relative w-[250px] flex items-center `}>
          <Select onValueChange={(v) => setSelectedEmployee(v)} value={selectedEmployee}>
            <SelectTrigger className="w-full pr-10">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {employees.map((emp) => (
                  <SelectItem key={emp.Name} value={emp.Name}>
                    {emp.Name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Settings
            className="absolute right-3 h-5 w-5 cursor-pointer text-gray-500 hover:text-black"
            onClick={() => setOpenModal(true)}
          />
        </div>

        <GenericModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSelect={(name: any) => setSelectedEmployee(name)}
          data={employees}
          columns={[
            { key: "Name", label: "Employee Name" },
            { key: "Remarks", label: "Remarks" },
          ]}
          title="Select Sales Employee"
          getSelectValue={(item) => item.Name}
        /> */}
      </div>

      <div className="grid grid-cols-2 gap-20">
        <div>
          <Label htmlFor="comments">Journal Remarks</Label>
          <Textarea
            id="comments"
            className="h-24 mt-4 max-w-95"
            // value={comments}
            // onChange={(e) => setComments(e.target.value)}
            placeholder="Enter journal remarks..."
          />
        </div>

        <div className={`space-y-3 p-4 rounded-lg text-sm -mt-18`}>
            {config.type == DocumentType.InvTransferReq && (
              <div>
                <Label htmlFor="picknpack">Pick & pack remarks</Label>
                <Textarea
                    id="picknpack"
                    className="h-24 mt-4 "
                    // value={comments}
                    // onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter remarks or comments..."
                />
            </div>
            )} 
            <div>
                <Label htmlFor="comments">Remarks</Label>
                <Textarea
                    id="comments"
                    className="h-24 mt-4 "
                    // value={comments}
                    // onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter remarks or comments..."
                />
            </div>
        </div>
      </div>
    </>
  );
}

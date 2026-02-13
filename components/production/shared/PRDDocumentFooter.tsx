import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { usePRDDocConfig } from "./PRDDocumentLayout";
import { GenericModal } from "@/modals/GenericModal";
import { Button } from "@/components/ui/button";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";

export default function PRDDocumentFooter() {
  const { watch, register } = useFormContext();
  // const {
  //   comments
  // } = useInventoryDocument();

  const config = usePRDDocConfig();
  const [openModal, setOpenModal] = useState(false);
  const [selectedDocNo, setSelectedDocNo] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  const [openItemModal, setItemModal] = useState(false);
  const { addLine } = useIFPRDDocument();

  const productionOrder = [
    {
      DocnumentNo: 155,
      SeriesType: "Primary",
      PRDOrderType: "Standard",
      DueDate: "30-17-2025",
      ProductNo: "P20001",
      ProductDesc: "120GB Memory Server"
    },
    {
      DocnumentNo: 156,
      SeriesType: "Primary",
      PRDOrderType: "Urgent",
      DueDate: "15-05-2025",
      ProductNo: "P20002",
      ProductDesc: "256GB SSD Drive"
    },
    {
      DocnumentNo: 157,
      SeriesType: "Secondary",
      PRDOrderType: "Standard",
      DueDate: "20-06-2025",
      ProductNo: "P20003",
      ProductDesc: "8GB DDR4 RAM"
    },
    {
      DocnumentNo: 158,
      SeriesType: "Primary",
      PRDOrderType: "Bulk",
      DueDate: "25-07-2025",
      ProductNo: "P20004",
      ProductDesc: "Gaming Motherboard"
    }
  ];

  const orderDetails = [
    {
      orderNumber: 155,
      rowNumber: 1,
      itemNumber: "P20001",
      itemDescription: "120GB Memory Server",
      type: "Standard",
      qty: 100,  // Assuming a quantity for the order
      warehouse: "WH01",  // Assuming a warehouse location
      startDate: "2025-03-01",  // Placeholder start date
      endDate: "2025-03-30"  // Assuming the due date
    },
    {
      orderNumber: 156,
      rowNumber: 2,
      itemNumber: "P20002",
      itemDescription: "256GB SSD Drive",
      type: "Urgent",
      qty: 50,
      warehouse: "WH02",
      startDate: "2025-04-01",
      endDate: "2025-05-15"
    },
    {
      orderNumber: 157,
      rowNumber: 3,
      itemNumber: "P20003",
      itemDescription: "8GB DDR4 RAM",
      type: "Standard",
      qty: 200,
      warehouse: "WH01",
      startDate: "2025-04-15",
      endDate: "2025-06-20"
    },
    {
      orderNumber: 155,
      rowNumber: 4,
      itemNumber: "P20004",
      itemDescription: "Gaming Motherboard",
      type: "Bulk",
      qty: 300,
      warehouse: "WH03",
      startDate: "2025-06-01",
      endDate: "2025-07-25"
    }
  ];

  const ITEM_SELECTOR_COLUMNS = [
    { key: "itemNumber", header: "Item Number" },
    { key: "itemDescription", header: "Item Description" },
    { key: "orderNumber", header: "Order Number" },
    { key: "rowNumber", header: "Row Number" },
    { key: "type", header: "Type" },
    { key: "qty", header: "Quantity" },
    { key: "warehouse", header: "Warehouse" },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" }
  ];

  const ITEM_SELECTOR_SEARCH_KEYS = [
    "orderNumber",
    "itemNumber",
    "itemDescription",
    "type"
  ];

  const onSelectDocument = (docNo: any) => {

    const filtered = orderDetails.filter(
      (item) => item.orderNumber === docNo
    );

    setSelectedDocNo(docNo);

    setSelectedDocs(filtered);

    setOpenModal(false);

    setItemModal(true);
  };


  const handleOnSelectItems = (items: any[]) => {
    items.map((item: any) => {

      addLine({
        ItemNo: item.itemNumber,
        ItemName: item.itemDescription,
        PlannedQuantity: item.qty,
        Warehouse: item.warehouse,
        ItemType: item.type
      });
    });

  }

  return (
    <>

      <div className="grid grid-cols-2 gap-20">
        <div>
          <Label htmlFor="comments">Remarks</Label>
          <Textarea
            id="comments"
            {...register("Remarks")}
            className="h-24 mt-4 max-w-95"
            placeholder="Enter remarks..."
          />
        </div>

        <div>
          <Label htmlFor="journalRemarks">Journal Remarks</Label>
          <Textarea
            id="journalRemarks"
            {...register("JournalRemarks")}
            className="h-24 mt-4 max-w-95"
            placeholder="Enter journal remarks..."
          />
        </div>
      </div>

      <div className="flex items-end justify-end mt-4">
        {config.footerActions?.showProductionOrderButton && (
          <Button type="button" className="cursor-pointer" onClick={() => setOpenModal(true)}>
            Production Order
          </Button>
        )}
      </div>


      <GenericModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSelect={onSelectDocument}
        data={productionOrder}
        columns={[
          { key: "DocnumentNo", label: "Document No" },
          { key: "SeriesType", label: "Series Type" },
          { key: "PRDOrderType", label: "Order Type" },
          { key: "DueDate", label: "Due Date" },
          { key: "ProductNo", label: "Product Number" },
          { key: "ProductDesc", label: "Product Description" }
        ]}

        title="List Of Production Order"
        getSelectValue={(item) => item.DocnumentNo}
      />

      <ItemSelectorDialog
        open={openItemModal}
        onClose={() => setItemModal(false)}
        onSelectItems={handleOnSelectItems}
      />
    </>
  );
}

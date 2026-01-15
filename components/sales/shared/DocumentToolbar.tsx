import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  Rewind,
  FastForward,
} from "lucide-react";
import { useCallback } from "react";

type Props = {
  currentDocEntry: number;
  resource: "Quotations" | "Orders" | "DeliveryNotes" | "Invoices";
};

export default function DocumentToolbar({ currentDocEntry, resource }: Props) {
  const router = useRouter();

  const handleNavigate = useCallback(
    async (type: "first" | "prev" | "next" | "last") => {
      let query = "";

      switch (type) {
        case "first":
          query = `$orderby=DocEntry asc&$top=1`;
          break;
        case "last":
          query = `$orderby=DocEntry desc&$top=1`;
          break;
        case "prev":
          query = `$filter=DocEntry lt ${currentDocEntry}&$orderby=DocEntry desc&$top=1`;
          break;
        case "next":
          query = `$filter=DocEntry gt ${currentDocEntry}&$orderby=DocEntry asc&$top=1`;
          break;
      }

      const response = await fetch(`/sap/${resource}?${query}`);
      const data = await response.json();
      const doc = data.value?.[0];

      if (doc?.DocEntry) {
        router.push(`/${resource.toLowerCase()}/${doc.DocEntry}`);
      }
    },
    [router, currentDocEntry, resource]
  );

  return (
    <div className="flex items-center gap-2 bg-muted px-4 py-2 border rounded mb-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleNavigate("first")}
      >
        <Rewind className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleNavigate("prev")}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleNavigate("next")}
      >
        <ArrowRight className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => handleNavigate("last")}
      >
        <FastForward className="w-4 h-4" />
      </Button>
      <div className="mx-2 border-l h-5" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/dashboard/sales/${resource?.toLowerCase()}/new`)}
      >
        <Plus className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => alert("Implement find modal")}
      >
        <Search className="w-4 h-4" />
      </Button>
    </div>
  );
}

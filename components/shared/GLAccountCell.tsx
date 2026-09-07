"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { GenericModal } from "@/modals/GenericModal";
import { getChartOfAccounts, ChartOfAccount } from "@/api+/sap/accounting/chartOfAccounts";

interface Props {
  value?: string;
  disabled?: boolean;
  onChange: (accountCode: string) => void;
}

export function GLAccountCell({ value, disabled, onChange }: Props) {
  const [draft, setDraft] = useState(value || "");
  const lastValue = useRef(value || "");
  const [modalOpen, setModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(false);

  if ((value || "") !== lastValue.current) {
    lastValue.current = value || "";
    setDraft(value || "");
  }

  const openModal = async () => {
    setModalOpen(true);
    if (accounts.length === 0) {
      setLoading(true);
      setAccounts(await getChartOfAccounts());
      setLoading(false);
    }
  };

  const commit = (val: string) => {
    lastValue.current = val;
    setDraft(val);
    onChange(val);
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        className="h-6 w-full"
        value={draft}
        placeholder="G/L Account"
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft.trim())}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={openModal}
        disabled={disabled}
      >
        <Search className="h-4 w-4" />
      </Button>

      <GenericModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(val) => {
          commit(val);
          setModalOpen(false);
        }}
        data={accounts}
        isLoading={loading}
        columns={[
          { key: "Code", label: "Account Code" },
          { key: "Name", label: "Account Name" },
        ]}
        title="Select G/L Account"
        getSelectValue={(item) => (item as ChartOfAccount).Code}
      />
    </div>
  );
}

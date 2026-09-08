"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { GenericModal } from "@/modals/GenericModal";
import {
  ChartOfAccount,
  loadChartOfAccounts,
  loadMoreChartOfAccounts,
  searchChartOfAccounts,
} from "@/api+/sap/accounting/chartOfAccounts";

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
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  if ((value || "") !== lastValue.current) {
    lastValue.current = value || "";
    setDraft(value || "");
  }

  const openModal = async () => {
    setModalOpen(true);
    setLoading(true);
    const page = await loadChartOfAccounts();
    setAccounts(page.items);
    setHasMore(page.hasMore);
    setLoading(false);
  };

  const handleLoadMore = async () => {
    setLoading(true);
    const page = search ? await searchChartOfAccounts(search) : await loadMoreChartOfAccounts();
    setAccounts(page.items);
    setHasMore(page.hasMore);
    setLoading(false);
  };

  const handleSearch = async (term: string) => {
    setSearch(term);
    setLoading(true);
    const page = term.trim() ? await searchChartOfAccounts(term) : await loadChartOfAccounts();
    setAccounts(page.items);
    setHasMore(page.hasMore);
    setLoading(false);
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
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onSearch={handleSearch}
        searchValue={search}
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

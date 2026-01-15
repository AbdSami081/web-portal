import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ChevronsUpDown } from "lucide-react";
import { VatGroup } from "@/types/sales/VatGroups.type";

interface Props {
  value: string;
  onChange: (val: string) => void;
  vatGroups: VatGroup[];
}

export function VatGroupSelectorCombo({ value, onChange, vatGroups }: Props) {
  const [open, setOpen] = useState(false);
  const selected = vatGroups.find((u) => u.Code.toString() === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          size="sm"
          className="w-28 justify-between h-6 px-2 text-xs"
        >
          {selected ? selected.Code : "Select Tax Code"}
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder="Search Tax Code..." className="text-xs" />
          <CommandList>
            {vatGroups.map((vat: VatGroup) => (
              <CommandItem
                key={vat.Code}
                value={vat.Code.toString()}
                onSelect={() => {
                  onChange(vat.Code.toString());
                  setOpen(false);
                }}
              >
                {vat.Code} - {vat.Name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

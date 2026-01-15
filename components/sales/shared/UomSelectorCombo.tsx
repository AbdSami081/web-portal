import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

import { ChevronsUpDown } from "lucide-react";
import { UoM } from "@/types/sales/UoM.type";

interface Props {
  value: string;
  onChange: (val: string) => void;
  uoms: UoM[];
}

export function UomSelectorCombo({ value, onChange, uoms }: Props) {
  const [open, setOpen] = useState(false);
  const selected = uoms.find((u) => u.AbsEntry.toString() === value);

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
          {selected ? selected.Name : "Select UoM"}
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder="Search UoM..." className="text-xs" />
          <CommandList>
            {uoms.map((uom) => (
              <CommandItem
                key={uom.AbsEntry}
                value={uom.AbsEntry.toString()}
                onSelect={() => {
                  onChange(uom.AbsEntry.toString());
                  setOpen(false);
                }}
              >
                {uom.Name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type SapUserOption = { userId: number; userName: string; userCode?: string };

export function sapUserLabel(user: Pick<SapUserOption, "userName" | "userCode"> | undefined) {
  const code = user?.userCode?.trim() ?? "";
  const name = user?.userName?.trim() ?? "";
  if (code && name && code.localeCompare(name, undefined, { sensitivity: "accent" }) !== 0) {
    return `${code} — ${name}`;
  }
  return name || code;
}

export function SapUserCombobox({
  users,
  value,
  onChange,
  disabled,
}: {
  users: SapUserOption[];
  value: number;
  onChange: (userId: number, userName: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = users.find((user) => user.userId === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full max-w-md justify-between font-normal"
        >
          <span className="truncate">{sapUserLabel(selected) || "Select user"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.userId}
                  value={`${user.userCode ?? ""} ${user.userName} ${user.userId}`}
                  onSelect={() => {
                    onChange(user.userId, user.userName);
                    setOpen(false);
                  }}
                >
                  {sapUserLabel(user)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

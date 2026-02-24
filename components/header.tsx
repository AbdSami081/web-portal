"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { FilePlus2, Search, Package, ShoppingCart, Factory, ClipboardList, BadgeDollarSign, LayoutDashboardIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import Link from "next/link";
import { useAuth } from "@/context/authContext";
import { SERVER_MENUS } from "@/lib/menu-data"

const ICON_MAP: Record<string, any> = {
  "LayoutDashboardIcon": LayoutDashboardIcon,
  "BadgeDollarSign": BadgeDollarSign,
  "Package": Package,
  "Factory": Factory,
  "ShoppingCart": ShoppingCart,
  "ClipboardList": ClipboardList
};

const HeaderNav = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allowed = user?.allowedModules?.map(m => m.toLowerCase()) || [];
  const isAllAllowed = allowed.includes("all");

  const suggestions = useMemo(() => {
    const flatList: any[] = [];

    SERVER_MENUS.forEach(menu => {
      const parentIcon = menu.iconName ? ICON_MAP[menu.iconName] : Package;

      if (menu.items) {
        menu.items.forEach(item => {
          if (isAllAllowed || allowed.includes(item.id.toLowerCase())) {
            flatList.push({
              id: item.id,
              label: item.title,
              href: item.url,
              icon: parentIcon // Use parent module icon for sub-items
            });
          }
        });
      } else {
        if (menu.url !== "#" && (isAllAllowed || allowed.includes(menu.id.toLowerCase()))) {
          flatList.push({
            id: menu.id,
            label: menu.title,
            href: menu.url,
            icon: parentIcon
          });
        }
      }
    });

    return flatList.filter(s => s.label.toLowerCase().includes(search.toLowerCase()));
  }, [search, allowed, isAllAllowed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-b-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4 px-4 w-full">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-sm relative" ref={containerRef}>
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-9 h-9 w-full bg-zinc-100/50 border-zinc-200 focus:bg-white focus:ring-blue-500/20 focus:border-blue-500/50 rounded-md transition-all placeholder:text-zinc-400"
              />
            </div>
            {/* Suggestions Dropdown logic remains same */}
            {showSuggestions && search.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
                <Command className="rounded-md">
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>No documents found.</CommandEmpty>
                    <CommandGroup heading="Quick Access">
                      {suggestions.map((item: any) => (
                        <CommandItem key={item.href} className="p-0">
                          <Link
                            href={item.href}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-zinc-100"
                            onClick={() => setShowSuggestions(false)}
                          >
                            <item.icon className="h-4 w-4 text-zinc-500" />
                            <span>{item.label}</span>
                          </Link>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>

          <div id="header-action-container" className="flex items-center gap-2" />
        </div>
      </header>
    </>
  );
};

export default HeaderNav;

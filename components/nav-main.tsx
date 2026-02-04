"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Minus, Plus, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/authContext";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    id: string;
    title: string;
    url: string;
    icon: LucideIcon;
    items?: {
      id?: string;
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { user } = useAuth();
  const currentPath = usePathname();
  const [openParent, setOpenParent] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    console.log('[NAV-MAIN] User allowedModules:', user?.allowedModules);
    if (!user?.allowedModules) return [];

    // 1. If "all", show everything
    if (user.allowedModules.some(m => m.toLowerCase() === "all")) {
      console.log('[NAV-MAIN] Showing all modules (allowedModules contains "all")');
      return items;
    }

    // 2. Filter items recursively
    const allowed = user.allowedModules.map(m => m.toLowerCase());

    const deepFiltered = items.map(item => {
      // Clone item to safeguard constants
      const newItem = { ...item };

      if (newItem.items && newItem.items.length > 0) {
        newItem.items = newItem.items.filter(child =>
          child.id && allowed.includes(child.id.toLowerCase())
        );
      }
      return newItem;
    }).filter(item => {
      // Keep if:
      // 1. Explicitly Allowed (e.g. Dashboard)
      if (allowed.includes(item.id.toLowerCase())) return true;

      // 2. OR Has allowed children (e.g. Sales with only Delivery allowed)
      if (item.items && item.items.length > 0) return true;

      return false;
    });

    console.log('[NAV-MAIN] Filtered items:', deepFiltered.map(i => i.id));
    return deepFiltered;
  }, [items, user?.allowedModules]);

  useEffect(() => {
    const activeParent = filteredItems.find(
      (item) =>
        item.items &&
        item.items.some((sub) => currentPath.startsWith(sub.url))
    )?.title;

    if (activeParent) setOpenParent(activeParent);

  }, [currentPath, filteredItems]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-slate-500 font-bold tracking-widest text-[10px] uppercase mb-4 px-4">Core Modules</SidebarGroupLabel>
      <SidebarMenu className="gap-1 px-2">
        {filteredItems.map((item) => {
          const hasChildren = item.items && item.items.length > 0;
          const isOpen = openParent === item.title;

          return (
            <Collapsible
              key={item.title}
              open={isOpen}
              onOpenChange={(open) => setOpenParent(open ? item.title : null)}
            >
              <SidebarMenuItem>
                {hasChildren ? (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`
                      h-10 rounded-lg transition-all duration-200 group/btn flex items-center
                      ${isOpen ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}
                    `}>
                      <item.icon size={18} className={`
                        transition-colors shrink-0
                        ${isOpen ? "text-white" : "text-slate-400 group-hover/btn:text-slate-200"}
                      `} />
                      <span className="font-medium ml-3 truncate transition-colors">{item.title}</span>

                      <div className="ml-auto transition-transform duration-200 shrink-0">
                        {isOpen ? (
                          <Minus className="text-white/70" size={14} />
                        ) : (
                          <Plus className="opacity-40 group-hover/btn:opacity-100" size={14} />
                        )}
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <SidebarMenuButton asChild className={`
                    h-10 rounded-lg transition-all duration-200 flex items-center
                    ${currentPath === item.url ? "bg-white text-black shadow-lg shadow-white/10" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}
                  `}>
                    <Link href={item.url} className="flex items-center w-full">
                      <item.icon size={18} className="shrink-0" />
                      <span className="font-medium ml-3 truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}

                {hasChildren && (
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <SidebarMenuSub className="ml-4 mt-1 border-l border-white/10 pl-2 gap-1 flex flex-col">
                      {item.items?.map((child) => {
                        const isSubActive = currentPath === child.url;
                        return (
                          <SidebarMenuSubItem key={child.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              className={`
                                h-9 rounded-md transition-all text-sm flex items-center
                                ${isSubActive
                                  ? "text-white font-semibold bg-white/10"
                                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}
                              `}
                            >
                              <Link href={child.url} className="flex items-center gap-3 w-full">
                                <div className={`size-1 rounded-full shrink-0 ${isSubActive ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-slate-700"}`} />
                                <span className="truncate">{child.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Circle, Minus, Plus, type LucideIcon } from "lucide-react";
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
} from "./ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = {
  id?: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: NavItem[];
};

function hasActiveChild(items: NavItem[] | undefined, currentPath: string): boolean {
  if (!items?.length) return false;

  return items.some(
    (item) =>
      currentPath === item.url || hasActiveChild(item.items, currentPath)
  );
}

// UI Styling Configs with balanced left padding
const levelConfigs = {
  level2: {
    padding: "pl-3", // Added padding-left for Child modules
    iconColor: "text-slate-500",
    textColor: "text-slate-400 hover:text-white",
    hoverBg: "hover:bg-white/5",
    activeText: "text-slate-100 font-semibold",
    activeBg: "bg-white/10",
  },
  level3: {
    padding: "pl-4", // Added deeper padding-left for Sub-child modules
    iconColor: "text-slate-600",
    textColor: "text-slate-500 hover:text-slate-300",
    hoverBg: "hover:bg-white/3",
    activeText: "text-white font-semibold",
    activeBg: "bg-white/10",
  },
};

function RecursiveMenuItem({
  item,
  currentPath,
  depth = 0,
}: {
  item: NavItem;
  currentPath: string;
  depth?: number;
}) {
  const hasChildren = !!item.items?.length;
  const [open, setOpen] = useState(() => hasActiveChild(item.items, currentPath));
  const isActive = currentPath === item.url;
  
  const config = depth === 0 ? levelConfigs.level2 : levelConfigs.level3;

  useEffect(() => {
    if (hasChildren) {
      setOpen(hasActiveChild(item.items, currentPath));
    }
  }, [currentPath, hasChildren, item.items]);

  const buttonClasses = cn(
    "flex w-full items-start gap-2.5 rounded-lg py-2 transition-all duration-200 h-auto min-h-[38px]",
    config.textColor,
    config.hoverBg,
    config.padding,
    isActive && `${config.activeText} ${config.activeBg}`
  );

  if (!hasChildren) {
    return (
      <li>
        <Link href={item.url} className={buttonClasses}>
          <div className="size-4 flex items-center justify-center shrink-0 mt-0.5">
            <div className={cn(
                "size-1.5 rounded-full transition-all", 
                isActive ? "bg-slate-300 shadow-[0_0_6px_rgba(241,245,249,0.6)]" : "bg-slate-600 group-hover:bg-slate-400"
            )} />
          </div>
          <span className="text-[13px] whitespace-normal break-words leading-tight flex-1">
            {item.title}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className={cn(buttonClasses, "items-center")}>
            {item.icon ? (
              <item.icon size={16} className={cn("shrink-0", config.iconColor, isActive && config.activeText)} />
            ) : (
                <div className="size-4 shrink-0" />
            )}
            <span className="text-[13px] text-left font-medium whitespace-normal break-words leading-tight flex-1">
              {item.title}
            </span>
            
            <div className="relative ml-auto flex size-4 items-center justify-center shrink-0">
              <Plus
                size={15}
                className={cn(
                  "absolute transition-all duration-300 ease-in-out",
                  open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 text-slate-500"
                )}
              />
              <Minus
                size={15}
                className={cn(
                  "absolute transition-all duration-300 ease-in-out",
                  open ? "rotate-0 scale-100 opacity-100 text-white" : "-rotate-90 scale-0 opacity-0"
                )}
              />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          {/* Fixed the broken pl- class to pl-3 here */}
          <SidebarMenuSub className="ml-4 mt-1 border-l border-white/5 pl-3 gap-1.5 flex flex-col relative before:absolute before:left-[-1px] before:top-0 before:h-2 before:w-px before:bg-slate-900">
            {item.items?.map((child) => (
              <RecursiveMenuItem
                key={child.id || child.title}
                item={child}
                currentPath={currentPath}
                depth={depth + 1}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

export function NavMain({ items }: { items: NavItem[] }) {
  const { user } = useAuth();
  const currentPath = usePathname();
  const [openParent, setOpenParent] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (!user?.allowedModules) return [];

    if (user.allowedModules.some((m) => m.toLowerCase() === "all")) {
      return items;
    }

    const allowed = user.allowedModules.map((m) => m.toLowerCase());

    const filterRecursive = (menuItems: NavItem[]): NavItem[] => {
      return menuItems
        .map((item) => {
          const clone: NavItem = { ...item };

          if (clone.items?.length) {
            clone.items = filterRecursive(clone.items);
          }

          return clone;
        })
        .filter((item) => {
          if (item.id && allowed.includes(item.id.toLowerCase())) {
            return true;
          }

          return !!item.items?.length;
        });
    };

    return filterRecursive(items);
  }, [items, user?.allowedModules]);

  useEffect(() => {
    const activeParent = filteredItems.find((item) => hasActiveChild(item.items, currentPath));
    if (activeParent) {
      setOpenParent(activeParent.title);
    }
  }, [currentPath, filteredItems]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:p-0">
      <SidebarGroupLabel className="text-slate-600 font-semibold tracking-wider text-[11px] uppercase mb-2 px-4 group-data-[collapsible=icon]:hidden">
        Core Applications
      </SidebarGroupLabel>

      <SidebarMenu className="gap-1.5 px-2 group-data-[collapsible=icon]:px-0">
        {filteredItems.map((item) => {
          const hasChildren = !!item.items?.length;
          const isOpen = openParent === item.title;
          const isDirectlyActive = currentPath === item.url;
          
          const level1BaseClasses = "h-auto min-h-10 py-2.5 rounded-xl transition-all duration-200 group/btn flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0";
          const level1ActiveClasses = "bg-white text-black shadow-[0_8px_16px_-4px_rgba(255,255,255,0.15)]";
          const level1InactiveClasses = "text-slate-300 hover:bg-white/5 hover:text-white";
          const level1OpenClasses = "bg-white/5 text-white";

          return (
            <Collapsible
              key={item.id || item.title}
              open={isOpen}
              onOpenChange={(open) => setOpenParent(open ? item.title : null)}
            >
              <SidebarMenuItem>
                {hasChildren ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={cn(
                            level1BaseClasses,
                            "items-center",
                            isOpen ? level1OpenClasses : level1InactiveClasses
                        )}
                      >
                        {item.icon && <item.icon size={19} className={cn("shrink-0", isOpen ? "text-white" : "text-slate-400")} />}
                        <span className="font-semibold ml-3 text-[14px] text-left whitespace-normal break-words flex-1 group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        
                        <div className="relative ml-auto flex size-5 items-center justify-center shrink-0 group-data-[collapsible=icon]:hidden">
                          <Plus
                            size={16}
                            className={cn(
                              "absolute transition-all duration-300 ease-in-out",
                              isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 text-slate-400"
                            )}
                          />
                          <Minus
                            size={16}
                            className={cn(
                              "absolute transition-all duration-300 ease-in-out",
                              isOpen ? "rotate-0 scale-100 opacity-100 text-white" : "-rotate-90 scale-0 opacity-0"
                            )}
                          />
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <ul className="ml-3 mt-2 border-l border-white/5 pl-2 gap-1 flex flex-col relative before:absolute before:left-[-1px] before:top-0 before:h-3 before:w-px before:bg-slate-900">
                        {item.items?.map((child) => (
                          <RecursiveMenuItem
                            key={child.id || child.title}
                            item={child}
                            currentPath={currentPath}
                          />
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    className={cn(
                        level1BaseClasses,
                        "items-start",
                        isDirectlyActive ? level1ActiveClasses : level1InactiveClasses
                    )}
                  >
                    <Link href={item.url} className="flex items-start w-full gap-3">
                      {item.icon && <item.icon size={19} className={cn("shrink-0", isDirectlyActive ? "mt-0.5" : "text-slate-400 mt-0.5")} />}
                      <span className="font-semibold text-[14px] text-left whitespace-normal break-words flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
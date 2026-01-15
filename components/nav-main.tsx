"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Minus, Plus, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

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
    title: string;
    url: string;
    icon: LucideIcon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const currentPath = usePathname();
  const [openParent, setOpenParent] = useState<string | null>(null);

  useEffect(() => {
    const activeParent = items.find(
      (item) =>
        item.items &&
        item.items.some((sub) => currentPath.startsWith(sub.url))
    )?.title;

    if (activeParent) setOpenParent(activeParent);

  }, [currentPath, items]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>MENUS</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
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
                    <SidebarMenuButton>
                      <item.icon className="mr-2" />
                      {item.title}

                      {isOpen ? (
                        <Minus className="ml-auto" size={16} />
                      ) : (
                        <Plus className="ml-auto" size={16} />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="mr-2" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                )}

                {hasChildren && (
                  <CollapsibleContent className="mt-1">
                    <SidebarMenuSub>
                      {item.items?.map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={currentPath === child.url}
                          >
                            <Link href={child.url}>{child.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
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

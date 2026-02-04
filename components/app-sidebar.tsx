"use client"
import Link from "next/link";
import Image from "next/image";
import logoImage from "@/public/assets/logo.png";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { Company, UserInfo } from "@/Constants";
import { NavMain } from "./nav-main";
import { NavUser } from "./sidenav-user"
import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";
import { getFilteredMenu } from "@/actions/menu";
import { BadgeDollarSign, Factory, LayoutDashboardIcon, Package, LucideIcon } from "lucide-react";

// Map for string icons to components
const ICON_MAP: Record<string, LucideIcon> = {
  "LayoutDashboardIcon": LayoutDashboardIcon,
  "BadgeDollarSign": BadgeDollarSign,
  "Package": Package,
  "Factory": Factory
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { accessToken } = useAuth();
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    async function loadMenu() {
      if (accessToken) {
        try {
          const filtered = await getFilteredMenu(accessToken);
          // Map icons back to components
          const mapped = filtered.map(item => ({
            ...item,
            icon: item.iconName ? ICON_MAP[item.iconName] : undefined
          }));
          setMenuItems(mapped);
        } catch (error) {
          console.error("Failed to load menu", error);
        }
      }
    }
    loadMenu();
  }, [accessToken]);

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props} className="bg-black">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-white/5 active:bg-white/10 transition-all py-10">
              <Link href="/dashboard" className="flex items-center gap-4">
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-white p-1.5 shrink-0 shadow-lg shadow-white/10">
                  <Image
                    src={logoImage}
                    alt="Logo"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col text-left leading-none">
                  <span className="font-bold text-white tracking-tight text-lg uppercase mb-1">Supernova</span>
                  <div className="h-[2px] w-8 bg-white/60 mb-1" />
                  <span className="text-[9px] text-slate-400 font-black tracking-widest uppercase opacity-80 leading-none">Solutions</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

"use client"
import Link from "next/link";
import Image from "next/image";
import logoImage from "@/public/assets/logo.png";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { Command } from "cmdk";
import { Company, MENUS, UserInfo } from "@/Constants";
import { NavMain } from "./nav-main";
import { NavUser } from "./sidenav-user"
import { NavProjects } from "./nav-projects";
import { NavSecondary } from "./nav-secondary";
import { useAuth } from "@/context/authContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

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
        <NavMain items={MENUS} />
        {/* <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

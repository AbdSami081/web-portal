"use client"
import Link from "next/link";
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
    <Sidebar collapsible="icon" variant="inset" {...props} className="bg-[#18181b]">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-white">{Company.name}</span>
                  <span className="truncate text-xs text-white">Enterprise</span>
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

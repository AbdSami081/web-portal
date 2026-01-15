import {
  Command
} from "lucide-react";
import * as React from "react";

import Link from "next/link"
import { NavMain } from "./nav-main";
import { NavUser } from "./sidenav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { Company, MENUS, UserInfo } from "../Constants";

// const data = {
//   user: {
//     name: "Kashif Younus",
//     email: "kashif@example.com",
//     avatar: "/avatars/shadcn.jpg",
//   },
//   navMain: [
//     {
//       title: "Sales",
//       url: "#",
//       icon: SquareTerminal,
//       isActive: true,
//       items: [
//         {
//           title: "Sales Quotation",
//           url: "/dashboard/sales/quotation",
//         },
//         {
//           title: "Sales Order",
//           url: "/dashboard/sales/order",
//         },
//         {
//           title: "Delivery",
//           url: "#",
//         },
//         {
//           title: "A/R Invoice",
//           url: "#",
//         },
//       ],
//     },
//     {
//       title: "Purchase",
//       url: "#",
//       icon: SquareTerminal,
//       isActive: true,
//       items: [
//         {
//           title: "Purchase Quotation",
//           url: "/dashboard/purchase/quotation",
//         },
//         {
//           title: "Purchase Order",
//           url: "/dashboard/purchase/order",
//         },
//       ],
//     },
//   ],
//   navSecondary: [
//     {
//       title: "Support",
//       url: "#",
//       icon: LifeBuoy,
//     },
//     {
//       title: "Feedback",
//       url: "#",
//       icon: Send,
//     },
//   ],
//   projects: [
//     {
//       name: "Design Engineering",
//       url: "#",
//       icon: Frame,
//     },
//     {
//       name: "Sales & Marketing",
//       url: "#",
//       icon: PieChart,
//     },
//     {
//       name: "Travel",
//       url: "#",
//       icon: Map,
//     },
//   ],
// };

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{Company.name}</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={MENUS} />
        {/* <NavProjects projects={data.projects} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser/>
      </SidebarFooter>
    </Sidebar>
  );
}

"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  ChevronUp,
  CreditCard,
  LogOut,
  Sparkles,
  User2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import { useAuth } from "@/context/authContext";

export function NavUser() {
  const { isMobile } = useSidebar();
  // const firstLetter = user.name.charAt(0);
  // const lastLetter = user.name.charAt(7);
  // const FL = `${firstLetter}${lastLetter}`;
  const { user, logout } = useAuth();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="w-full h-12 rounded-lg bg-white/5 hover:bg-white/10 transition-all flex items-center px-3"
            >
              <div className="size-8 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs shrink-0">
                {user?.userName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex flex-col text-left text-sm leading-tight ml-3 flex-1 overflow-hidden">
                <span className="truncate font-bold text-white">{user?.userName || "User"}</span>
                <span className="truncate text-[10px] text-slate-500 font-medium uppercase tracking-widest">Active</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-slate-500 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-48 rounded-lg shadow-xl bg-black border border-white/10 text-white p-1"
            side="right"
            align="end"
            sideOffset={10}
          >
            <DropdownMenuItem
              onClick={logout}
              className="focus:bg-white focus:text-black rounded-md cursor-pointer py-2 px-3 flex items-center gap-2 font-bold text-sm"
            >
              <LogOut className="size-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-sidebar">
                  {FL}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg shadow-2xl border-2"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{FL}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              <form action="/logout" method="post">
               <button type="submit"></button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

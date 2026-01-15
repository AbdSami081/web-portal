"use client"

import Link from "next/link";
import { NavUserToggle } from "./nav-user";
import {
  
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

const HeaderNav = () => {
  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-b-slate-200">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <Link href="/dashboard"> Home </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage> {" "} </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-3">
          <div className="flex items-center gap-2">
            {/* {/* <HeaderUserAction /> */}
            <NavUserToggle />
          </div>
        </div>
      </header>
    </>
  );
};

export default HeaderNav;

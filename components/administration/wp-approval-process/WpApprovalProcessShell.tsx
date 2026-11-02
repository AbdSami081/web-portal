"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { WP_APPROVAL_SHELL_SUBTITLE } from "@/lib/approval-process/page-copy";

const NAV_ITEMS = [
  {
    href: "/dashboard/wp-approval-process/templates",
    label: "Templates",
    match: "/templates",
  },
  {
    href: "/dashboard/wp-approval-process/stages",
    label: "Stages",
    match: "/stages",
  },
] as const;

export function WpApprovalProcessShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="border-b bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/25">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold uppercase text-slate-800">WP Approval Process</h1>
              </div>
              <p className="text-xs text-slate-500">{WP_APPROVAL_SHELL_SUBTITLE}</p>
            </div>
          </div>
          {actions}
        </div>

        <nav className="flex flex-wrap gap-1 px-6 pb-3">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname.includes(item.match) ||
              (item.match === "/templates" &&
                pathname.includes("/wp-approval-process/templates"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-violet-100 text-violet-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <GitBranch className="w-3 h-3 opacity-60" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50/80">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0">{children}</div>
    </div>
  );
}

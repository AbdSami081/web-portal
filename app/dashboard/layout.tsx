import Image from "next/image";
import { AppSidebar } from "@/components/app-sidebar";
import HeaderNav from "@/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RouteGuard } from "@/components/route-guard";
import { NotificationProvider } from "@/context/NotificationContext";
import { BranchSelectionModal } from "@/components/shared/BranchSelectionModal";
import logoImage from "@/public/assets/logo.png";

const DashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-0 overflow-hidden">
        <NotificationProvider>
          <HeaderNav />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <RouteGuard>
              {children}
            </RouteGuard>
          </div>
          <footer className="shrink-0 border-t border-zinc-200/60 bg-white px-4 py-1.5 text-[13px] font-medium tracking-wide text-zinc-400">
            <div className="flex items-center justify-end gap-1.5">
              <span>Powered by</span>
              <Image src={logoImage} alt="Logo" className="h-3 w-auto object-contain" />
            </div>
          </footer>
        </NotificationProvider>
      </SidebarInset>
      <BranchSelectionModal />
    </SidebarProvider>
  );
};

export default DashboardLayout;

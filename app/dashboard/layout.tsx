import { AppSidebar } from "@/components/app-sidebar";
import HeaderNav from "@/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RouteGuard } from "@/components/route-guard";
import { NotificationProvider } from "@/context/NotificationContext";

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
        </NotificationProvider>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;

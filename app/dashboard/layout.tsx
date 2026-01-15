import { AppSidebar } from "@/components/app-sidebar";
import HeaderNav from "@/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const DashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderNav />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-2 md:gap-6 md:py-2 px-4 ">
                    { children }
                </div>
              </div>
            </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;

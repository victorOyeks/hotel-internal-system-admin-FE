import { redirect } from "next/navigation";
import { type PropsWithChildren, use } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Header } from "@/components/shared/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Provider as JotaiProvider } from "jotai";
import type { HotelRole } from "@/lib/types";
import { getUser } from "@/lib/dal";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function DashboardLayout({ children }: PropsWithChildren) {
  const user = use(getUser());

  if (!user) {
    redirect("/auth");
  }

  return (
    <NuqsAdapter>
      <JotaiProvider>
        <SidebarProvider>
          <AppSidebar collapsible="icon" role={user.role as HotelRole} />
          <SidebarInset className="bg-background-blue">
            <Header user={user} />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </JotaiProvider>
    </NuqsAdapter>
  );
}

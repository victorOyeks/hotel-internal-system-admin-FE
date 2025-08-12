import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type PropsWithChildren, use } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Header } from "@/components/shared/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Provider as JotaiProvider } from "jotai";
import { tokenKey } from "@/lib/server-fns";

export default function DashboardLayout({ children }: PropsWithChildren) {
  const cookieStore = use(cookies());
  const tok = cookieStore.get(tokenKey);

  if (!tok) {
    redirect("/auth");
  }

  return (
    <JotaiProvider>
      <SidebarProvider>
        <AppSidebar collapsible="icon" />
        <SidebarInset className="bg-background-blue">
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </JotaiProvider>
  );
}

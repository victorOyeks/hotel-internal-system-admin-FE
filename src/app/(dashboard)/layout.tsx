import { redirect } from "next/navigation";
import { type PropsWithChildren, use } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Header } from "@/components/shared/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Provider as JotaiProvider } from "jotai";
import type { HotelRole } from "@/lib/types";
import { getManagerCurrentHotel, getUser, verifySession } from "@/lib/dal";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { throttle } from "nuqs/server";
import { NotificationListener } from "@/components/notification-listener";

export default function DashboardLayout({ children }: PropsWithChildren) {
  const user = use(getUser());
  const session = use(verifySession());

  if (!user) {
    redirect("/auth");
  }

  if (!user.changedPassword) {
    redirect("/reset-password");
  }

  const activeHotel = use(getManagerCurrentHotel());
  const hotelId = activeHotel?.id || user.hotels?.[0]?.id || "";

  return (
    <NuqsAdapter
      defaultOptions={{
        clearOnDefault: true,
        limitUrlUpdates: throttle(500),
        shallow: false,
      }}
    >
      <JotaiProvider>
        <SidebarProvider>
          <AppSidebar
            collapsible="icon"
            role={user.role as HotelRole}
            hotels={user.hotels}
            activeHotel={activeHotel ?? undefined}
          />
          <SidebarInset className="bg-background-blue">
            <Header user={user} />
            {children}
          </SidebarInset>
        </SidebarProvider>
        <NotificationListener
          token={session.token}
          userId={user.id}
          role={user.role}
          hotelId={hotelId}
        />
      </JotaiProvider>
    </NuqsAdapter>
  );
}

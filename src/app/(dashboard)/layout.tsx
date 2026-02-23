import { redirect } from "next/navigation";
import { type PropsWithChildren, use } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Header } from "@/components/shared/header";
import { ChatGlobalProvider } from "@/components/shared/chat-notifications";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Provider as JotaiProvider } from "jotai";
import { getActiveRole, getManagerCurrentHotel, getOwnerCurrentHotel, getUser } from "@/lib/dal";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { throttle } from "nuqs/server";
import type { HotelRole } from "@/lib/types";

export default function DashboardLayout({ children }: PropsWithChildren) {
	const user = use(getUser());
	if (!user) {
		redirect("/auth");
	}

	if (!user.changedPassword) {
		redirect("/reset-password");
	}

	const managerHotel = use(getManagerCurrentHotel());
	const ownerHotel = use(getOwnerCurrentHotel());
	const activeRole = use(getActiveRole());
	const activeHotel = activeRole === "HOTEL_OWNER" ? ownerHotel : managerHotel;
	const hotelId = activeHotel?.id ?? user.hotels[0]?.id;
	return (
		<NuqsAdapter
			defaultOptions={{
				clearOnDefault: true,
				limitUrlUpdates: throttle(500),
				shallow: false,
			}}
		>
			<JotaiProvider>
				{hotelId && <ChatGlobalProvider hotelId={hotelId} />}
				<SidebarProvider>
					<AppSidebar
						collapsible="icon"
						role={activeRole as HotelRole}
						hotels={user.hotels}
						activeHotel={activeHotel ?? undefined}
						availableRoles={user.roles}
					/>
					<SidebarInset className="bg-background-blue">
						<Header user={user} />
						{children}
					</SidebarInset>
				</SidebarProvider>
			</JotaiProvider>
		</NuqsAdapter>
	);
}

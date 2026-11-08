import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Provider as JotaiProvider } from "jotai";
import { AppSidebar } from "@hospio/ui/shared/app-sidebar";
import { Header } from "@hospio/ui/shared/header";
import { SidebarInset, SidebarProvider } from "@hospio/ui/primitives/sidebar";
import { APP } from "@hospio/api/app";
import { data } from "@hospio/api/data";
import {
	getActiveHotel,
	getActiveRole,
	getBusiness,
	getHotels,
	getUser,
} from "@hospio/api/dal";

export async function DashboardShell({ children }: PropsWithChildren) {
	const [user, role, hotels, activeHotel] = await Promise.all([
		getUser(),
		getActiveRole(),
		getHotels(),
		getActiveHotel(),
	]);
	if (!user) redirect("/auth");
	if (!user.changedPassword) redirect("/reset-password");
	if (!role) redirect("/select-role");
	if (APP === "hotel" && role === "OWNER") {
		// A self-serve owner still in the wizard goes back to it; one handed over by H.M.S reviews the
		// handover first. getBusiness answers from the fixture (LIVE) in demo mode, so nothing changes there.
		const business = await getBusiness();
		if (business?.stage === "ONBOARDING" && business.source === "SELF_SERVE")
			redirect("/onboarding");
		if (business?.stage === "HANDED_OVER") redirect("/handover");
	}

	const unread = await data.notifications.unreadCount().catch(() => 0);

	return (
		<NuqsAdapter>
			<JotaiProvider>
				<SidebarProvider>
					<AppSidebar
						collapsible="icon"
						role={role}
						hotels={hotels}
						activeHotel={activeHotel}
					/>
					<SidebarInset className="bg-page">
						<Header
							user={user}
							role={role}
							hotelCount={hotels.length}
							unread={unread}
						/>
						<div className="flex flex-1 flex-col gap-5 px-8 py-6">
							{children}
						</div>
					</SidebarInset>
				</SidebarProvider>
			</JotaiProvider>
		</NuqsAdapter>
	);
}

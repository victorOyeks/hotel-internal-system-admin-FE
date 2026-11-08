import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Provider as JotaiProvider } from "jotai";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Header } from "@/components/shared/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { data } from "@/lib/data";
import { getActiveHotel, getActiveRole, getHotels, getUser } from "@/lib/dal";

export default async function DashboardLayout({ children }: PropsWithChildren) {
	const [user, role, hotels, activeHotel] = await Promise.all([getUser(), getActiveRole(), getHotels(), getActiveHotel()]);
	if (!user) redirect("/auth");
	if (!user.changedPassword) redirect("/reset-password");
	if (!role) redirect("/select-role");

	const unread = await data.notifications.unreadCount().catch(() => 0);

	return (
		<NuqsAdapter>
			<JotaiProvider>
				<SidebarProvider>
					<AppSidebar collapsible="icon" role={role} hotels={hotels} activeHotel={activeHotel} />
					<SidebarInset className="bg-page">
						<Header user={user} role={role} hotelCount={hotels.length} unread={unread} />
						<div className="flex flex-1 flex-col gap-5 px-8 py-6">{children}</div>
					</SidebarInset>
				</SidebarProvider>
			</JotaiProvider>
		</NuqsAdapter>
	);
}

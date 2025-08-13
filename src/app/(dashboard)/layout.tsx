import { redirect } from "next/navigation";
import { type PropsWithChildren, use } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Header } from "@/components/shared/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Provider as JotaiProvider } from "jotai";
import { getUser } from "@/lib/server-fns";
import type { HotelRole } from "@/lib/types";

export default function DashboardLayout({ children }: PropsWithChildren) {
	const user = use(getUser());

	if (!user) {
		redirect("/auth");
	}

	return (
		<JotaiProvider>
			<SidebarProvider>
				<AppSidebar collapsible="icon" role={user.data.role as HotelRole} />
				<SidebarInset className="bg-background-blue">
					<Header />
					{children}
				</SidebarInset>
			</SidebarProvider>
		</JotaiProvider>
	);
}

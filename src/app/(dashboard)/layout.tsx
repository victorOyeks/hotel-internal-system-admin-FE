import type { PropsWithChildren } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Header } from "@/components/shared/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: PropsWithChildren) {
	return (
		<SidebarProvider>
			<AppSidebar collapsible="icon" />
			<SidebarInset className="bg-background-blue">
				<Header />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}

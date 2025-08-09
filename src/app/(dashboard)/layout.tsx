import { AppSidebar } from "@/components/shared/app-sidebar";
import { Header } from "@/components/shared/header";
import {
    SidebarInset,
    SidebarProvider
} from "@/components/ui/sidebar";
import type { AppLayoutProps } from "@/lib/types";

export default function DashboardLayout({ children }: AppLayoutProps) {
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

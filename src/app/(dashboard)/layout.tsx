import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type PropsWithChildren, use } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Header } from "@/components/shared/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: PropsWithChildren) {
	const cookieStore = use(cookies());
	const tok = cookieStore.get("hms.jwt.session_token");

	if (!tok) {
		redirect("/auth");
	}

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

import type { PropsWithChildren } from "react";
import { DashboardShell } from "@hospio/ui/screens/dashboard-shell";

export default function DashboardLayout({ children }: PropsWithChildren) {
	return <DashboardShell>{children}</DashboardShell>;
}

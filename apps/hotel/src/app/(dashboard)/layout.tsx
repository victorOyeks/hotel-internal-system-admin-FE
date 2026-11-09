import type { PropsWithChildren } from "react";
import { DashboardShell } from "@hospio/ui/screens/dashboard-shell";
import { DeliveryNotice } from "@hospio/ui/shared/delivery-notice";

export default function DashboardLayout({ children }: PropsWithChildren) {
	return (
		<>
			<DashboardShell>{children}</DashboardShell>
			<DeliveryNotice />
		</>
	);
}

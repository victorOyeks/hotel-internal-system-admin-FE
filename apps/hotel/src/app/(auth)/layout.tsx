import type { PropsWithChildren } from "react";
import { AuthShell } from "@hospio/ui/screens/auth-shell";
import { DeliveryNotice } from "@hospio/ui/shared/delivery-notice";

export default function AuthLayout({ children }: PropsWithChildren) {
	return (
		<>
			<AuthShell>{children}</AuthShell>
			<DeliveryNotice />
		</>
	);
}

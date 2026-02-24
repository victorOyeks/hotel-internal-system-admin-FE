import { RentalsAutoRefresh } from "@/components/roles/rentals/rentals-auto-refresh";
import type { ReactNode } from "react";

type RentalsLayoutProps = {
	children: ReactNode;
};

export default function RentalsLayout({ children }: RentalsLayoutProps) {
	return (
		<>
			<RentalsAutoRefresh intervalMs={60_000} />
			{children}
		</>
	);
}


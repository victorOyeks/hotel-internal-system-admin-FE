import { RentalReportsPage } from "@/components/roles/rentals/rental-reports";

const breadcrumbs = {
	title: "Reports",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Reports", href: "/dashboard/reports" },
	],
};

export default function RentalReportsPageRoute() {
	return <RentalReportsPage breadcrumbs={breadcrumbs} />;
}

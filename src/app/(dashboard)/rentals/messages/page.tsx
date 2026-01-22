import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

const breadcrumbs = {
	title: "Messages",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Messages", href: "/dashboard/messages" },
	],
};

export default function RentalsMessagesPage() {
	const cookieData = use(getCookieData())!;

	return (
		<div className="flex flex-col gap-4 p-4">
			<h1 className="text-2xl font-bold">Messages</h1>
			<p className="text-muted-foreground">Messaging feature coming soon...</p>
		</div>
	);
}

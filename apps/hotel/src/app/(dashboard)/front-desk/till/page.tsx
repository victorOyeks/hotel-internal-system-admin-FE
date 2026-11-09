import { redirect } from "next/navigation";
import { TillScreen } from "@/components/roles/front-office/till";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";

export const dynamic = "force-dynamic";

/**
 * Front office · Till. The desk only reads its own till (`/tills/mine`) and that till's entries; the
 * demo also lists the closed tills of the day. The default float comes from Hotel setup → Money.
 */
export default async function FrontDeskTillPage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const isDemo = !live("finance");
	const [till, payments, staff, settings] = await Promise.all([
		data.finance.myTill(),
		data.payments.list(),
		data.staff.list(),
		data.hotels.limits(),
	]);
	const [entries, tills] = await Promise.all([
		till && !isDemo ? data.finance.tillEntries(till.id) : Promise.resolve([]),
		isDemo ? data.finance.tills() : Promise.resolve([]),
	]);
	const past = tills.filter(
		(t) => t.role === "FRONT_OFFICE" && t.status === "CLOSED",
	);
	return (
		<TillScreen
			till={till}
			entries={entries}
			pastTills={past}
			payments={payments}
			staff={staff}
			me={user.fullName}
			defaultFloat={settings.tillFloat}
			demo={isDemo}
		/>
	);
}

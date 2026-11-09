import { redirect } from "next/navigation";
import { TillScreen } from "@/components/roles/front-office/till";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";

export const dynamic = "force-dynamic";

/**
 * Front office · Till. The desk reads its own till (`/tills/mine`), that till's entries and its role's
 * tills closed in the last 7 days. The default float comes from Hotel setup → Money.
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
	const [entries, past] = await Promise.all([
		till && !isDemo ? data.finance.tillEntries(till.id) : Promise.resolve([]),
		data.finance.myClosedTills(),
	]);
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

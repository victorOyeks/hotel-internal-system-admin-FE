import { redirect } from "next/navigation";
import { TillScreen } from "@/components/roles/front-office/till";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";

/**
 * The till of a staff desk: the front desk's till screen for the kitchen or the bar. The desk reads its own
 * till (`/tills/mine`), that till's entries and its role's tills closed in the last 7 days; the default float
 * comes from Hotel setup → Money. Cash taken for this role's orders lands in this till.
 */
export async function DeskTill({ desk }: { desk: "KITCHEN" | "BAR" }) {
	const user = await getUser();
	if (!user) redirect("/auth");
	const isDemo = !live("finance");
	const [till, payments, staff, settings] = await Promise.all([
		data.finance.myTill(desk),
		data.payments.list(),
		data.staff.list(),
		data.hotels.limits(),
	]);
	const [entries, past] = await Promise.all([
		till && !isDemo ? data.finance.tillEntries(till.id) : Promise.resolve([]),
		data.finance.myClosedTills(desk),
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
			role={desk}
		/>
	);
}

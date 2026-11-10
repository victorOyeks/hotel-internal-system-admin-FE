import { redirect } from "next/navigation";
import { OwnerDashboard } from "@/components/roles/owner/dashboard";
import { getActiveHotel, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";
import { lagosDay } from "@hospio/api/data/mappers/finance";

export const dynamic = "force-dynamic";

/** Hotel Owner · 01 Dashboard. Hotels, money, approvals and the 30-day series come through the data seam. */
export default async function OwnerHomePage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const [
		hotels,
		approvals,
		activity,
		daily,
		business,
		settings,
		active,
		outletSales,
	] = await Promise.all([
		data.owner.hotels(),
		data.owner.approvals(),
		data.owner.activity(),
		data.finance.series(lagosDay(-29), lagosDay(0)),
		data.business.mine(),
		data.hotels.limits(),
		getActiveHotel(),
		data.outlets.managementSales(),
	]);
	const worth = await data.hotels.worth(hotels, approvals);
	return (
		<OwnerDashboard
			user={user}
			businessName={business?.name ?? "Your business"}
			hotels={hotels}
			approvals={approvals}
			activity={activity}
			daily={daily}
			dailyScope={live("finance") && active ? active.name : "All branches"}
			worth={worth}
			limit={settings.limits.managerExpenseLimit}
			outletSales={outletSales}
		/>
	);
}

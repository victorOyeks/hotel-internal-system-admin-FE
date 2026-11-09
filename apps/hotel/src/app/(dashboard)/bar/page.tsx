import { redirect } from "next/navigation";
import { BarTodayScreen } from "@/components/roles/bar/today";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Bar · today: the bar outlet's open board, today's closed sales, menu, happy hours, stock, sales summary and the bar's till. */
export default async function BarHome({
	searchParams,
}: {
	searchParams: Promise<{ order?: string }>;
}) {
	const { order } = await searchParams;
	// A notification link (/dashboard?order=…) lands on the tab.
	if (order) redirect(`/dashboard/tabs?open=${encodeURIComponent(order)}`);
	const outlet = await data.outlets.forRole("BAR");
	const [
		orders,
		closed,
		menu,
		categories,
		happyHours,
		buckets,
		items,
		settings,
		terminals,
		sales,
		till,
	] = await Promise.all([
		outlet ? data.outlets.orders(outlet.id) : Promise.resolve([]),
		outlet
			? data.outlets.orders(outlet.id, { status: "CLOSED" })
			: Promise.resolve([]),
		outlet ? data.outlets.menu(outlet.id) : Promise.resolve([]),
		outlet ? data.outlets.categories(outlet.id) : Promise.resolve([]),
		outlet ? data.outlets.happyHours(outlet.id) : Promise.resolve([]),
		data.bookings.buckets(),
		data.inventory.items(),
		data.outlets.settings(),
		data.payments.terminals(),
		outlet ? data.outlets.sales(undefined, outlet.id) : Promise.resolve(null),
		data.finance.myTill("BAR"),
	]);
	return (
		<BarTodayScreen
			outlet={outlet}
			orders={orders}
			closed={closed}
			menu={menu}
			categories={categories}
			happyHours={happyHours}
			inHouse={buckets.inHouse}
			stock={items.filter((i) => i.storeId === outlet?.storeId)}
			settings={settings}
			terminals={terminals}
			sales={sales}
			till={till}
		/>
	);
}

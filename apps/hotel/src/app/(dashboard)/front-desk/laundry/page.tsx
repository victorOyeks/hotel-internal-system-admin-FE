import { LaundryJobsScreen } from "@/components/roles/laundry/jobs";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Front desk · Guest laundry: take an order for an in-house guest, charge it to the room or take payment. */
export default async function FrontDeskLaundryPage() {
	const [orders, prices, buckets, terminals] = await Promise.all([
		data.laundry.orders("all"),
		data.laundry.prices(),
		data.bookings.buckets(),
		data.payments.terminals(),
	]);
	return (
		<LaundryJobsScreen
			orders={orders}
			prices={prices}
			inHouse={buckets.inHouse}
			terminals={terminals}
			desk="FRONT_OFFICE"
		/>
	);
}

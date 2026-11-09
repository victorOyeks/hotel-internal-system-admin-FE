import { LaundryJobsScreen } from "@/components/roles/laundry/jobs";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Laundry · Jobs: guest laundry orders. */
export default async function LaundryHome() {
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
			desk="LAUNDRY"
		/>
	);
}

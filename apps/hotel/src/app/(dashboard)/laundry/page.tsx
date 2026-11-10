import { LaundryJobsScreen } from "@/components/roles/laundry/jobs";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Laundry · Jobs: guest laundry orders. */
export default async function LaundryHome({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const query = listQueryFrom(await searchParams);
	const [orders, all, prices, buckets, terminals] = await Promise.all([
		data.laundry.boardOrders(),
		data.laundry.ordersPage({ q: query.q, page: query.page }),
		data.laundry.prices(),
		data.bookings.buckets(),
		data.payments.terminals(),
	]);
	return (
		<LaundryJobsScreen
			orders={orders}
			all={all}
			prices={prices}
			inHouse={buckets.inHouse}
			terminals={terminals}
			desk="LAUNDRY"
		/>
	);
}

import { LaundryJobsScreen } from "@/components/roles/laundry/jobs";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function LaundryHome() {
	const [orders, buckets, terminals] = await Promise.all([data.laundry.orders(), data.bookings.buckets(), data.payments.terminals()]);
	return <LaundryJobsScreen orders={orders} inHouse={buckets.inHouse} terminals={terminals} />;
}

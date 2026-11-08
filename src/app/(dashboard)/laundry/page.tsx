import { LaundryJobsScreen } from "@/components/roles/laundry/jobs";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LaundryHome() {
	const [orders, buckets] = await Promise.all([data.laundry.orders(), data.bookings.buckets()]);
	return <LaundryJobsScreen orders={orders} inHouse={buckets.inHouse} />;
}

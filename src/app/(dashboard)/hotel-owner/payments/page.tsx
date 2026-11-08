import { OwnerPayments } from "@/components/roles/owner/payments";
import { data } from "@/lib/data";
import { ownerHotels } from "@/lib/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 17 Payments & payouts. */
export default async function Page() {
	const payments = await data.payments.list();
	return <OwnerPayments payments={payments} hotels={ownerHotels} />;
}

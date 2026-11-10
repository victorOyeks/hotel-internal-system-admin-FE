import { OwnerPayments } from "@/components/roles/owner/payments";
import { data } from "@hospio/api/data";
import { lagosDate } from "@hospio/api/data/mappers/finance";

export const dynamic = "force-dynamic";

/** Hotel Owner · 17 Payments & payouts: every hotel's payments and the business's settlements this month. */
export default async function Page() {
	const today = lagosDate();
	const [payments, settlements, hotels] = await Promise.all([
		data.owner.payments(),
		data.owner.settlements(`${today.slice(0, 8)}01`, today),
		data.owner.hotelList(),
	]);
	return (
		<OwnerPayments
			payments={payments}
			settlements={settlements}
			hotels={hotels.map((h) => ({ hotelId: h.id, name: h.name }))}
			month={today.slice(0, 7)}
		/>
	);
}

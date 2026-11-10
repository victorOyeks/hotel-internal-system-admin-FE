import { OwnerPayments } from "@/components/roles/owner/payments";
import { data } from "@hospio/api/data";
import { lagosDate } from "@hospio/api/data/mappers/finance";
import {
	listQueryFrom,
	type SearchParamsRecord,
	urlParam,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/**
 * Hotel Owner · 17 Payments & payouts: every hotel's payments one page at a time from payment-service across the
 * business (`?hotel=` narrows; method, status, search and page in the URL; the cards are this month's over the whole
 * range) and the business's settlements this month.
 */
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const today = lagosDate();
	const query = listQueryFrom(sp, ["method"]);
	const [payments, settlements, hotels] = await Promise.all([
		data.owner.payments({ ...query, hotelId: urlParam(sp, "hotel") }),
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

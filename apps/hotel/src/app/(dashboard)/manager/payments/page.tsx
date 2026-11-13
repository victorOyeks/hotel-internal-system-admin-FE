import { PaymentsScreen } from "@/components/roles/manager/payments/payments-screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
	urlParam,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/**
 * Manager · Payments: all payments (paged by payment-service, filters in the URL), POS terminals, refunds and disputes
 * (each paged, `?refundsPage=` / `?disputesPage=`), record payment.
 */
export default async function PaymentsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const open = urlParam(sp, "open");
	const [hotel, payments, terminals, refunds, disputes, opened] =
		await Promise.all([
			getActiveHotel(),
			data.payments.page(listQueryFrom(sp, ["method"])),
			data.payments.terminals(),
			data.payments.refunds(listQueryFrom(sp, [], "refunds")),
			data.payments.disputes(listQueryFrom(sp, [], "disputes")),
			open ? data.payments.get(open) : Promise.resolve(null),
		]);
	return (
		<PaymentsScreen
			hotelName={hotel?.name ?? "This hotel"}
			payments={payments}
			terminals={terminals}
			refunds={refunds}
			disputes={disputes}
			opened={opened}
		/>
	);
}

import { PaymentsScreen } from "@/components/roles/manager/payments/payments-screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Payments: all payments, POS terminals, refunds, disputes, record payment. */
export default async function PaymentsPage() {
	const [hotel, payments, terminals, refunds, disputes, folios] = await Promise.all([
		getActiveHotel(),
		data.payments.list(),
		data.payments.terminals(),
		data.payments.refunds(),
		data.payments.disputes(),
		data.folios.list(),
	]);
	return <PaymentsScreen hotelName={hotel?.name ?? "This hotel"} payments={payments} terminals={terminals} refunds={refunds} disputes={disputes} folios={folios.filter((f) => f.balance > 0)} />;
}

import { redirect } from "next/navigation";
import {
	MyPaymentsScreen,
	PAYMENT_TABS,
	type PaymentTab,
} from "@/components/roles/front-office/payments";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
	urlParam,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Front office · Payments: the desk's payments, one page at a time from payment-service (tab, search and page in the URL). */
export default async function FrontDeskPaymentsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const user = await getUser();
	if (!user) redirect("/auth");
	const sp = await searchParams;
	const tab = urlParam(sp, "tab");
	const active = (tab && tab in PAYMENT_TABS ? tab : "today") as PaymentTab;
	const open = urlParam(sp, "open");
	const { q, page, sort } = listQueryFrom(sp);
	const [payments, folios, terminals, opened] = await Promise.all([
		data.payments.page({
			...PAYMENT_TABS[active],
			role: "FRONT_OFFICE",
			q,
			page,
			sort,
		}),
		data.folios.list(),
		data.payments.terminals(),
		open ? data.payments.get(open) : Promise.resolve(null),
	]);
	return (
		<MyPaymentsScreen
			payments={payments}
			opened={opened}
			folios={folios}
			terminals={terminals}
			me={user.fullName}
			roleFilter="FRONT_OFFICE"
		/>
	);
}

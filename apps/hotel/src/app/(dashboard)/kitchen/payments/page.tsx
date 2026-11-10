import { MyPaymentsPage } from "@/components/roles/shared-staff/my-payments-page";
import type { SearchParamsRecord } from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Kitchen · My payments: the desk's payments, paged by payment-service. */
export default function KitchenPaymentsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	return (
		<MyPaymentsPage
			searchParams={searchParams}
			desk="KITCHEN"
			roleTitle="Kitchen"
		/>
	);
}

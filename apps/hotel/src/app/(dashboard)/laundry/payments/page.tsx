import { MyPaymentsPage } from "@/components/roles/shared-staff/my-payments-page";
import type { SearchParamsRecord } from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Laundry · My payments: the desk's payments, paged by payment-service. */
export default function LaundryPaymentsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	return (
		<MyPaymentsPage
			searchParams={searchParams}
			desk="LAUNDRY"
			roleTitle="Laundry"
		/>
	);
}

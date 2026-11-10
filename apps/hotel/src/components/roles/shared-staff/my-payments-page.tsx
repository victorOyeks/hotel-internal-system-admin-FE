import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
	urlParam,
} from "@hospio/api/data/paging";
import { MyPaymentsScreen } from "./my-payments";

/** "To verify": what the POS or Finance has not settled yet. */
export const TO_VERIFY = "PENDING,PROCESSING,NO_RESPONSE";

/**
 * The bar's, kitchen's or laundry's My payments, one page at a time from payment-service: the desk's payments (staff see
 * what they took), `?tab=pending` for those to verify, `?page=` in the URL; the cards are today's money from the service.
 */
export async function MyPaymentsPage({
	searchParams,
	desk,
	roleTitle,
}: {
	searchParams: Promise<SearchParamsRecord>;
	desk: "BAR" | "KITCHEN" | "LAUNDRY";
	roleTitle: string;
}) {
	const sp = await searchParams;
	const { page, q } = listQueryFrom(sp);
	const pending = urlParam(sp, "tab") === "pending";
	const payments = await data.payments.page({
		role: desk,
		page,
		q,
		status: pending ? TO_VERIFY : undefined,
	});
	return <MyPaymentsScreen payments={payments} roleTitle={roleTitle} />;
}

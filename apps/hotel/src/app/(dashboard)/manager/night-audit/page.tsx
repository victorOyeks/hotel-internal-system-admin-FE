import { NightAuditScreen } from "@/components/roles/manager/night-audit/screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	type SearchParamsRecord,
	urlPage,
	urlParam,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Manager · Night audit: tonight's checklist from the service, close the day, reports and past audits. */
export default async function NightAuditPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	// ?date=YYYY-MM-DD opens an earlier business day that was never closed; ?page= pages the past audits.
	const sp = await searchParams;
	const date = urlParam(sp, "date");
	const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
	const [hotel, audits, today, business] = await Promise.all([
		getActiveHotel(),
		data.finance.nightAudits(day, { page: urlPage(sp) }),
		data.finance.today(day),
		data.business.mine(),
	]);
	return (
		<NightAuditScreen
			hotelName={hotel?.name ?? "This hotel"}
			audits={audits.rows}
			past={audits.past}
			pastError={audits.ok ? undefined : audits.error}
			today={today}
			ownerName={business?.ownerName ?? "the owner"}
		/>
	);
}

import { NightAuditScreen } from "@/components/roles/finance/night-audit";
import { getActiveHotel, getActiveRole } from "@hospio/api/dal";
import { data, roleScreens } from "@hospio/api/data";
import {
	type SearchParamsRecord,
	urlPage,
	urlParam,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

export default async function FinanceNightAuditPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	// ?date=YYYY-MM-DD opens an earlier business day that was never closed; ?page= pages the past audits.
	const sp = await searchParams;
	const date = urlParam(sp, "date");
	const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
	const [hotel, audits, today, business, role] = await Promise.all([
		getActiveHotel(),
		data.finance.nightAudits(day, { page: urlPage(sp) }),
		data.finance.today(day),
		data.business.mine(),
		getActiveRole(),
	]);
	return (
		<NightAuditScreen
			audits={audits.rows}
			past={audits.past}
			pastError={audits.ok ? undefined : audits.error}
			today={today}
			ownerName={business?.ownerName ?? "the owner"}
			hotelName={hotel?.name ?? "Hotel"}
			screens={roleScreens(role)}
		/>
	);
}

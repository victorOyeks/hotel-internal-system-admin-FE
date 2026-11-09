import { NightAuditScreen } from "@/components/roles/manager/night-audit/screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Night audit: tonight's checklist from the service, close the day, reports and past audits. */
export default async function NightAuditPage() {
	const [hotel, audits, today, business] = await Promise.all([
		getActiveHotel(),
		data.finance.nightAudits(),
		data.finance.today(),
		data.business.mine(),
	]);
	return (
		<NightAuditScreen
			hotelName={hotel?.name ?? "This hotel"}
			audits={audits}
			today={today}
			ownerName={business?.ownerName ?? "the owner"}
		/>
	);
}

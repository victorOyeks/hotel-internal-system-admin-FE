import { NightAuditScreen } from "@/components/roles/finance/night-audit";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FinanceNightAuditPage() {
	const [hotel, audits, today, business] = await Promise.all([
		getActiveHotel(),
		data.finance.nightAudits(),
		data.finance.today(),
		data.business.mine(),
	]);
	return (
		<NightAuditScreen
			audits={audits}
			today={today}
			ownerName={business?.ownerName ?? "the owner"}
			hotelName={hotel?.name ?? "Hotel"}
		/>
	);
}

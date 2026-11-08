import { NightAuditScreen } from "@/components/roles/finance/night-audit";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FinanceNightAuditPage() {
	const [hotel, audits] = await Promise.all([getActiveHotel(), data.finance.nightAudits()]);
	return <NightAuditScreen audits={audits} hotelName={hotel?.name ?? "Hotel"} />;
}

import { NightAuditScreen } from "@/components/roles/finance/night-audit";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FinanceNightAuditPage({
	searchParams,
}: {
	searchParams: Promise<{ date?: string }>;
}) {
	// ?date=YYYY-MM-DD opens an earlier business day that was never closed.
	const { date } = await searchParams;
	const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
	const [hotel, audits, today, business] = await Promise.all([
		getActiveHotel(),
		data.finance.nightAudits(day),
		data.finance.today(day),
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

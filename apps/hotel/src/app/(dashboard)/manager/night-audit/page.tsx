import { NightAuditScreen } from "@/components/roles/manager/night-audit/screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Night audit: tonight's checklist, close the day, reports and past audits. */
export default async function NightAuditPage() {
	const [hotel, audits, buckets, tills, today] = await Promise.all([getActiveHotel(), data.finance.nightAudits(), data.bookings.buckets(), data.finance.tills(), data.finance.today()]);
	return <NightAuditScreen hotelName={hotel?.name ?? "This hotel"} audits={audits} departures={buckets.departures} arrivals={buckets.arrivals} tills={tills} today={today} />;
}

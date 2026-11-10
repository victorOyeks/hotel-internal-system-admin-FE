import { FoliosScreen } from "@/components/roles/manager/folios/folios-screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Folios: open folios, guest folio, post charge, discount/void, split, transfer, print/email. */
export default async function FoliosPage() {
	const [hotel, folios, bookings] = await Promise.all([
		getActiveHotel(),
		data.folios.list(),
		data.bookings.list({ status: "CHECKED_IN" }),
	]);
	return (
		<FoliosScreen
			hotelName={hotel?.name ?? "This hotel"}
			folios={folios}
			inHouse={bookings}
		/>
	);
}

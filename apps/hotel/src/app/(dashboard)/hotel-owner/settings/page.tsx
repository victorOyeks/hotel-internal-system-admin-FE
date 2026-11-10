import { OwnerSettings } from "@/components/roles/owner/settings";
import { loadSetup } from "@/app/(dashboard)/manager/hotel-setup/load";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 10 Company (tenant), taxes & currency and approval limits (hotel-config, active hotel), transfer ownership (a request to H.M.S support). */
export default async function Page() {
	const [business, hotel, sections, transfer] = await Promise.all([
		data.business.mine(),
		getActiveHotel(),
		loadSetup(),
		data.owner.transfer(),
	]);
	return (
		<OwnerSettings
			business={business}
			hotelName={hotel?.name ?? "This hotel"}
			hotelId={hotel?.id}
			taxes={sections.find((s) => s.key === "taxes")}
			approvals={sections.find((s) => s.key === "approvals")}
			transfer={transfer}
		/>
	);
}

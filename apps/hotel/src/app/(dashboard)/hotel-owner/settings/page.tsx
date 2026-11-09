import { OwnerSettings } from "@/components/roles/owner/settings";
import { loadSetup } from "@/app/(dashboard)/manager/hotel-setup/load";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 10 Company (tenant), taxes & currency and approval limits (hotel-config, active hotel), transfer ownership. */
export default async function Page() {
	const [business, hotel, sections] = await Promise.all([
		data.business.mine(),
		getActiveHotel(),
		loadSetup(),
	]);
	return (
		<OwnerSettings
			business={business}
			hotelName={hotel?.name ?? "This hotel"}
			hotelId={hotel?.id}
			taxes={sections.find((s) => s.key === "taxes")}
			approvals={sections.find((s) => s.key === "approvals")}
		/>
	);
}

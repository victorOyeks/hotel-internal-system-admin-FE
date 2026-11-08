import { OwnerStaffScreen } from "@/components/roles/owner/staff";
import { data } from "@hospio/api/data";
import { ownerHotels } from "@hospio/api/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 05 Staff, every hotel. */
export default async function Page() {
	const staff = await data.staff.list();
	const rows = staff
		.filter((s) => s.role !== "OWNER")
		.map((s, i) => {
			const h = ownerHotels[i % 6 === 4 ? 1 : i % 8 === 6 ? 2 : 0];
			return { ...s, hotelId: h.hotelId, hotelName: h.name };
		});
	const managers = ownerHotels.slice(1).map((h, i) => ({
		id: `u-gm-${i}`, fullName: h.manager, email: `${h.manager.split(" ")[0].toLowerCase()}@simpashotels.com`, phone: `+234 801 000 010${i + 2}`, role: "MANAGER", level: "FULL" as const, department: "Management", jobTitle: "General manager", status: "ACTIVE" as const, shift: "Morning", startedOn: "2024-05-01", lastSignIn: h.lastAt, hotelId: h.hotelId, hotelName: h.name,
	}));
	return <OwnerStaffScreen staff={[...managers, ...rows]} hotels={ownerHotels} />;
}

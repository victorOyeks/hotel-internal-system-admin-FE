import { OwnerOperations } from "@/components/roles/owner/operations";
import { data } from "@hospio/api/data";
import { ownerHotels } from "@hospio/api/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 12 Operations + 16 Changes by H.M.S. */
export default async function Page() {
	const [departments, activity, changes] = await Promise.all([data.departments.live(), data.activity.list(), data.platform.changes()]);
	return <OwnerOperations hotels={ownerHotels} departments={departments} activity={activity} changes={changes.filter((c) => c.businessName === "Royal Suites Ltd" || c.businessName === "Eko Garden Hotels").map((c) => ({ ...c, businessName: "Royal Suites Ltd" }))} />;
}

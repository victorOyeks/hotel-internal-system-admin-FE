import { HandoverReview } from "@/components/onboarding/handover";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** K3 · an owner onboarded by H.M.S reviews the hotels, logins and setup, then accepts (stage → LIVE). */
export default async function HandoverPage() {
	const [user, business, hotels, users, setup] = await Promise.all([
		getUser(),
		data.business.mine(),
		data.hotels.list(),
		data.users.list(),
		data.hotels.setup().catch(() => []),
	]);
	return (
		<HandoverReview
			business={business}
			hotels={hotels}
			users={users}
			firstName={(user?.fullName ?? "").split(" ")[0] || "there"}
			setupCount={setup.length}
		/>
	);
}

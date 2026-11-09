import { FeesScreen } from "@/components/roles/admin/fees";
import {
	pageParam,
	param,
	type SearchParams,
	thisMonth,
} from "@/components/roles/admin/params";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function FeesPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const sp = await searchParams;
	const [role, statements, open, monthly, businesses] = await Promise.all([
		getActiveRole(),
		adminData.fees.statements({
			status: param(sp, "status"),
			month: param(sp, "month"),
			businessId: param(sp, "businessId"),
			page: pageParam(sp),
			size: 25,
		}),
		adminData.fees.open(),
		adminData.fees
			.statements({ month: thisMonth(), size: 200 })
			.then((p) => p.content),
		data.platform.businesses(),
	]);
	return (
		<FeesScreen
			role={adminRole(role)}
			statements={statements}
			open={open}
			monthly={monthly}
			businesses={businesses}
		/>
	);
}

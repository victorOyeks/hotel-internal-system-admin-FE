import {
	pageParam,
	param,
	type SearchParams,
} from "@/components/roles/admin/params";
import { PaymentsScreen } from "@/components/roles/admin/payments";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function PlatformPaymentsPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const sp = await searchParams;
	const tab = param(sp, "tab") ?? "settlements";
	const page = pageParam(sp);
	const businessId = param(sp, "businessId");
	const filters = {
		businessId,
		status: param(sp, "status"),
		from: param(sp, "from"),
		to: param(sp, "to"),
	};
	const [role, settlements, batches, failed, payments, summary, businesses] =
		await Promise.all([
			getActiveRole(),
			adminData.payments.settlements({
				...(tab === "settlements" ? filters : {}),
				page: tab === "settlements" ? page : 0,
				size: 25,
			}),
			adminData.payments.batches({
				page: tab === "batches" ? page : 0,
				size: 25,
			}),
			adminData.payments.failed({
				page: tab === "failed" ? page : 0,
				size: 25,
			}),
			tab === "payments"
				? adminData.payments.list({ ...filters, page, size: 25 })
				: adminData.payments.list({ size: 1 }),
			businessId
				? adminData.payments.summary({ businessId })
				: Promise.resolve(null),
			data.platform.businesses(),
		]);
	return (
		<PaymentsScreen
			role={adminRole(role)}
			settlements={settlements}
			batches={batches}
			failed={failed}
			payments={payments}
			summary={summary}
			businesses={businesses}
		/>
	);
}

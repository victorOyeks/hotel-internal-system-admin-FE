import { MyPaymentsScreen } from "@/components/roles/shared-staff/my-payments";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function KitchenPaymentsPage() {
	const payments = await data.payments.list();
	return <MyPaymentsScreen payments={payments.filter((p) => p.role === "KITCHEN")} roleTitle="Kitchen" />;
}

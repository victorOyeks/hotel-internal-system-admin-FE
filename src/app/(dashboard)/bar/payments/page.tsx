import { MyPaymentsScreen } from "@/components/roles/shared-staff/my-payments";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BarPaymentsPage() {
	const payments = await data.payments.list();
	return <MyPaymentsScreen payments={payments.filter((p) => p.role === "BAR")} roleTitle="Bar" />;
}

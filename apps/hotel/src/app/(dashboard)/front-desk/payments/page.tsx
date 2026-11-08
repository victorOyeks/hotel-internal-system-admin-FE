import { redirect } from "next/navigation";
import { MyPaymentsScreen } from "@/components/roles/front-office/payments";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FrontDeskPaymentsPage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const [payments, folios, terminals] = await Promise.all([data.payments.list(), data.folios.list(), data.payments.terminals()]);
	return <MyPaymentsScreen payments={payments} folios={folios} terminals={terminals} me={user.fullName} roleFilter="FRONT_OFFICE" />;
}

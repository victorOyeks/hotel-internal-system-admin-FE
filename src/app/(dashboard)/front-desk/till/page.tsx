import { redirect } from "next/navigation";
import { TillScreen } from "@/components/roles/front-office/till";
import { getUser } from "@/lib/dal";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FrontDeskTillPage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const [tills, payments, staff] = await Promise.all([data.finance.tills(), data.payments.list(), data.staff.list()]);
	return <TillScreen tills={tills} payments={payments} staff={staff} me={user.fullName} />;
}

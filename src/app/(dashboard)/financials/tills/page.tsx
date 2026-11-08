import { TillsScreen } from "@/components/roles/finance/tills";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FinanceTillsPage() {
	const tills = await data.finance.tills();
	return <TillsScreen tills={tills} />;
}

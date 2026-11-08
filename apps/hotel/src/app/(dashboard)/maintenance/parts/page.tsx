import { SparePartsScreen } from "@/components/roles/maintenance/parts";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function MaintenancePartsPage() {
	const [parts, repairs] = await Promise.all([data.maintenance.parts(), data.maintenance.repairs()]);
	return <SparePartsScreen parts={parts} repairs={repairs} />;
}

import { LinenScreen } from "@/components/roles/housekeeping/linen";
import { demoLinen } from "@hospio/api/demo/fixtures/tablet";

export const dynamic = "force-dynamic";

export default function LinenPage() {
	return <LinenScreen linen={demoLinen} />;
}

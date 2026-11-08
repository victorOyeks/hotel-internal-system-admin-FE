import { LaundryLinenScreen } from "@/components/roles/laundry/linen";
import { demoLinen, demoLinenMoves, demoMachines } from "@hospio/api/demo/fixtures/tablet";

export const dynamic = "force-dynamic";

export default function LaundryLinenPage() {
	return <LaundryLinenScreen linen={demoLinen} machines={demoMachines} moves={demoLinenMoves} />;
}

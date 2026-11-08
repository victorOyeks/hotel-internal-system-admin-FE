import { OwnerSettings } from "@/components/roles/owner/settings";
import { ownerBusiness } from "@/lib/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 10 Company, taxes & currency, approval limits, transfer ownership. */
export default function Page() {
	return <OwnerSettings business={ownerBusiness} />;
}

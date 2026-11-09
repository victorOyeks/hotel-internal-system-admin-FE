import { MegaphoneIcon } from "lucide-react";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { PageHeader } from "@hospio/ui/shared/page-header";

/** Shown when GET /platform/marketer/me has no profile for the signed-in account. */
export function NotAMarketer() {
	return (
		<>
			<PageHeader title="Marketer portal" />
			<EmptyState
				title="No marketer profile on this account"
				hint="Ask H.M.S to invite you as a marketer; the portal opens once the profile exists."
			>
				<MegaphoneIcon className="mt-2 size-5 text-ink-3" />
			</EmptyState>
		</>
	);
}

import { EyeIcon } from "lucide-react";
import Link from "next/link";
import { decodeSession } from "@hospio/api/session";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { SupportSignIn } from "@/components/auth/support-sign-in";

export const dynamic = "force-dynamic";

/**
 * "View as owner" from the admin portal lands here with a support-access token (`act` = the admin,
 * roles OWNER:VIEW, expiring with the grant). A valid token becomes the session and the dashboard
 * opens with the read-only bar; an expired or unreadable one gets a short message.
 */
export default async function SupportSignInPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	const session = token ? decodeSession(token) : null;
	if (session?.actedBy && token) return <SupportSignIn token={token} />;
	return (
		<div className="flex flex-col gap-4">
			<span className="flex size-12 items-center justify-center rounded-xl bg-warning-soft text-warning">
				<EyeIcon className="size-6" />
			</span>
			<h1 className="text-[24px] font-bold text-ink">
				This support link has expired
			</h1>
			<p className="text-sm text-ink-2">
				Ask for a new one from the admin portal: open the business and choose
				"View as owner" again. Each link lasts as long as the time box chosen
				there, an hour at most.
			</p>
			<Link href="/auth" className={cn(btn.secondary, "w-fit")}>
				Go to sign-in
			</Link>
		</div>
	);
}

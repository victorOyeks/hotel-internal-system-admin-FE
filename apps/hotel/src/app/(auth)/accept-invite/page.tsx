import { ClockIcon, MailXIcon } from "lucide-react";
import Link from "next/link";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { getInvite } from "@hospio/api/actions/onboarding";

export const dynamic = "force-dynamic";

/** /accept-invite?token= (Figma 3167:16201): the invite is read first; expired or used ones get a message instead of the form. */
export default async function AcceptInvitePage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	if (!token)
		return (
			<InviteProblem
				title="This invite link is incomplete"
				body="Open the link exactly as it was sent to you, or ask for a new invite."
			/>
		);
	const result = await getInvite(token);
	if (!result.ok) {
		const expired = /expired|used/i.test(result.error);
		return (
			<InviteProblem
				title={
					expired
						? "This invite has expired or was already used"
						: "This invite link is not valid"
				}
				body={
					expired
						? "Invites work for 7 days and once. Ask the person who invited you for a new one; they can resend it from Users or Staff."
						: "Check the link, or ask the person who invited you to send it again."
				}
				expired={expired}
			/>
		);
	}
	if (result.data.accepted)
		return (
			<InviteProblem
				title="This invite was already accepted"
				body="Sign in with the password you chose. Forgot it? Ask your manager or owner to reset it."
				expired
			/>
		);
	return <AcceptInviteForm token={token} invite={result.data} />;
}

function InviteProblem({
	title,
	body,
	expired,
}: {
	title: string;
	body: string;
	expired?: boolean;
}) {
	const Icon = expired ? ClockIcon : MailXIcon;
	return (
		<div className="flex flex-col gap-4">
			<span className="flex size-10 items-center justify-center rounded-xl bg-warning-soft text-warning">
				<Icon className="size-5" />
			</span>
			<div>
				<h1 className="text-[28px] font-bold text-ink">{title}</h1>
				<p className="mt-2 text-sm text-ink-2">{body}</p>
			</div>
			<p className="rounded-[10px] bg-subtle px-4 py-3 text-[13px] text-ink-2">
				<span className="font-semibold text-ink">Ask for a new invite.</span>{" "}
				The owner (Users → Resend invite) or your manager (Staff → Reset
				password) can send a fresh link and temporary password.
			</p>
			<Link
				href="/auth"
				className="text-center text-[13px] font-semibold text-brand hover:underline"
			>
				Back to sign in
			</Link>
		</div>
	);
}

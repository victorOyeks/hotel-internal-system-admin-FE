import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Passwords are reset by a manager (or by H.M.S for an owner): a temporary one is issued and shown once. */
export default function ForgotPasswordPage() {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<h1 className="text-[28px] font-bold text-ink">Forgot your password?</h1>
				<p className="mt-2 text-sm text-ink-2">
					Ask your manager to reset it from Staff → Reset password. You will get a temporary password that works
					for 72 hours, and you choose a new one the first time you sign in.
				</p>
				<p className="mt-3 text-sm text-ink-2">Owners: ask Hospio360 support and we will send a temporary password.</p>
			</div>
			<Button asChild className="h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90">
				<Link href="/auth">Back to sign in</Link>
			</Button>
		</div>
	);
}

import Link from "next/link";
import { DEMO_AUTH } from "@hospio/api/demo/mode";
import { AuthForm } from "@hospio/ui/screens/auth-form";

export default async function AuthPage({
	searchParams,
}: {
	searchParams: Promise<{ from?: string; saved?: string }>;
}) {
	const { from, saved } = await searchParams;
	return (
		<>
			{saved && (
				<p className="mb-4 rounded-[10px] bg-success-soft px-4 py-3 text-[13px] text-success">
					Your setup is saved. Sign in any time to carry on where you stopped.
				</p>
			)}
			<AuthForm from={from} />
			<p className="mt-6 text-center text-[13px] text-ink-2">
				New here?{" "}
				<Link
					href="/sign-up"
					className="font-semibold text-brand hover:underline"
				>
					Create your hotel account
				</Link>
			</p>
			{DEMO_AUTH && (
				<p className="mt-6 rounded-[10px] bg-info-soft px-4 py-3 text-xs text-info">
					<span className="font-semibold">Demo mode.</span> Any email and
					password sign you in with every role, on sample data for Simpas
					Hotels. Pick a role on the next screen.
				</p>
			)}
		</>
	);
}

import Link from "next/link";
import { DEMO_AUTH } from "@hospio/api/demo/mode";
import { AuthForm } from "@hospio/ui/screens/auth-form";

export default async function AuthPage({
	searchParams,
}: {
	searchParams: Promise<{ from?: string }>;
}) {
	const { from } = await searchParams;
	return (
		<>
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

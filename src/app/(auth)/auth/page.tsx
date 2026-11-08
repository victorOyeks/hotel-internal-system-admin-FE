import { DEMO_AUTH } from "@/lib/demo/mode";
import { AuthForm } from "./auth-form";

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
	const { from } = await searchParams;
	return (
		<>
			<AuthForm from={from} />
			{DEMO_AUTH ? (
				<p className="mt-6 rounded-[10px] bg-info-soft px-4 py-3 text-xs text-info">
					<span className="font-semibold">Demo mode.</span> Any email and password sign you in with every role, on sample data for Simpas Hotels. Pick a role on the next screen.
				</p>
			) : (
				<p className="mt-6 rounded-[10px] bg-info-soft px-4 py-3 text-xs text-info">
					<span className="font-semibold">Test accounts.</span> Staging has one account per role for Simpas Ikeja, e.g. tunde@royalsuites.ng (manager), victor@royalsuites.ng (front office), godwin@royalsuites.ng (owner). Password <span className="font-mono">Hospio123!</span>
				</p>
			)}
		</>
	);
}

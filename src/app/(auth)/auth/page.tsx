import { AuthForm } from "./auth-form";

export default async function AuthPage({
	searchParams,
}: {
	searchParams: Promise<{ from?: string; verified?: string; error?: string }>;
}) {
	const { from, verified, error } = await searchParams;
	return <AuthForm from={from} verified={verified} error={error} />;
}

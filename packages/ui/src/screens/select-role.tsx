import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUser } from "@hospio/api/dal";
import { live } from "@hospio/api/data/live";
import { DEMO_AUTH } from "@hospio/api/demo/mode";
import { REFRESHED_COOKIE, refreshUrl, tokenIsStale } from "@hospio/api/session-refresh";
import { AutoSelectRole } from "./auto-select-role";
import { logout, selectRole } from "@hospio/api/actions";
import { isAppRole } from "@hospio/api/app";
import { roleDescriptions, roleIcons, roleLabels } from "@hospio/api/roles";
import { Button } from "@hospio/ui/primitives/button";

/** Staff · Shared 1.5 · Choose a role, for people who hold more than one. */
export async function SelectRoleScreen() {
	const session = await getSession();
	if (!DEMO_AUTH && live("identity") && !(await cookies()).get(REFRESHED_COOKIE)?.value) {
		// Roles given or taken away since sign-in: offer the current ones, not the token's.
		const user = await getUser();
		if (!user || tokenIsStale(session, user)) redirect(refreshUrl("/select-role"));
	}
	const roles = session.roleSet.filter((r) => isAppRole(r));
	if (roles.length === 1) {
		// Cookies cannot be set while rendering; a client component picks the only role and moves on.
		return <AutoSelectRole role={roles[0]} />;
	}
	if (roles.length === 0) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page p-6 text-center">
				<h1 className="text-xl font-bold text-ink">No role yet</h1>
				<p className="max-w-sm text-sm text-ink-2">Your login works, but nobody has given you a role at a hotel. Ask your manager.</p>
				<form action={logout}>
					<Button variant="outline" className="rounded-control">Sign out</Button>
				</form>
			</main>
		);
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-page p-6">
			<div className="w-full max-w-2xl space-y-6">
				<div>
					<h1 className="text-2xl font-bold text-ink">Welcome back, {session.name.split(" ")[0]}</h1>
					<p className="text-sm text-ink-2">Choose how you want to work today</p>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					{roles.map((role) => {
						const Icon = roleIcons[role];
						return (
							<form key={role} action={selectRole.bind(null, role)}>
								<button
									type="submit"
									className="flex w-full items-center gap-4 rounded-card border border-line bg-card p-4 text-left transition-colors hover:border-brand hover:bg-brand-soft/40"
								>
									<span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-brand">
										<Icon className="size-5" />
									</span>
									<span className="min-w-0">
										<span className="block text-sm font-semibold text-ink">{roleLabels[role]}</span>
										<span className="block text-xs text-ink-3">{roleDescriptions[role]}</span>
									</span>
								</button>
							</form>
						);
					})}
				</div>
				<form action={logout} className="text-center">
					<Button variant="ghost" className="text-ink-2">Sign out</Button>
				</form>
			</div>
		</main>
	);
}

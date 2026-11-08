import { getSession } from "@/lib/dal";
import { logout, selectRole } from "@/lib/actions";
import { roleDescriptions, roleIcons, roleLabels } from "@/lib/roles";
import { Button } from "@/components/ui/button";

/** Staff · Shared 1.5 · Choose a role, for people who hold more than one. */
export default async function SelectRolePage() {
	const session = await getSession();
	if (session.roleSet.length === 1) {
		await selectRole(session.roleSet[0]);
	}
	if (session.roleSet.length === 0) {
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
					{session.roleSet.map((role) => {
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

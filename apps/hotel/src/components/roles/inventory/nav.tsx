"use client";

import Link from "next/link";
import { createContext, type ReactNode, useContext } from "react";
import { cn } from "@hospio/ui/utils";

/** The inventory screens: the INVENTORY role has one route per screen, managers and owners one Inventory page with tabs. */
export type InvScreen =
	| "stock"
	| "requests"
	| "orders"
	| "deliveries"
	| "counts"
	| "suppliers";

export type InvPerms = {
	/** Store work: add/edit, issue, move, order, receive, count (INVENTORY Edit or Full, manager, owner). */
	store: boolean;
	/** Correct a level by hand (INVENTORY Full, manager, owner). */
	full: boolean;
	/** Approve a count (manager, owner). */
	manager: boolean;
};

type Ctx = { mode: "role" | "tabs"; perms: InvPerms };
const InvCtx = createContext<Ctx>({
	mode: "role",
	perms: { store: false, full: false, manager: false },
});

export function InventoryProvider({
	mode,
	perms,
	children,
}: Ctx & { children: ReactNode }) {
	return <InvCtx.Provider value={{ mode, perms }}>{children}</InvCtx.Provider>;
}

export function useInvPerms() {
	return useContext(InvCtx).perms;
}

/** A link to another inventory screen with query params, right for the current role. */
export function useInvHref() {
	const { mode } = useContext(InvCtx);
	return (
		screen: InvScreen,
		params: Record<string, string | number | undefined> = {},
	) => {
		const q = new URLSearchParams();
		if (mode === "tabs" && screen !== "stock") q.set("screen", screen);
		for (const [k, v] of Object.entries(params))
			if (v !== undefined && v !== "") q.set(k, String(v));
		const qs = q.toString();
		const path =
			mode === "tabs"
				? "/dashboard/inventory"
				: screen === "stock"
					? "/dashboard"
					: `/dashboard/${screen}`;
		return qs ? `${path}?${qs}` : path;
	};
}

const TABS: { key: InvScreen; label: string }[] = [
	{ key: "stock", label: "Stores & stock" },
	{ key: "requests", label: "Requests" },
	{ key: "orders", label: "Purchase orders" },
	{ key: "deliveries", label: "Deliveries" },
	{ key: "counts", label: "Stock counts" },
	{ key: "suppliers", label: "Suppliers" },
];

/** Managers and owners: the inventory screens as tabs on one page. */
export function InventoryTabs({
	active,
	counts,
}: {
	active: InvScreen;
	counts?: Partial<Record<InvScreen, number>>;
}) {
	return (
		<nav
			className="flex flex-wrap gap-1 rounded-card border border-line bg-card p-1"
			aria-label="Inventory"
		>
			{TABS.map((t) => (
				<Link
					key={t.key}
					href={
						t.key === "stock"
							? "/dashboard/inventory"
							: `/dashboard/inventory?screen=${t.key}`
					}
					className={cn(
						"rounded-control px-3 py-1.5 text-[13px] font-medium",
						active === t.key
							? "bg-brand text-white"
							: "text-ink-2 hover:bg-subtle",
					)}
				>
					{t.label}
					{counts?.[t.key] ? (
						<span className="ml-1 opacity-80">({counts[t.key]})</span>
					) : null}
				</Link>
			))}
		</nav>
	);
}

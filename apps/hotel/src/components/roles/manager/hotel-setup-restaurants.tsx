"use client";

import { ChefHatIcon, PencilIcon, PlusIcon, WineIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { saveOutlet, saveTable } from "@hospio/api/actions/fnb";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	OutletKind,
	OutletRow,
	StoreRow,
	TableRow,
} from "@hospio/api/data/types";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField, ToggleField } from "@hospio/ui/shared/field";
import { Modal } from "@hospio/ui/shared/modal";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

const KINDS: { value: OutletKind; label: string }[] = [
	{ value: "KITCHEN", label: "Kitchen" },
	{ value: "RESTAURANT", label: "Restaurant" },
	{ value: "BAR", label: "Bar" },
];
type OutletDraft = {
	id?: string;
	name: string;
	kind: OutletKind;
	storeId: string;
	open: boolean;
};
type TableDraft = {
	outletId: string;
	id?: string;
	number: string;
	seats: string;
	active: boolean;
};

/**
 * Manager · Hotel setup · Restaurants & tables (Figma 3256:11392, 3260:12166): each kitchen, restaurant and bar
 * with its name, kind, the inventory store it draws stock from and whether it is open, and the tables or
 * seats staff pick when they take an order. Saved to fnb-service.
 */
export function RestaurantsSection({
	outlets: initial,
	stores,
	locked,
}: {
	outlets: OutletRow[];
	stores: StoreRow[];
	locked: boolean;
}) {
	const [outlets, setOutlets] = useState(initial);
	useEffect(() => setOutlets(initial), [initial]);
	const [outlet, setOutlet] = useState<OutletDraft | null>(null);
	const [table, setTable] = useState<TableDraft | null>(null);
	const { run, pending } = useAction();
	const storeName = (id?: string) => stores.find((s) => s.id === id)?.name;

	const putOutlet = (o: OutletRow) =>
		setOutlets((all) =>
			all.some((x) => x.id === o.id)
				? all.map((x) => (x.id === o.id ? { ...o, tables: x.tables } : x))
				: [...all, o],
		);
	const putTable = (t: TableRow) =>
		setOutlets((all) =>
			all.map((o) =>
				o.id === t.outletId
					? {
							...o,
							tables: o.tables.some((x) => x.id === t.id)
								? o.tables.map((x) => (x.id === t.id ? t : x))
								: [...o.tables, t],
						}
					: o,
			),
		);

	const submitOutlet = () => {
		if (!outlet) return;
		const existing = outlets.find((o) => o.id === outlet.id);
		run(
			() =>
				saveOutlet(
					outlet.id,
					{
						name: outlet.name.trim(),
						kind: outlet.kind,
						storeId: outlet.storeId || undefined,
						status: outlet.open ? "OPEN" : "CLOSED",
					},
					existing?.tables,
				),
			outlet.id ? "Saved" : "Outlet added",
			(o) => {
				putOutlet({ ...o, tables: existing?.tables ?? o.tables });
				setOutlet(null);
			},
		);
	};
	const submitTable = () => {
		if (!table) return;
		run(
			() =>
				saveTable(table.outletId, table.id, {
					number: table.number.trim(),
					seats: Math.max(1, Number(table.seats) || 4),
					active: table.active,
				}),
			table.id ? "Saved" : "Table added",
			(t) => {
				putTable(t);
				setTable(null);
			},
		);
	};

	return (
		<section className="flex flex-col rounded-card border border-line bg-card">
			<header className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
				<div>
					<h2 className="text-lg font-bold text-ink">Restaurants & tables</h2>
					<p className="text-[13px] text-ink-3">
						Your kitchens and bars, the store each draws from, and their tables
					</p>
				</div>
				{!locked && (
					<Button
						className={btn.primary}
						onClick={() =>
							setOutlet({ name: "", kind: "KITCHEN", storeId: "", open: true })
						}
					>
						<PlusIcon className="size-4" /> Add outlet
					</Button>
				)}
			</header>
			<div className="flex flex-col gap-5 px-6 py-5">
				{outlets.length === 0 && (
					<Note tone="info">
						No restaurant or bar yet. Add one so staff can take orders; the
						kitchen and bar screens read it.
					</Note>
				)}
				{outlets.map((o) => {
					const Icon = o.kind === "BAR" ? WineIcon : ChefHatIcon;
					return (
						<div
							key={o.id}
							className="flex flex-col gap-3 rounded-xl border border-line p-4"
						>
							<div className="flex items-center gap-3">
								<span className="flex size-10 items-center justify-center rounded-control bg-brand-soft text-brand">
									<Icon className="size-5" />
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-[15px] font-semibold text-ink">{o.name}</p>
									<p className="text-xs text-ink-3">
										{KINDS.find((k) => k.value === o.kind)?.label} ·{" "}
										{o.storeId
											? `draws from ${storeName(o.storeId) ?? "a store"}`
											: "no store linked, so no stock is drawn"}
									</p>
								</div>
								<StatusPill tone={o.status === "OPEN" ? "success" : "grey"}>
									{o.status === "OPEN" ? "Open" : "Closed"}
								</StatusPill>
								{!locked && (
									<Button
										variant="outline"
										className={btn.secondary}
										onClick={() =>
											setOutlet({
												id: o.id,
												name: o.name,
												kind: o.kind,
												storeId: o.storeId ?? "",
												open: o.status === "OPEN",
											})
										}
									>
										<PencilIcon className="size-4" /> Edit
									</Button>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
									{o.kind === "BAR" ? "Seats and tables" : "Tables"} ·{" "}
									{o.tables.filter((t) => t.active).length} in use
								</p>
								<div className="flex flex-wrap gap-2">
									{o.tables.map((t) => (
										<button
											key={t.id}
											type="button"
											disabled={locked}
											onClick={() =>
												setTable({
													outletId: o.id,
													id: t.id,
													number: t.number,
													seats: String(t.seats),
													active: t.active,
												})
											}
											className={cn(
												"flex flex-col items-start rounded-control border px-3 py-2 text-left",
												t.active
													? "border-line bg-card hover:bg-subtle"
													: "border-dashed border-line bg-subtle text-ink-3",
											)}
										>
											<span className="text-[13px] font-semibold">
												{t.number}
											</span>
											<span className="text-xs text-ink-3">
												{t.seats} seats{t.active ? "" : " · off"}
											</span>
										</button>
									))}
									{!locked && (
										<button
											type="button"
											onClick={() =>
												setTable({
													outletId: o.id,
													number: "",
													seats: "4",
													active: true,
												})
											}
											className="flex items-center gap-1 rounded-control border border-dashed border-line px-3 py-2 text-[13px] font-semibold text-brand hover:bg-subtle"
										>
											<PlusIcon className="size-4" /> Add a table
										</button>
									)}
								</div>
							</div>
						</div>
					);
				})}
				<p className="rounded-[10px] bg-subtle/70 px-4 py-3 text-xs text-ink-2">
					<span className="font-semibold text-ink">Why this matters · </span>
					Staff pick the table or seat from this list when they take an order,
					and a recipe takes stock from the outlet's store each time an order is
					paid or charged to a room.
				</p>
			</div>

			<Modal
				open={!!outlet}
				onOpenChange={(o) => !o && setOutlet(null)}
				title={outlet?.id ? "Edit outlet" : "Add outlet"}
				subtitle="A kitchen, restaurant or bar"
				icon={ChefHatIcon}
				size="form"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setOutlet(null)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pending || !outlet?.name.trim()}
							onClick={submitOutlet}
						>
							Save
						</Button>
					</>
				}
			>
				{outlet && (
					<div className="flex flex-col gap-4">
						<TextField
							label="Name"
							value={outlet.name}
							onChange={(v) => setOutlet({ ...outlet, name: v })}
							required
						/>
						<SelectField
							label="Kind"
							value={outlet.kind}
							onChange={(v) => setOutlet({ ...outlet, kind: v as OutletKind })}
							options={KINDS}
						/>
						<SelectField
							label="Store it draws stock from"
							value={outlet.storeId}
							onChange={(v) => setOutlet({ ...outlet, storeId: v })}
							options={stores.map((s) => ({ value: s.id, label: s.name }))}
							placeholder="No store"
						/>
						<ToggleField
							label="Open"
							checked={outlet.open}
							onChange={(v) => setOutlet({ ...outlet, open: v })}
							hint="A closed outlet still lets staff finish the orders that are open"
						/>
					</div>
				)}
			</Modal>

			<Modal
				open={!!table}
				onOpenChange={(o) => !o && setTable(null)}
				title={table?.id ? "Edit table" : "Add a table"}
				subtitle={outlets.find((o) => o.id === table?.outletId)?.name}
				size="confirm"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setTable(null)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pending || !table?.number.trim()}
							onClick={submitTable}
						>
							Save
						</Button>
					</>
				}
			>
				{table && (
					<div className="flex flex-col gap-4">
						<TextField
							label="Table or seat"
							value={table.number}
							onChange={(v) => setTable({ ...table, number: v })}
							placeholder="e.g. 9, Terrace 3, Lounge 2"
							required
						/>
						<TextField
							label="Seats"
							type="number"
							value={table.seats}
							onChange={(v) => setTable({ ...table, seats: v })}
						/>
						<ToggleField
							label="In use"
							checked={table.active}
							onChange={(v) => setTable({ ...table, active: v })}
							hint="Switch off a table that is out of use; open orders on it are not affected"
						/>
					</div>
				)}
			</Modal>
		</section>
	);
}

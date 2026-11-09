"use client";

import {
	BanIcon,
	EyeOffIcon,
	ListIcon,
	PencilIcon,
	PlusIcon,
	ShieldCheckIcon,
	SunIcon,
	TagIcon,
	Trash2Icon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	MoneyField,
	SelectField,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import {
	changeItemPrice,
	saveCategory,
	saveHappyHour,
	saveMenuItem,
	setItemAvailable,
} from "@hospio/api/actions/fnb";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	CategoryRow,
	HappyHourRow,
	MenuItemRow,
	OptionGroup,
	OutletKind,
	StockItemRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { daysLabel } from "./outlet-shared";
import { BigButton, ShiftPill } from "./tablet";

type Panel =
	| { kind: "add" }
	| { kind: "edit"; item: MenuItemRow }
	| { kind: "price"; item: MenuItemRow }
	| { kind: "categories" }
	| { kind: "happy" }
	| null;
type Draft = {
	name: string;
	category: string;
	price: number | "";
	description: string;
	active: boolean;
	groups: OptionGroup[];
	recipe: { stockItemId: string; quantity: number | "" }[];
};
const emptyDraft = (category: string): Draft => ({
	name: "",
	category,
	price: "",
	description: "",
	active: true,
	groups: [],
	recipe: [],
});
const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
type HappyDraft = {
	id?: string;
	name: string;
	from: string;
	to: string;
	days: string[];
	discountPct: number;
	active: boolean;
};
const emptyHappy = (): HappyDraft => ({
	name: "Happy hour",
	from: "17:00",
	to: "19:00",
	days: ["MON", "TUE", "WED", "THU", "FRI"],
	discountPct: 20,
	active: true,
});

/**
 * Menu & prices for Kitchen (3251:12362…) and Bar (3264:11673…), and the manager's menus for every outlet:
 * sold-out toggles, price changes (applied at once for a manager or Full access, otherwise waiting for the
 * manager's approval and shown as pending), add / edit / take off the menu with choices and a recipe,
 * categories, and (bar) happy hours.
 */
export function MenuScreen({
	menu,
	outlet,
	categories,
	stock = [],
	happyHours: initialHappy,
	title = "Menu & prices",
}: {
	menu: MenuItemRow[];
	outlet: { id: string; name: string; kind: OutletKind };
	categories: CategoryRow[];
	stock?: StockItemRow[];
	happyHours?: HappyHourRow[];
	title?: string;
}) {
	const [items, setItems] = useState(menu);
	useEffect(() => setItems(menu), [menu]);
	const [cats, setCats] = useState(categories);
	useEffect(() => setCats(categories), [categories]);
	const [hhs, setHhs] = useState(initialHappy ?? []);
	useEffect(() => setHhs(initialHappy ?? []), [initialHappy]);
	const [q, setQ] = useState("");
	const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("all"));
	const [panel, setPanel] = useState<Panel>(null);
	const [soldOut, setSoldOut] = useState<MenuItemRow | null>(null);
	const { run, pending } = useAction();
	const isBar = outlet.kind === "BAR";
	const showHappy = initialHappy !== undefined;
	const noun = isBar ? "drink" : "item";

	const categoryNames = useMemo(() => {
		const used = Array.from(new Set(items.map((m) => m.category)));
		const ordered = cats.filter((c) => c.active).map((c) => c.name);
		return [...ordered, ...used.filter((u) => !ordered.includes(u))];
	}, [items, cats]);
	const onMenu = items.filter((m) => m.active !== false);
	const list = items.filter((m) =>
		tab === "all"
			? m.active !== false
			: tab === "soldout"
				? !m.available && m.active !== false
				: tab === "off"
					? m.active === false
					: m.category === tab && m.active !== false,
	);
	const [draft, setDraft] = useState<Draft>(emptyDraft(""));
	const [newPrice, setNewPrice] = useState<number | "">("");
	const [reason, setReason] = useState("");
	const [newCat, setNewCat] = useState("");
	const [happy, setHappy] = useState<HappyDraft>(emptyHappy());

	const close = () => setPanel(null);
	const patch = (m: MenuItemRow) =>
		setItems((it) =>
			it.some((x) => x.id === m.id)
				? it.map((x) =>
						x.id === m.id ? { ...x, ...m, pendingPrice: x.pendingPrice } : x,
					)
				: [...it, m],
		);
	const openEdit = (item: MenuItemRow) => {
		setDraft({
			name: item.name,
			category: item.category,
			price: item.price,
			description: item.description ?? "",
			active: item.active !== false,
			groups:
				item.optionGroups ??
				(item.options?.length
					? [
							{
								group: "Choice",
								choices: item.options.map((name) => ({ name, priceDelta: 0 })),
								required: true,
								multiple: false,
							},
						]
					: []),
			recipe: (item.recipe ?? []).map((r) => ({
				stockItemId: r.stockItemId,
				quantity: r.quantity,
			})),
		});
		setPanel({ kind: "edit", item });
	};
	const setGroup = (i: number, g: Partial<OptionGroup>) =>
		setDraft((d) => ({
			...d,
			groups: d.groups.map((x, j) => (j === i ? { ...x, ...g } : x)),
		}));
	const setRecipe = (i: number, r: Partial<Draft["recipe"][number]>) =>
		setDraft((d) => ({
			...d,
			recipe: d.recipe.map((x, j) => (j === i ? { ...x, ...r } : x)),
		}));

	const saveItem = () => {
		const editing = panel?.kind === "edit" ? panel.item : undefined;
		run(
			() =>
				saveMenuItem({ id: outlet.id, name: outlet.name }, editing?.id, {
					category: draft.category,
					name: draft.name.trim(),
					description: draft.description,
					price: Number(draft.price),
					options: draft.groups,
					recipe: draft.recipe
						.filter((r) => r.stockItemId && Number(r.quantity) > 0)
						.map((r) => ({
							stockItemId: r.stockItemId,
							quantity: Number(r.quantity),
						})),
					active: draft.active,
					sortOrder: editing?.sortOrder,
				}),
			editing ? "Item updated" : `${isBar ? "Drink" : "Item"} added`,
			(m) => {
				patch({ ...m, available: editing?.available ?? m.available });
				close();
			},
		);
	};

	return (
		<>
			<PageHeader
				title={title}
				subtitle={`${outlet.name} · ${onMenu.length} items · ${onMenu.filter((m) => !m.available).length} sold out${items.length > onMenu.length ? ` · ${items.length - onMenu.length} off the menu` : ""}`}
			>
				<ShiftPill />
				<BigButton
					tone="secondary"
					onClick={() => setPanel({ kind: "categories" })}
				>
					<ListIcon className="size-5" /> Categories
				</BigButton>
				{showHappy && (
					<BigButton
						tone="secondary"
						onClick={() => {
							setHappy(emptyHappy());
							setPanel({ kind: "happy" });
						}}
					>
						<SunIcon className="size-5" /> Happy hours
					</BigButton>
				)}
				<BigButton
					onClick={() => {
						setDraft(emptyDraft(categoryNames[0] ?? ""));
						setPanel({ kind: "add" });
					}}
				>
					<PlusIcon className="size-5" /> Add {noun}
				</BigButton>
			</PageHeader>
			<Note tone="info">
				Marking an item sold out takes effect at once. A price change applies at
				once for a manager or Full access; otherwise it waits for the manager's
				approval and the old price stays until then.
			</Note>
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "all", label: "All", count: onMenu.length },
							...categoryNames.map((c) => ({
								key: c,
								label: c,
								count: onMenu.filter((m) => m.category === c).length,
							})),
							{
								key: "soldout",
								label: "Sold out",
								count: onMenu.filter((m) => !m.available).length,
							},
							...(items.some((m) => m.active === false)
								? [
										{
											key: "off",
											label: "Off the menu",
											count: items.filter((m) => m.active === false).length,
										},
									]
								: []),
						]}
						value={tab}
						onChange={(k) => void setTab(k === "all" ? null : k)}
					/>
				}
				right={
					<SearchBox value={q} onChange={setQ} placeholder="Search items…" />
				}
			/>
			<DataTable
				data={list}
				search={q}
				pageSize={15}
				onRowClick={openEdit}
				emptyTitle="Nothing here yet"
				columns={[
					{
						accessorKey: "name",
						header: "Item",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.name}
								secondary={
									row.original.description ??
									(row.original.options?.length
										? `Choices: ${row.original.options.join(", ")}`
										: undefined)
								}
							/>
						),
					},
					{ accessorKey: "category", header: "Category" },
					{
						accessorKey: "price",
						header: "Price",
						cell: ({ row }) => (
							<div className="flex flex-col gap-1">
								<span className="font-semibold">
									{naira(row.original.price)}
								</span>
								{row.original.pendingPrice != null && (
									<StatusPill tone="warning" dot={false}>
										{naira(row.original.pendingPrice)} awaiting approval
									</StatusPill>
								)}
							</div>
						),
					},
					{
						accessorKey: "available",
						header: "Status",
						cell: ({ row }) =>
							row.original.active === false ? (
								<StatusPill tone="grey">Off the menu</StatusPill>
							) : (
								<StatusPill
									tone={row.original.available ? "success" : "danger"}
								>
									{row.original.available ? "Available" : "Sold out"}
								</StatusPill>
							),
					},
					{
						id: "actions",
						header: "",
						cell: ({ row }) => (
							<RowActions
								actions={[
									{
										label: row.original.available
											? "Mark sold out"
											: "Back on the menu",
										icon: BanIcon,
										onClick: () =>
											row.original.available
												? setSoldOut(row.original)
												: run(
														() => setItemAvailable(row.original.id, true),
														`${row.original.name} is back on the menu`,
														() => patch({ ...row.original, available: true }),
													),
									},
									{
										label: "Change price",
										icon: TagIcon,
										onClick: () => {
											setNewPrice(row.original.price);
											setReason("");
											setPanel({ kind: "price", item: row.original });
										},
									},
									{
										label: "Edit item",
										icon: PencilIcon,
										onClick: () => openEdit(row.original),
									},
								]}
							/>
						),
					},
				]}
			/>

			<ConfirmModal
				open={!!soldOut}
				onOpenChange={(o) => !o && setSoldOut(null)}
				title={`Mark ${soldOut?.name ?? ""} sold out?`}
				subtitle="Staff can't add it to new orders until you bring it back"
				confirmLabel="Mark sold out"
				pending={pending}
				onConfirm={() =>
					soldOut &&
					run(
						() => setItemAvailable(soldOut.id, false),
						`${soldOut.name} marked sold out`,
						() => {
							patch({ ...soldOut, available: false });
							setSoldOut(null);
						},
					)
				}
			>
				<WhatHappens
					items={[
						"It disappears from the picker on every tablet right now",
						"Open orders that already have it are not affected",
						"Bring it back from the Sold out tab",
					]}
				/>
			</ConfirmModal>

			<SidePanel
				open={panel?.kind === "price"}
				onOpenChange={(o) => !o && close()}
				title="Change price"
				subtitle={
					panel?.kind === "price"
						? `${panel.item.name} · now ${naira(panel.item.price)}`
						: undefined
				}
				icon={TagIcon}
				footerInfo={
					<span className="flex items-center gap-1">
						<ShieldCheckIcon className="size-3" /> Manager and Full access
						change it at once; others wait for approval
					</span>
				}
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={
								newPrice === "" ||
								(panel?.kind === "price" && newPrice === panel.item.price)
							}
							onClick={() =>
								panel?.kind === "price" &&
								run(
									() =>
										changeItemPrice(panel.item.id, Number(newPrice), reason),
									(r) =>
										r.status === "CHANGED"
											? "Price changed"
											: "Price change sent to the manager",
									(r) => {
										patch(
											r.status === "CHANGED"
												? { ...panel.item, price: r.price }
												: { ...panel.item, pendingPrice: r.price },
										);
										close();
									},
								)
							}
						>
							Save price
						</BigButton>
					</>
				}
			>
				{panel?.kind === "price" && (
					<div className="flex flex-col gap-4">
						<MoneyField
							label="New price"
							value={newPrice}
							onChange={setNewPrice}
							required
						/>
						<TextareaField
							label="Why"
							value={reason}
							onChange={setReason}
							placeholder="e.g. supplier price went up"
						/>
						<TotalsList
							rows={[
								{ label: "Now", value: naira(panel.item.price) },
								{
									label: "Proposed",
									value: naira(newPrice || 0),
									strong: true,
								},
							]}
						/>
						<WhatHappens
							items={[
								"If it needs approval the old price stays until the manager decides",
								"The manager decides in Approvals; you get an alert",
								"The item shows 'awaiting approval' here until then",
							]}
						/>
					</div>
				)}
			</SidePanel>

			<SidePanel
				open={panel?.kind === "add" || panel?.kind === "edit"}
				onOpenChange={(o) => !o && close()}
				title={panel?.kind === "edit" ? "Edit item" : `Add ${noun}`}
				subtitle={outlet.name}
				icon={PencilIcon}
				width="lg"
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={
								!draft.name.trim() || draft.price === "" || !draft.category
							}
							onClick={saveItem}
						>
							{panel?.kind === "edit" ? "Save" : `Add ${noun}`}
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-5">
					<TextField
						label="Name"
						value={draft.name}
						onChange={(v) => setDraft({ ...draft, name: v })}
						required
					/>
					<div className="grid grid-cols-2 gap-3">
						<SelectField
							label="Category"
							value={draft.category}
							onChange={(v) => setDraft({ ...draft, category: v })}
							options={categoryNames}
							placeholder="Pick a category"
						/>
						<MoneyField
							label="Price"
							value={draft.price}
							onChange={(v) => setDraft({ ...draft, price: v })}
							required
							disabled={panel?.kind === "edit"}
							hint={
								panel?.kind === "edit"
									? "Use Change price to set a new one"
									: undefined
							}
						/>
					</div>
					<TextareaField
						label="Description"
						value={draft.description}
						onChange={(v) => setDraft({ ...draft, description: v })}
						rows={2}
					/>
					<ToggleField
						label="On the menu"
						checked={draft.active}
						onChange={(v) => setDraft({ ...draft, active: v })}
					/>
					<PanelSection title="Choices">
						{draft.groups.length === 0 && (
							<p className="text-[13px] text-ink-3">
								No choices: the guest orders it as it is.
							</p>
						)}
						{draft.groups.map((g, i) => (
							<div
								key={i}
								className="flex flex-col gap-3 rounded-control border border-line p-3"
							>
								<div className="flex items-end gap-2">
									<div className="flex-1">
										<TextField
											label="Group"
											value={g.group}
											onChange={(v) => setGroup(i, { group: v })}
											placeholder="e.g. How it's cooked, Size, Extras"
										/>
									</div>
									<button
										type="button"
										aria-label="Remove group"
										onClick={() =>
											setDraft((d) => ({
												...d,
												groups: d.groups.filter((_, j) => j !== i),
											}))
										}
										className="mb-1 rounded-control p-2 text-ink-3 hover:bg-subtle hover:text-danger"
									>
										<Trash2Icon className="size-4" />
									</button>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<ToggleField
										label="Must choose"
										checked={g.required}
										onChange={(v) => setGroup(i, { required: v })}
									/>
									<ToggleField
										label="More than one"
										checked={g.multiple}
										onChange={(v) => setGroup(i, { multiple: v })}
									/>
								</div>
								{g.choices.map((c, k) => (
									<div key={k} className="flex items-center gap-2">
										<input
											value={c.name}
											onChange={(e) =>
												setGroup(i, {
													choices: g.choices.map((x, m) =>
														m === k ? { ...x, name: e.target.value } : x,
													),
												})
											}
											placeholder="Choice"
											className="h-11 min-w-0 flex-1 rounded-control border border-line px-3 text-[15px] outline-none focus:border-brand"
										/>
										<input
											type="number"
											value={c.priceDelta}
											onChange={(e) =>
												setGroup(i, {
													choices: g.choices.map((x, m) =>
														m === k
															? {
																	...x,
																	priceDelta: Number(e.target.value) || 0,
																}
															: x,
													),
												})
											}
											aria-label="Price difference"
											className="h-11 w-28 rounded-control border border-line px-3 text-[15px] outline-none focus:border-brand"
										/>
										<button
											type="button"
											aria-label="Remove choice"
											onClick={() =>
												setGroup(i, {
													choices: g.choices.filter((_, m) => m !== k),
												})
											}
											className="rounded-control p-2 text-ink-3 hover:bg-subtle hover:text-danger"
										>
											<Trash2Icon className="size-4" />
										</button>
									</div>
								))}
								<BigButton
									tone="ghost"
									className="h-10 self-start"
									onClick={() =>
										setGroup(i, {
											choices: [...g.choices, { name: "", priceDelta: 0 }],
										})
									}
								>
									<PlusIcon className="size-4" /> Add a choice
								</BigButton>
							</div>
						))}
						<BigButton
							tone="secondary"
							className="h-11 self-start"
							onClick={() =>
								setDraft((d) => ({
									...d,
									groups: [
										...d.groups,
										{
											group: "",
											choices: [{ name: "", priceDelta: 0 }],
											required: true,
											multiple: false,
										},
									],
								}))
							}
						>
							<PlusIcon className="size-4" /> Add a group of choices
						</BigButton>
						<p className="text-xs text-ink-3">
							The number beside a choice is the price difference in naira (0 for
							none).
						</p>
					</PanelSection>
					<PanelSection title="Recipe · stock used per portion">
						{stock.length === 0 && (
							<Note tone="info">
								No stock is kept for this outlet yet, so there is nothing to
								draw from. Link a store in Hotel setup → Restaurants & tables.
							</Note>
						)}
						{draft.recipe.map((r, i) => (
							<div key={i} className="flex items-end gap-2">
								<div className="flex-1">
									<SelectField
										label={i === 0 ? "Stock item" : ""}
										value={r.stockItemId}
										onChange={(v) => setRecipe(i, { stockItemId: v })}
										options={stock.map((s) => ({
											value: s.id,
											label: `${s.name} (${s.unit})`,
										}))}
										placeholder="Pick stock"
									/>
								</div>
								<div className="w-28">
									<TextField
										label={i === 0 ? "Quantity" : ""}
										type="number"
										value={String(r.quantity)}
										onChange={(v) =>
											setRecipe(i, { quantity: v === "" ? "" : Number(v) })
										}
									/>
								</div>
								<button
									type="button"
									aria-label="Remove ingredient"
									onClick={() =>
										setDraft((d) => ({
											...d,
											recipe: d.recipe.filter((_, j) => j !== i),
										}))
									}
									className="mb-1 rounded-control p-2 text-ink-3 hover:bg-subtle hover:text-danger"
								>
									<Trash2Icon className="size-4" />
								</button>
							</div>
						))}
						{stock.length > 0 && (
							<BigButton
								tone="secondary"
								className="h-11 self-start"
								onClick={() =>
									setDraft((d) => ({
										...d,
										recipe: [...d.recipe, { stockItemId: "", quantity: 1 }],
									}))
								}
							>
								<PlusIcon className="size-4" /> Add stock used
							</BigButton>
						)}
						<p className="text-xs text-ink-3">
							When an order is paid or charged to a room, this stock is taken
							from the outlet's store. Items without a recipe draw nothing.
						</p>
					</PanelSection>
					{panel?.kind === "edit" && draft.active === false && (
						<Note tone="warning">
							<EyeOffIcon className="mr-1 inline size-3" /> Taking it off the
							menu hides it from every picker. Orders that already have it are
							not affected.
						</Note>
					)}
				</div>
			</SidePanel>

			<Modal
				open={panel?.kind === "categories"}
				onOpenChange={(o) => !o && close()}
				title="Categories"
				subtitle="The pills staff see in the picker"
				icon={ListIcon}
				size="confirm"
				footer={
					<BigButton tone="secondary" onClick={close}>
						Close
					</BigButton>
				}
			>
				<div className="flex flex-col gap-3">
					<ul className="divide-y divide-line rounded-control border border-line">
						{cats.length === 0 && (
							<li className="px-4 py-3 text-[13px] text-ink-3">
								No categories yet. Items keep the category they were added with.
							</li>
						)}
						{cats.map((c) => (
							<li
								key={c.id}
								className="flex items-center gap-3 px-4 py-3 text-[15px] text-ink"
							>
								<span
									className={cn(
										"flex-1",
										!c.active && "text-ink-3 line-through",
									)}
								>
									{c.name}
								</span>
								<span className="text-xs text-ink-3">
									{items.filter((m) => m.category === c.name).length} items
								</span>
								<button
									type="button"
									disabled={pending}
									onClick={() =>
										run(
											() =>
												saveCategory(outlet.id, c.id, {
													name: c.name,
													sortOrder: c.sortOrder,
													active: !c.active,
												}),
											c.active
												? `${c.name} hidden from the picker`
												: `${c.name} is back`,
											(r) =>
												setCats((cs) => cs.map((x) => (x.id === c.id ? r : x))),
										)
									}
									className="text-xs font-semibold text-brand disabled:opacity-30"
								>
									{c.active ? "Hide" : "Show"}
								</button>
							</li>
						))}
					</ul>
					<div className="flex gap-2">
						<input
							value={newCat}
							onChange={(e) => setNewCat(e.target.value)}
							placeholder="New category"
							className="h-11 flex-1 rounded-control border border-line px-3 text-[15px] outline-none focus:border-brand"
						/>
						<BigButton
							tone="secondary"
							className="h-11"
							pending={pending}
							disabled={
								!newCat.trim() ||
								cats.some(
									(c) => c.name.toLowerCase() === newCat.trim().toLowerCase(),
								)
							}
							onClick={() =>
								run(
									() =>
										saveCategory(outlet.id, undefined, {
											name: newCat.trim(),
											sortOrder:
												cats.reduce((m, c) => Math.max(m, c.sortOrder), 0) + 1,
										}),
									"Category added",
									(r) => {
										setCats((cs) => [...cs, r]);
										setNewCat("");
									},
								)
							}
						>
							Add
						</BigButton>
					</div>
					<p className="text-xs text-ink-3">
						Hiding a category takes it out of the picker's pills; its items stay
						on the menu under the category name.
					</p>
				</div>
			</Modal>

			<SidePanel
				open={panel?.kind === "happy"}
				onOpenChange={(o) => !o && close()}
				title="Happy hours"
				subtitle="A discount on drinks between set times, applied to each drink added in that window"
				icon={SunIcon}
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Close
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!happy.name.trim() || happy.days.length === 0}
							onClick={() =>
								run(
									() =>
										saveHappyHour(outlet.id, happy.id, {
											name: happy.name.trim(),
											from: happy.from,
											to: happy.to,
											days: happy.days.join(","),
											discountPct: happy.discountPct,
											active: happy.active,
										}),
									"Happy hour saved",
									(r) => {
										setHhs((h) =>
											h.some((x) => x.id === r.id)
												? h.map((x) => (x.id === r.id ? r : x))
												: [...h, r],
										);
										setHappy(emptyHappy());
									},
								)
							}
						>
							{happy.id ? "Save happy hour" : "Add happy hour"}
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					{hhs.length > 0 && (
						<ul className="divide-y divide-line rounded-control border border-line">
							{hhs.map((h) => (
								<li key={h.id}>
									<button
										type="button"
										onClick={() =>
											setHappy({
												id: h.id,
												name: h.name,
												from: h.from,
												to: h.to,
												days: h.days
													.toUpperCase()
													.split(",")
													.map((d) => d.trim())
													.filter(Boolean),
												discountPct: h.discountPct,
												active: h.active,
											})
										}
										className={cn(
											"flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle",
											happy.id === h.id && "bg-brand-soft/30",
										)}
									>
										<span className="min-w-0 flex-1">
											<span className="block text-[15px] font-semibold text-ink">
												{h.name}
											</span>
											<span className="block text-xs text-ink-3">
												{h.from} – {h.to} · {daysLabel(h.days)} ·{" "}
												{h.discountPct}% off
											</span>
										</span>
										<StatusPill tone={h.active ? "success" : "grey"}>
											{h.active ? "On" : "Off"}
										</StatusPill>
									</button>
								</li>
							))}
						</ul>
					)}
					<p className="text-[13px] font-semibold text-ink">
						{happy.id ? "Edit happy hour" : "Add a happy hour"}
					</p>
					<TextField
						label="Name"
						value={happy.name}
						onChange={(v) => setHappy({ ...happy, name: v })}
					/>
					<ToggleField
						label="On"
						checked={happy.active}
						onChange={(v) => setHappy({ ...happy, active: v })}
					/>
					<div className="grid grid-cols-2 gap-3">
						<TextField
							label="From"
							type="time"
							value={happy.from}
							onChange={(v) => setHappy({ ...happy, from: v })}
						/>
						<TextField
							label="To"
							type="time"
							value={happy.to}
							onChange={(v) => setHappy({ ...happy, to: v })}
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						{DAY_KEYS.map((d) => (
							<button
								key={d}
								type="button"
								onClick={() =>
									setHappy({
										...happy,
										days: happy.days.includes(d)
											? happy.days.filter((x) => x !== d)
											: [...happy.days, d],
									})
								}
								className={cn(
									"rounded-pill px-4 py-2 text-[13px] font-semibold",
									happy.days.includes(d)
										? "bg-brand text-white"
										: "bg-subtle text-ink-2 hover:text-ink",
								)}
							>
								{d.charAt(0) + d.slice(1).toLowerCase()}
							</button>
						))}
					</div>
					<TextField
						label="Discount (%)"
						type="number"
						value={String(happy.discountPct)}
						onChange={(v) =>
							setHappy({
								...happy,
								discountPct: Math.min(100, Math.max(0, Number(v) || 0)),
							})
						}
					/>
					<PanelSection title="Preview">
						<TotalsList
							rows={items
								.filter((m) => m.active !== false)
								.slice(0, 3)
								.map((m) => ({
									label: m.name,
									value: `${naira(m.price)} → ${naira(Math.round(m.price * (1 - happy.discountPct / 100)))}`,
								}))}
						/>
					</PanelSection>
					{happy.id && (
						<BigButton
							tone="ghost"
							className="self-start"
							onClick={() => setHappy(emptyHappy())}
						>
							New happy hour instead
						</BigButton>
					)}
				</div>
			</SidePanel>
		</>
	);
}

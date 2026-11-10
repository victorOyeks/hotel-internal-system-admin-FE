"use client";

import {
	ArchiveIcon,
	CalendarClockIcon,
	PencilIcon,
	PlusIcon,
	RotateCcwIcon,
	WalletIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import {
	ChoiceCards,
	FieldRow,
	MoneyField,
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import { fmtDay, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { useListParams } from "@hospio/ui/shared/list-params";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import {
	addExpenseCategory,
	cancelBill,
	changeExpenseCategory,
	payBill,
	saveBill,
	saveBudget,
} from "@hospio/api/actions/ml";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	BillRow,
	BudgetView,
	ExpenseCategoryRow,
} from "@hospio/api/data/ml-types";
import type { PageResult } from "@hospio/api/data/paging";
import { cn } from "@hospio/ui/utils";

const monthLabel = (m: string) =>
	new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-GB", {
		month: "long",
		year: "numeric",
		timeZone: "Africa/Lagos",
	});
const REPEATS: Record<BillRow["repeats"], string> = {
	NONE: "Once",
	WEEKLY: "Every week",
	MONTHLY: "Every month",
};
const PAID_FROM = [
	{ value: "BANK", label: "Bank", hint: "Transfer or cheque" },
	{ value: "CASH", label: "Cash", hint: "From the safe" },
	{ value: "TILL", label: "A till", hint: "Your open till" },
];

/** Budget against actual: one bar per category, spent of budget, red when over. */
export function BudgetList({
	budget,
	empty,
}: {
	budget: BudgetView | null;
	empty?: React.ReactNode;
}) {
	const rows = (budget?.rows ?? []).filter((r) => r.budget > 0 || r.spent > 0);
	if (!budget)
		return (
			<EmptyState title="Budgets didn't load" hint="Try again in a moment." />
		);
	if (rows.length === 0)
		return (
			<>
				{empty ?? (
					<EmptyState
						title="No budgets or spending this month"
						hint="Set a monthly budget per category."
					/>
				)}
			</>
		);
	return (
		<div className="flex flex-col gap-3">
			{rows.map((b) => {
				const pct =
					b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : null;
				return (
					<div
						key={b.category}
						className="flex flex-col gap-1"
						data-testid="budget-row"
					>
						<div className="flex items-center justify-between gap-3 text-[13px]">
							<span className="font-medium text-ink">{b.label}</span>
							<span
								className={cn(
									"text-xs",
									pct !== null && pct > 100
										? "font-semibold text-danger"
										: "text-ink-3",
								)}
							>
								{pct === null ? "No budget" : `${pct}%`}{" "}
								<span className="font-semibold text-ink">
									{nairaShort(b.spent)}
									{b.budget > 0 ? ` of ${nairaShort(b.budget)}` : " spent"}
								</span>
							</span>
						</div>
						<ProgressBar
							value={b.spent}
							max={b.budget > 0 ? b.budget : b.spent}
							tone={
								pct === null || pct > 100
									? "danger"
									: pct >= 95
										? "warning"
										: "brand"
							}
						/>
					</div>
				);
			})}
			<p className="flex justify-between border-t border-line pt-2 text-[13px]">
				<span className="text-ink-2">Total</span>
				<span className="font-semibold text-ink" data-testid="budget-total">
					{naira(budget.totals.spent)} of {naira(budget.totals.budget)}
				</span>
			</p>
		</div>
	);
}

/**
 * Categories & budgets (manager): the hotel's expense categories (add, rename, archive; the expense form, the filters and the
 * reports read this list) and a monthly budget per category, against what was spent.
 */
export function CategoriesBudgetsPanel({
	open,
	onClose,
	categories,
	budget,
	month,
	onMonth,
}: {
	open: boolean;
	onClose: () => void;
	categories: ExpenseCategoryRow[];
	budget: BudgetView | null;
	month: string;
	onMonth: (m: string) => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [amounts, setAmounts] = useState<Record<string, number | "">>({});
	const [label, setLabel] = useState("");
	const [renaming, setRenaming] = useState<ExpenseCategoryRow | null>(null);
	const [rename, setRename] = useState("");
	useEffect(() => {
		setAmounts(
			Object.fromEntries(
				(budget?.rows ?? []).map((r) => [r.category, r.budget || ""]),
			),
		);
	}, [budget]);
	const byCode = new Map((budget?.rows ?? []).map((r) => [r.category, r]));
	const changed = categories.filter(
		(c) =>
			c.active &&
			(amounts[c.code] === "" ? 0 : (amounts[c.code] ?? 0)) !==
				(byCode.get(c.code)?.budget ?? 0),
	);

	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Categories & budgets"
			subtitle="What money is spent on, and how much each may take a month"
			icon={WalletIcon}
			width="lg"
			footerInfo={
				changed.length
					? `${plural(changed.length, "budget")} changed`
					: undefined
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Close
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || changed.length === 0}
						onClick={() =>
							run(
								async () => {
									for (const c of changed) {
										const r = await saveBudget({
											category: c.code,
											month,
											amount:
												amounts[c.code] === ""
													? 0
													: Number(amounts[c.code] ?? 0),
										});
										if (!r.ok) return r;
									}
									return { ok: true as const, data: null };
								},
								`Budgets for ${monthLabel(month)} saved`,
								() => router.refresh(),
							)
						}
					>
						Save budgets
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-6">
				<PanelSection title={`Budgets · ${monthLabel(month)}`}>
					<div className="flex flex-col gap-3">
						<TextField
							label="Month"
							type="month"
							value={month}
							onChange={(v) => v && onMonth(v)}
						/>
						<ul className="divide-y divide-line rounded-control border border-line">
							{categories
								.filter((c) => c.active)
								.map((c) => {
									const row = byCode.get(c.code);
									return (
										<li
											key={c.id}
											className="grid grid-cols-[1fr_150px] items-center gap-3 px-3 py-2"
										>
											<div className="min-w-0">
												<p className="truncate text-[13px] font-medium text-ink">
													{c.label}
												</p>
												<p className="text-xs text-ink-3">
													Spent {naira(row?.spent ?? 0)}
												</p>
											</div>
											<MoneyField
												label=""
												value={amounts[c.code] ?? ""}
												onChange={(v) =>
													setAmounts({ ...amounts, [c.code]: v })
												}
											/>
										</li>
									);
								})}
						</ul>
					</div>
				</PanelSection>
				<PanelSection title="Expense categories">
					<div className="flex flex-col gap-3">
						<div className="flex items-end gap-2">
							<TextField
								className="flex-1"
								label="New category"
								value={label}
								onChange={setLabel}
								placeholder="e.g. Generator servicing"
							/>
							<Button
								className={btn.primary}
								disabled={pending || !label.trim()}
								onClick={() =>
									run(
										() => addExpenseCategory(label),
										(c) => `${c.label} added`,
										() => {
											setLabel("");
											router.refresh();
										},
									)
								}
							>
								<PlusIcon className="size-4" /> Add
							</Button>
						</div>
						<ul className="divide-y divide-line rounded-control border border-line">
							{categories.map((c) => (
								<li
									key={c.id}
									className="flex items-center gap-3 px-3 py-2 text-[13px]"
								>
									<span
										className={cn(
											"flex-1",
											c.active ? "text-ink" : "text-ink-3 line-through",
										)}
									>
										{c.label}
									</span>
									{!c.active && (
										<StatusPill tone="grey" dot={false}>
											Archived
										</StatusPill>
									)}
									<button
										type="button"
										aria-label={`Rename ${c.label}`}
										className="rounded-md p-1 text-ink-3 hover:bg-subtle hover:text-ink"
										onClick={() => {
											setRenaming(c);
											setRename(c.label);
										}}
									>
										<PencilIcon className="size-4" />
									</button>
									{c.code !== "OTHER" && (
										<button
											type="button"
											aria-label={
												c.active
													? `Archive ${c.label}`
													: `Bring back ${c.label}`
											}
											className="rounded-md p-1 text-ink-3 hover:bg-subtle hover:text-ink"
											disabled={pending}
											onClick={() =>
												run(
													() =>
														changeExpenseCategory(c.id, { active: !c.active }),
													c.active
														? `${c.label} archived · past expenses keep it`
														: `${c.label} is back`,
													() => router.refresh(),
												)
											}
										>
											{c.active ? (
												<ArchiveIcon className="size-4" />
											) : (
												<RotateCcwIcon className="size-4" />
											)}
										</button>
									)}
								</li>
							))}
						</ul>
						<Note tone="info">
							Renaming keeps every past expense in the category. Archived
							categories leave the expense form but stay on past expenses and
							reports.
						</Note>
					</div>
				</PanelSection>
			</div>
			<Modal
				open={!!renaming}
				onOpenChange={(o) => !o && setRenaming(null)}
				title={`Rename ${renaming?.label ?? ""}`}
				icon={PencilIcon}
				size="confirm"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setRenaming(null)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={
								pending || !rename.trim() || rename.trim() === renaming?.label
							}
							onClick={() =>
								renaming &&
								run(
									() =>
										changeExpenseCategory(renaming.id, {
											label: rename.trim(),
										}),
									`Renamed to ${rename.trim()}`,
									() => {
										setRenaming(null);
										router.refresh();
									},
								)
							}
						>
							Rename
						</Button>
					</>
				}
			>
				<TextField label="Name" value={rename} onChange={setRename} />
			</Modal>
		</SidePanel>
	);
}

/** The next unpaid bills (overview card): overdue first, then by due date. */
export function BillsCard({
	bills,
	onOpen,
	onAdd,
}: {
	bills: BillRow[];
	onOpen: (b: BillRow) => void;
	onAdd: () => void;
}) {
	return bills.length === 0 ? (
		<div className="flex flex-col items-start gap-2 py-2">
			<p className="text-[13px] text-ink-3">No bills waiting to be paid.</p>
			<button
				type="button"
				onClick={onAdd}
				className="text-[13px] font-semibold text-brand hover:underline"
			>
				+ Add a bill
			</button>
		</div>
	) : (
		bills.map((b) => (
			<button
				key={b.id}
				type="button"
				onClick={() => onOpen(b)}
				className="flex w-full items-center justify-between border-b border-line py-2 text-left text-[13px] last:border-b-0 hover:bg-subtle/40"
			>
				<div>
					<p className="font-medium text-ink">{b.payee}</p>
					<p
						className={cn(
							"text-xs",
							b.overdue ? "font-semibold text-danger" : "text-ink-3",
						)}
					>
						{b.overdue
							? `Overdue · was due ${fmtDay(b.dueDate)}`
							: `Due ${fmtDay(b.dueDate)}`}{" "}
						· {b.categoryLabel}
					</p>
				</div>
				<span className="font-semibold text-ink">{naira(b.amount)}</span>
			</button>
		))
	);
}

const billTone = (b: BillRow) =>
	b.status === "PAID" ? (
		<StatusPill tone="success">Paid</StatusPill>
	) : b.status === "CANCELLED" ? (
		<StatusPill tone="grey">Cancelled</StatusPill>
	) : b.overdue ? (
		<StatusPill tone="danger">Overdue</StatusPill>
	) : (
		<StatusPill tone="warning">To pay</StatusPill>
	);

/** Bills tab: every bill, paged by finance-service (status tabs, search on payee and note, newest due first for paid ones). */
export function BillsTab({
	result,
	onOpen,
}: {
	result: PageResult<BillRow>;
	onOpen: (b: BillRow) => void;
}) {
	const router = useRouter();
	const list$ = useListParams({ extra: ["tab"] });
	const page = result.data;
	const c = (k: string) => page.counts?.[k] ?? 0;
	return (
		<>
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "", label: "All", count: c("all") },
							{ key: "UNPAID", label: "To pay", count: c("UNPAID") },
							{ key: "OVERDUE", label: "Overdue", count: c("OVERDUE") },
							{ key: "PAID", label: "Paid", count: c("PAID") },
							{ key: "CANCELLED", label: "Cancelled", count: c("CANCELLED") },
						]}
						value={list$.params.status ?? ""}
						onChange={(k) => list$.set({ status: k || null, tab: "bills" })}
					/>
				}
				right={
					<>
						<span className="text-xs text-ink-3">
							To pay {naira(Number(page.totals?.unpaid ?? 0))} · overdue{" "}
							{naira(Number(page.totals?.overdue ?? 0))}
						</span>
						<SearchBox
							value={list$.search}
							onChange={list$.setSearch}
							placeholder="Supplier or note"
						/>
					</>
				}
			/>
			<DataTable
				data={page.content}
				server={{ page, onPage: list$.goTo }}
				filtered={!!list$.params.q || !!list$.params.status}
				onClearFilters={() =>
					list$.set({ q: null, status: null, tab: "bills" })
				}
				error={result.ok ? null : result.error}
				onRetry={() => router.refresh()}
				onRowClick={onOpen}
				emptyTitle="No bills"
				emptyHint="Add the hotel's regular payables: power, internet, rent, suppliers."
				columns={[
					{
						accessorKey: "payee",
						header: "Bill",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.payee}
								secondary={`${row.original.categoryLabel} · ${REPEATS[row.original.repeats]}`}
							/>
						),
					},
					{
						accessorKey: "dueDate",
						header: "Due",
						cell: ({ row }) => (
							<span className="text-ink-2">{fmtDay(row.original.dueDate)}</span>
						),
					},
					{
						accessorKey: "amount",
						header: "Amount",
						cell: ({ row }) => (
							<span className="font-semibold text-ink">
								{naira(row.original.amount)}
							</span>
						),
					},
					{
						accessorKey: "status",
						header: "Status",
						cell: ({ row }) => billTone(row.original),
					},
				]}
			/>
		</>
	);
}

/** Add or change a bill; open one to pay or cancel it. */
export function BillPanel({
	bill,
	adding,
	categories,
	canWrite,
	onClose,
}: {
	bill: BillRow | null;
	adding: boolean;
	categories: ExpenseCategoryRow[];
	canWrite: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const today = new Date().toLocaleDateString("en-CA", {
		timeZone: "Africa/Lagos",
	});
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState({
		payee: "",
		category: "",
		amount: "" as number | "",
		dueDate: today,
		repeats: "MONTHLY",
		note: "",
	});
	const [paying, setPaying] = useState(false);
	const [paidFrom, setPaidFrom] = useState("BANK");
	const [cancelling, setCancelling] = useState(false);
	useEffect(() => {
		setEditing(adding);
		setForm(
			bill
				? {
						payee: bill.payee,
						category: bill.category,
						amount: bill.amount,
						dueDate: bill.dueDate,
						repeats: bill.repeats,
						note: bill.note ?? "",
					}
				: {
						payee: "",
						category: "",
						amount: "",
						dueDate: today,
						repeats: "MONTHLY",
						note: "",
					},
		);
	}, [bill, adding, today]);
	const open = adding || !!bill;
	const active = categories.filter((c) => c.active || c.code === form.category);
	const valid =
		form.payee.trim() &&
		form.category &&
		form.amount !== "" &&
		form.amount > 0 &&
		form.dueDate;
	const done = () => {
		router.refresh();
		onClose();
	};

	return (
		<>
			<SidePanel
				open={open && !paying && !cancelling}
				onOpenChange={(o) => !o && onClose()}
				title={adding ? "Add a bill" : (bill?.payee ?? "")}
				subtitle={
					adding
						? "A supplier or utility the hotel pays, once or on repeat"
						: bill
							? `${bill.categoryLabel} · ${REPEATS[bill.repeats]}`
							: undefined
				}
				icon={CalendarClockIcon}
				footer={
					editing ? (
						<>
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => (adding ? onClose() : setEditing(false))}
							>
								Cancel
							</Button>
							<Button
								className={btn.primary}
								disabled={pending || !valid}
								onClick={() =>
									form.amount !== "" &&
									run(
										() =>
											saveBill(
												{ ...form, amount: form.amount as number },
												bill?.id,
											),
										(b) =>
											bill
												? `${b.payee} saved`
												: `${b.payee} added · due ${fmtDay(b.dueDate)}`,
										done,
									)
								}
							>
								{adding ? "Add bill" : "Save"}
							</Button>
						</>
					) : bill && bill.status === "UNPAID" && canWrite ? (
						<>
							<Button
								variant="outline"
								className={btn.dangerSoft}
								onClick={() => setCancelling(true)}
							>
								Cancel bill
							</Button>
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => setEditing(true)}
							>
								Edit
							</Button>
							<Button className={btn.primary} onClick={() => setPaying(true)}>
								Mark paid
							</Button>
						</>
					) : (
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={onClose}
						>
							Close
						</Button>
					)
				}
			>
				{editing ? (
					<div className="flex flex-col gap-4">
						<TextField
							label="Who it is paid to"
							value={form.payee}
							onChange={(v) => setForm({ ...form, payee: v })}
							placeholder="e.g. Ikeja Electric"
							required
						/>
						<SelectField
							label="Category"
							value={form.category}
							onChange={(v) => setForm({ ...form, category: v })}
							options={active.map((c) => ({ value: c.code, label: c.label }))}
							required
						/>
						<FieldRow>
							<MoneyField
								label="Amount"
								value={form.amount}
								onChange={(v) => setForm({ ...form, amount: v })}
								required
							/>
							<TextField
								label="Due"
								type="date"
								value={form.dueDate}
								onChange={(v) => setForm({ ...form, dueDate: v })}
								required
							/>
						</FieldRow>
						<ChoiceCards
							label="Repeats"
							value={form.repeats}
							onChange={(v) => setForm({ ...form, repeats: v })}
							columns={3}
							options={[
								{ value: "NONE", label: "Once" },
								{ value: "WEEKLY", label: "Weekly" },
								{ value: "MONTHLY", label: "Monthly" },
							]}
						/>
						<TextareaField
							label="Note"
							value={form.note}
							onChange={(v) => setForm({ ...form, note: v })}
							placeholder="Account number, meter, invoice…"
							rows={2}
						/>
					</div>
				) : bill ? (
					<div className="flex flex-col gap-4">
						<div className="flex items-center justify-between">
							{billTone(bill)}
							<span className="text-xl font-bold text-ink">
								{naira(bill.amount)}
							</span>
						</div>
						<ul className="flex flex-col gap-2 text-[13px]">
							<li className="flex justify-between">
								<span className="text-ink-3">Due</span>
								<span className="text-ink">{fmtDay(bill.dueDate)}</span>
							</li>
							<li className="flex justify-between">
								<span className="text-ink-3">Repeats</span>
								<span className="text-ink">{REPEATS[bill.repeats]}</span>
							</li>
							{bill.note && (
								<li className="flex justify-between gap-4">
									<span className="text-ink-3">Note</span>
									<span className="text-right text-ink">{bill.note}</span>
								</li>
							)}
							{bill.status === "PAID" && (
								<li className="flex justify-between">
									<span className="text-ink-3">Paid</span>
									<span className="text-ink">
										{bill.paidAt ? fmtDay(bill.paidAt.slice(0, 10)) : ""}{" "}
										{bill.paidBy ? `by ${bill.paidBy}` : ""}{" "}
										{bill.paidFrom
											? `· from ${bill.paidFrom.toLowerCase()}`
											: ""}
									</span>
								</li>
							)}
							{bill.createdBy && (
								<li className="flex justify-between">
									<span className="text-ink-3">Added by</span>
									<span className="text-ink">{bill.createdBy}</span>
								</li>
							)}
						</ul>
						{bill.status === "PAID" && (
							<Note tone="success">
								Recorded as a paid expense of {naira(bill.amount)} under{" "}
								{bill.categoryLabel}.
							</Note>
						)}
					</div>
				) : null}
			</SidePanel>

			<Modal
				open={paying && !!bill}
				onOpenChange={(o) => !o && setPaying(false)}
				title={`Pay ${bill?.payee ?? ""}`}
				subtitle={
					bill
						? `${naira(bill.amount)} · due ${fmtDay(bill.dueDate)}`
						: undefined
				}
				icon={WalletIcon}
				size="confirm"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setPaying(false)}
						>
							Back
						</Button>
						<Button
							className={btn.primary}
							disabled={pending}
							onClick={() =>
								bill &&
								run(
									() => payBill(bill.id, paidFrom),
									(r) =>
										`${bill.payee} paid · ${naira(r.expenseAmount)} recorded as an expense${r.next ? ` · next due ${fmtDay(r.next.dueDate)}` : ""}`,
									() => {
										setPaying(false);
										done();
									},
								)
							}
						>
							Mark paid
						</Button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<ChoiceCards
						label="Paid from"
						value={paidFrom}
						onChange={setPaidFrom}
						columns={3}
						options={PAID_FROM}
					/>
					<WhatHappens
						items={[
							`A paid expense of ${naira(bill?.amount ?? 0)} is recorded under ${bill?.categoryLabel ?? "its category"}`,
							bill?.repeats !== "NONE"
								? `The next one is added, due ${bill?.repeats === "WEEKLY" ? "a week" : "a month"} later`
								: "The bill is closed",
							...(paidFrom === "TILL"
								? ["The cash comes out of your open till"]
								: []),
						]}
					/>
				</div>
			</Modal>
			<ConfirmModal
				open={cancelling && !!bill}
				onOpenChange={(o) => !o && setCancelling(false)}
				title={`Cancel ${bill?.payee ?? ""}?`}
				subtitle="It won't be paid and no expense is recorded"
				tone="danger"
				confirmLabel="Cancel bill"
				pending={pending}
				onConfirm={() =>
					bill &&
					run(
						() => cancelBill(bill.id),
						`${bill.payee} cancelled`,
						() => {
							setCancelling(false);
							done();
						},
					)
				}
			/>
		</>
	);
}

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClockIcon,
	CoinsIcon,
	PencilIcon,
	ReceiptIcon,
	SendIcon,
	SparklesIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import {
	generateStatements,
	loadFeeRules,
	loadStatement,
	recordFeePayment,
	saveFeeRule,
	sendFeeStatement,
} from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	FeeRuleRow,
	FeeStatementItem,
	GenerateStatementsResult,
	Paged,
} from "@hospio/api/data/admin-types";
import { feeModelLabels } from "@hospio/api/data/mappers/tenant";
import type { BusinessRow } from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	MoneyField,
	SelectField,
	TextField,
} from "@hospio/ui/shared/field";
import {
	fmtLongDate,
	fmtWhen,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	Loading,
	monthOptions,
	ServerPager,
	thisMonth,
	useFilterParam,
	useLoaded,
	usePageParam,
	useRefresh,
} from "./live";
import { can, ReadOnlyNote } from "./shared";

const statusTone = {
	DUE: "warning",
	PART_PAID: "info",
	PAID: "success",
	OVERDUE: "danger",
} as const;
const statusLabel = {
	DUE: "Due",
	PART_PAID: "Part paid",
	PAID: "Paid",
	OVERDUE: "Overdue",
} as const;
const monthLabel = (m: string) => {
	const [y, mo] = m.split("-").map(Number);
	return new Date(y, (mo ?? 1) - 1, 1).toLocaleDateString("en-GB", {
		month: "long",
		year: "numeric",
	});
};

/**
 * Admin — D1 · Fees & billing (Figma 3305:3841): statements from GET /platform/admin/fees/statements,
 * filtered and paged on the server; the panel (D4) loads lines and payments; Record payment (D5), Send
 * statement, Generate this month and the fee model (D2/D3) write to platform-service.
 */
export function FeesScreen({
	role,
	statements,
	open: openStatements,
	monthly,
	businesses,
}: {
	role: AdminRole;
	statements: Paged<FeeStatementItem>;
	open: FeeStatementItem[];
	monthly: FeeStatementItem[];
	businesses: BusinessRow[];
}) {
	const [tab, setTab] = useFilterParam("status");
	const [month, setMonth] = useFilterParam("month");
	const [biz, setBiz] = useFilterParam("businessId");
	const [, setPage] = usePageParam();
	const [open, setOpen] = useQueryState("open");
	const [model, setModel] = useQueryState("model");
	const [generate, setGenerate] = useState(false);
	const [search, setSearch] = useState("");
	const { refresh } = useRefresh();
	const money = can.money(role);
	const active = tab || "ALL";
	const due = openStatements.reduce((a, s) => a + s.outstanding, 0);
	const overdue = openStatements
		.filter((s) => s.status === "OVERDUE")
		.reduce((a, s) => a + s.outstanding, 0);
	const collected = monthly.reduce((a, s) => a + s.paidAmount, 0);
	const mrr = monthly.reduce((a, s) => a + s.feeAmount, 0);
	const bizName = useMemo(
		() => new Map(businesses.map((b) => [b.id, b])),
		[businesses],
	);

	const columns: ColumnDef<FeeStatementItem, unknown>[] = [
		{
			accessorKey: "businessName",
			header: "Business",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.businessName}
					secondary={bizName.get(row.original.businessId)?.feeModel ?? ""}
				/>
			),
		},
		{
			accessorKey: "month",
			header: "Month",
			cell: ({ row }) => monthLabel(row.original.month),
		},
		{
			accessorKey: "baseAmount",
			header: "Base",
			cell: ({ row }) => (
				<span className="text-ink-2">{naira(row.original.baseAmount)}</span>
			),
		},
		{
			accessorKey: "feeAmount",
			header: "Fee",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.feeAmount)}</span>
			),
		},
		{
			accessorKey: "paidAmount",
			header: "Paid",
			cell: ({ row }) => naira(row.original.paidAmount),
		},
		{
			accessorKey: "outstanding",
			header: "Balance",
			cell: ({ row }) => (
				<span
					className={cn(
						row.original.outstanding > 0 && "font-semibold text-danger",
					)}
				>
					{naira(row.original.outstanding)}
				</span>
			),
		},
		{
			accessorKey: "dueOn",
			header: "Due",
			cell: ({ row }) => (
				<span className="text-ink-3">
					{row.original.dueOn ? fmtLongDate(row.original.dueOn) : "—"}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={statusTone[row.original.status]}>
					{statusLabel[row.original.status]}
				</StatusPill>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Fees & billing"
				subtitle="Monthly statements per business · due on the 5th, overdue after the grace days in Settings"
			>
				{money && (
					<button
						type="button"
						onClick={() => setGenerate(true)}
						className={cn(btn.secondary, "flex items-center gap-2")}
					>
						<SparklesIcon className="size-4" /> Generate this month
					</button>
				)}
				{money && (
					<button
						type="button"
						onClick={() => setModel(biz || businesses[0]?.id || "")}
						className={cn(btn.secondary, "flex items-center gap-2")}
					>
						<PencilIcon className="size-4" /> Fee models
					</button>
				)}
			</PageHeader>
			{!money && (
				<ReadOnlyNote>
					Support can see statements. Recording payments, sending statements and
					fee models are for Finance admin.
				</ReadOnlyNote>
			)}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Due now"
					value={nairaShort(due)}
					icon={ClockIcon}
					hint={plural(openStatements.length, "open statement")}
				/>
				<KpiCard
					label="Overdue"
					value={nairaShort(overdue)}
					icon={AlertTriangleIcon}
					pill={
						overdue > 0 ? (
							<StatusPill tone="danger">
								{openStatements.filter((s) => s.status === "OVERDUE").length}
							</StatusPill>
						) : undefined
					}
				/>
				<KpiCard
					label={`Collected · ${monthLabel(thisMonth()).split(" ")[0]}`}
					value={nairaShort(collected)}
					icon={CheckCircle2Icon}
					hint={plural(monthly.length, "statement")}
				/>
				<KpiCard
					label="Monthly fees (MRR)"
					value={nairaShort(mrr)}
					icon={CoinsIcon}
					hint="This month's statements"
				/>
			</div>
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "ALL", label: "All" },
							{ key: "DUE", label: "Due" },
							{ key: "PART_PAID", label: "Part paid" },
							{ key: "OVERDUE", label: "Overdue" },
							{ key: "PAID", label: "Paid" },
						]}
						value={active}
						onChange={(k) => {
							setTab(k === "ALL" ? null : k);
							setPage(0);
						}}
					/>
				}
				right={
					<>
						<FilterSelect
							value={month}
							onChange={(v) => {
								setMonth(v);
								setPage(0);
							}}
							all="All months"
							options={monthOptions(14)}
						/>
						<FilterSelect
							value={biz}
							onChange={(v) => {
								setBiz(v);
								setPage(0);
							}}
							all="All businesses"
							options={businesses.map((b) => ({ value: b.id, label: b.name }))}
						/>
						<SearchBox
							value={search}
							onChange={setSearch}
							placeholder="Search this page…"
						/>
					</>
				}
			/>
			<DataTable
				columns={columns}
				data={statements.content}
				search={search}
				pageSize={statements.size}
				onRowClick={(s) => setOpen(s.id)}
				emptyTitle="No statements"
				emptyHint={
					money
						? "Generate this month's statements from the button above."
						: undefined
				}
				footer={<ServerPager page={statements} onPage={setPage} />}
			/>

			<StatementPanel
				id={open}
				business={bizName}
				canPay={money}
				onClose={() => void setOpen(null)}
				onChanged={refresh}
			/>
			<FeeModelModal
				open={!!model}
				onOpenChange={(o) => !o && void setModel(null)}
				businesses={businesses}
				initial={model ?? ""}
				onSaved={refresh}
			/>
			<GenerateModal
				open={generate}
				onOpenChange={setGenerate}
				businesses={businesses}
				defaultMonth={month || thisMonth()}
				onDone={refresh}
			/>
		</>
	);
}

function StatementPanel({
	id,
	business,
	canPay,
	onClose,
	onChanged,
}: {
	id: string | null;
	business: Map<string, BusinessRow>;
	canPay: boolean;
	onClose: () => void;
	onChanged: () => void;
}) {
	const {
		data: statement,
		setData,
		loading,
		error,
	} = useLoaded(id, loadStatement);
	const { run, pending } = useAction();
	const [pay, setPay] = useState(false);
	const [amount, setAmount] = useState<number | "">("");
	const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
	const [ref, setRef] = useState("");
	const biz = statement ? business.get(statement.businessId) : undefined;
	return (
		<SidePanel
			open={!!id}
			onOpenChange={(o) => !o && onClose()}
			title={
				statement
					? `${statement.businessName} · ${monthLabel(statement.month)}`
					: "Statement"
			}
			subtitle={
				statement ? (
					<span className="flex items-center gap-2">
						Fee statement{" "}
						<StatusPill tone={statusTone[statement.status]}>
							{statusLabel[statement.status]}
						</StatusPill>
						{statement.sentAt ? (
							<span>· sent {fmtWhen(statement.sentAt)}</span>
						) : null}
					</span>
				) : undefined
			}
			icon={ReceiptIcon}
			width="md"
			footerInfo={
				statement
					? statement.outstanding > 0
						? `${naira(statement.outstanding)} outstanding`
						: "Settled"
					: undefined
			}
			footer={
				statement && (
					<>
						{canPay && (
							<button
								type="button"
								className={cn(btn.secondary, "flex items-center gap-2")}
								disabled={pending}
								onClick={() =>
									run(
										() =>
											withDeliveries(
												sendFeeStatement(statement.id, statement),
												`Statement for ${statement.businessName}`,
											),
										"Statement sent",
										(r) => {
											setData({ ...statement, sentAt: r.sentAt });
											onChanged();
										},
									)
								}
							>
								<SendIcon className="size-4" />{" "}
								{statement.sentAt ? "Send again" : "Send statement"}
							</button>
						)}
						{statement.outstanding > 0 && canPay && (
							<button
								type="button"
								className={btn.primary}
								onClick={() => {
									setAmount(statement.outstanding);
									setPay(true);
								}}
							>
								Record payment
							</button>
						)}
					</>
				)
			}
		>
			{loading && <Loading />}
			{error && <Note tone="danger">{error}</Note>}
			{statement && (
				<div className="flex flex-col gap-5">
					<DetailList
						columns={2}
						items={[
							{ label: "Owner", value: biz?.ownerName ?? "—" },
							{ label: "Fee model", value: biz?.feeModel ?? "—" },
							{
								label: "Due date",
								value: statement.dueOn ? fmtLongDate(statement.dueOn) : "—",
							},
							{ label: "Account manager", value: biz?.accountManager ?? "—" },
						]}
					/>
					<PanelSection title="Lines">
						<TotalsList
							rows={[
								...statement.lines.map((l) => ({
									label: `${l.hotelName} · base ${naira(l.base)}`,
									value: naira(l.fee),
								})),
								{
									label: "Fee",
									value: naira(statement.feeAmount),
									strong: statement.lines.length > 0,
								},
								{
									label: "Paid",
									value: naira(statement.paidAmount),
									tone: "success" as const,
								},
								{
									label: "Balance",
									value: naira(statement.outstanding),
									strong: true,
									tone:
										statement.outstanding > 0 ? ("danger" as const) : undefined,
								},
							]}
						/>
					</PanelSection>
					<PanelSection title="Payments">
						{statement.payments.length === 0 ? (
							<p className="text-sm text-ink-3">Nothing recorded yet.</p>
						) : (
							<ul className="divide-y divide-line rounded-xl border border-line">
								{statement.payments.map((p) => (
									<li
										key={p.id}
										className="flex items-center gap-3 px-4 py-[10px]"
									>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{naira(p.amount)}
											</p>
											<p className="text-xs text-ink-3">
												{p.paidOn ? fmtLongDate(p.paidOn) : "—"} ·{" "}
												{p.reference || "no reference"} · {p.recordedBy}
											</p>
										</div>
									</li>
								))}
							</ul>
						)}
					</PanelSection>
					{statement.status === "OVERDUE" && (
						<Note tone="danger">
							Overdue. The business is flagged on the dashboard; Support may
							suspend it after repeated misses.
						</Note>
					)}
				</div>
			)}

			<Modal
				open={pay}
				onOpenChange={setPay}
				title="Record fee payment"
				subtitle={
					statement
						? `${statement.businessName} · ${monthLabel(statement.month)}`
						: undefined
				}
				icon={CoinsIcon}
				size="form"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setPay(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={!amount || pending || !statement}
							onClick={() =>
								statement &&
								run(
									() =>
										recordFeePayment(
											statement.id,
											{
												amount: Number(amount),
												paidOn: paidOn || undefined,
												reference: ref || undefined,
											},
											statement,
										),
									`${naira(Number(amount))} recorded`,
									(s) => {
										setData(s);
										setPay(false);
										setRef("");
										onChanged();
									},
								)
							}
						>
							Record {amount ? naira(Number(amount)) : ""}
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<MoneyField
						label="Amount received"
						value={amount}
						onChange={setAmount}
						hint={
							statement ? `Balance ${naira(statement.outstanding)}` : undefined
						}
					/>
					<TextField
						label="Received on"
						type="date"
						value={paidOn}
						onChange={setPaidOn}
					/>
					<TextField
						label="Reference"
						value={ref}
						onChange={setRef}
						placeholder="Bank reference or settlement id"
					/>
				</div>
			</Modal>
		</SidePanel>
	);
}

const MODELS = [
	{
		value: "PER_ROOM_NIGHT",
		label: "Per room night",
		hint: "A fixed amount for every night sold",
	},
	{
		value: "PERCENT_OF_PAYMENTS",
		label: "% of guest payments",
		hint: "Grows with what the hotel takes",
	},
	{
		value: "PERCENT_OF_BOOKINGS",
		label: "% of bookings",
		hint: "On the booking value",
	},
] as const;

function FeeModelModal({
	open,
	onOpenChange,
	businesses,
	initial,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	businesses: BusinessRow[];
	initial: string;
	onSaved: () => void;
}) {
	const { run, pending } = useAction();
	const [bizId, setBizId] = useState(initial || businesses[0]?.id || "");
	const [rules, setRules] = useState<FeeRuleRow[] | null>(null);
	const [model, setModel] =
		useState<(typeof MODELS)[number]["value"]>("PER_ROOM_NIGHT");
	const [value, setValue] = useState("");
	const [from, setFrom] = useState(`${thisMonth()}-01`);
	useEffect(() => {
		if (initial) setBizId(initial);
	}, [initial]);
	useEffect(() => {
		if (!open || !bizId) return;
		setRules(null);
		loadFeeRules(bizId).then((r) => {
			if (!r.ok) return;
			setRules(r.data);
			const current = r.data[r.data.length - 1];
			const b = businesses.find((x) => x.id === bizId);
			const key = current?.model ?? b?.feeModelKey;
			if (
				key === "PERCENT_OF_PAYMENTS" ||
				key === "PERCENT_OF_BOOKINGS" ||
				key === "PER_ROOM_NIGHT"
			)
				setModel(key);
			setValue(String(current?.value ?? b?.feeValue ?? ""));
		});
	}, [open, bizId, businesses]);
	const isPct = model !== "PER_ROOM_NIGHT";
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Fee model"
			subtitle="How a business is charged each month · a new rule starts from the date given and never touches a statement already issued"
			icon={PencilIcon}
			size="form"
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={pending || !bizId || !value || !from}
						onClick={() =>
							run(
								() =>
									saveFeeRule({
										businessId: bizId,
										model,
										value: Number(value),
										startsOn: from,
									}),
								"Fee model saved",
								() => {
									onOpenChange(false);
									onSaved();
								},
							)
						}
					>
						Save model
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Business"
					value={bizId}
					onChange={setBizId}
					options={businesses.map((b) => ({
						value: b.id,
						label: b.name,
						hint: `${b.rooms} rooms · ${b.feeModel}`,
					}))}
				/>
				{rules === null ? (
					<Loading label="Loading current rules…" />
				) : rules.length > 0 ? (
					<PanelSection title="Rules so far">
						<ul className="divide-y divide-line rounded-xl border border-line text-[13px]">
							{rules.map((r) => (
								<li
									key={r.id}
									className="flex items-center justify-between px-4 py-2"
								>
									<span>{feeModelLabels[r.model] ?? r.model}</span>
									<span className="text-ink-2">
										{r.model === "PER_ROOM_NIGHT"
											? naira(r.value)
											: `${r.value}%`}{" "}
										· from {r.startsOn ? fmtLongDate(r.startsOn) : "—"}
										{r.endsOn ? ` to ${fmtLongDate(r.endsOn)}` : ""}
									</span>
								</li>
							))}
						</ul>
					</PanelSection>
				) : (
					<Note tone="info">
						No fee rule yet. The business is not charged until one starts.
					</Note>
				)}
				<ChoiceCards
					value={model}
					onChange={setModel}
					columns={1}
					options={MODELS.map((m) => ({ ...m }))}
				/>
				{isPct ? (
					<TextField
						label="Share (%)"
						value={value}
						onChange={setValue}
						placeholder="2"
					/>
				) : (
					<MoneyField
						label="Fee per room night"
						value={value === "" ? "" : Number(value)}
						onChange={(v) => setValue(v === "" ? "" : String(v))}
					/>
				)}
				<TextField
					label="Applies from"
					type="date"
					value={from}
					onChange={setFrom}
				/>
			</div>
		</Modal>
	);
}

function GenerateModal({
	open,
	onOpenChange,
	businesses,
	defaultMonth,
	onDone,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	businesses: BusinessRow[];
	defaultMonth: string;
	onDone: () => void;
}) {
	const { run, pending } = useAction();
	const [month, setMonth] = useState(defaultMonth);
	const [bizId, setBizId] = useState("");
	const [result, setResult] = useState<GenerateStatementsResult | null>(null);
	useEffect(() => {
		if (open) {
			setMonth(defaultMonth);
			setResult(null);
		}
	}, [open, defaultMonth]);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Generate statements"
			subtitle="One statement per live business for the month, from its fee model; businesses that already have one are skipped"
			icon={SparklesIcon}
			size="form"
			footer={
				result ? (
					<button
						type="button"
						className={btn.primary}
						onClick={() => onOpenChange(false)}
					>
						Done
					</button>
				) : (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={pending || !month}
							onClick={() =>
								run(
									() =>
										generateStatements({
											month,
											businessId: bizId || undefined,
										}),
									"Statements generated",
									(r) => {
										setResult(r);
										onDone();
									},
								)
							}
						>
							Generate
						</button>
					</>
				)
			}
		>
			{result ? (
				<div className="flex flex-col gap-3">
					<TotalsList
						rows={[
							{ label: "Created", value: result.created, tone: "success" },
							{ label: "Skipped", value: result.skipped },
						]}
					/>
					{result.notes.length > 0 && (
						<ul className="list-disc space-y-1 pl-5 text-[13px] text-ink-2">
							{result.notes.map((note) => (
								<li key={note}>{note}</li>
							))}
						</ul>
					)}
				</div>
			) : (
				<div className="flex flex-col gap-4">
					<SelectField
						label="Month"
						value={month}
						onChange={setMonth}
						options={monthOptions(6)}
					/>
					<SelectField
						label="Only this business"
						value={bizId}
						onChange={setBizId}
						placeholder="Every live business"
						options={businesses.map((b) => ({ value: b.id, label: b.name }))}
						hint="Leave empty for every LIVE and AT_RISK business."
					/>
				</div>
			)}
		</Modal>
	);
}

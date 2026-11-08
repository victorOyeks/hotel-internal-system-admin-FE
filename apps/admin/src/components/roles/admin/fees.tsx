"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CoinsIcon, PencilIcon, ReceiptIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, MoneyField, SelectField, TextField } from "@hospio/ui/shared/field";
import { naira, nairaShort } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { BusinessRow, FeeStatementRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { cn } from "@hospio/ui/utils";
import { AlertTriangleIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";
import { can, ReadOnlyNote } from "./shared";

const statusTone = { DUE: "warning", PART_PAID: "info", PAID: "success", OVERDUE: "danger" } as const;
const statusLabel = { DUE: "Due", PART_PAID: "Part paid", PAID: "Paid", OVERDUE: "Overdue" } as const;

export function FeesScreen({ role, statements: initial, businesses }: { role: AdminRole; statements: FeeStatementRow[]; businesses: BusinessRow[] }) {
	const [statements, setStatements] = useState(initial);
	const [tab, setTab] = useQueryState("tab");
	const [open, setOpen] = useQueryState("open");
	const [model, setModel] = useQueryState("model");
	const [search, setSearch] = useState("");
	const [biz, setBiz] = useState("");
	const active = tab ?? "ALL";
	const money = can.money(role);
	const rows = useMemo(() => statements.filter((s) => (active === "ALL" ? true : active === "OPEN" ? s.status === "DUE" || s.status === "PART_PAID" : s.status === active)).filter((s) => !biz || s.businessName === biz), [statements, active, biz]);
	const selected = statements.find((s) => s.id === open) ?? null;
	const due = statements.filter((s) => s.status !== "PAID").reduce((a, s) => a + s.fee - s.paid, 0);
	const overdue = statements.filter((s) => s.status === "OVERDUE").reduce((a, s) => a + s.fee - s.paid, 0);
	const collectedThisMonth = statements.filter((s) => s.month === "2026-10" && s.paid > 0).reduce((a, s) => a + s.paid, 0);

	const columns: ColumnDef<FeeStatementRow, unknown>[] = [
		{ accessorKey: "businessName", header: "Business", cell: ({ row }) => <TwoLine primary={row.original.businessName} secondary={businesses.find((b) => b.name === row.original.businessName)?.feeModel ?? ""} /> },
		{ accessorKey: "month", header: "Month" },
		{ accessorKey: "base", header: "Base", cell: ({ row }) => (row.original.base > 5000 ? naira(row.original.base) : `${row.original.base} rooms`) },
		{ accessorKey: "fee", header: "Fee", cell: ({ row }) => <span className="font-semibold">{naira(row.original.fee)}</span> },
		{ accessorKey: "paid", header: "Paid", cell: ({ row }) => naira(row.original.paid) },
		{ id: "balance", header: "Balance", accessorFn: (r) => r.fee - r.paid, cell: ({ row }) => <span className={cn(row.original.fee - row.original.paid > 0 && "font-semibold text-danger")}>{naira(row.original.fee - row.original.paid)}</span> },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={statusTone[row.original.status]}>{statusLabel[row.original.status]}</StatusPill> },
	];

	return (
		<>
			<PageHeader title="Fees & billing" subtitle="Monthly statements per business · fees are due on the 5th, overdue after 10 days">
				<ExportButton label="Export statements" />
				{money && <button type="button" onClick={() => setModel(businesses[0]?.id ?? "")} className={cn(btn.secondary, "flex items-center gap-2")}><PencilIcon className="size-4" /> Fee models</button>}
			</PageHeader>
			{!money && <ReadOnlyNote>Support can see statements. Recording payments and changing fee models is for Finance admin.</ReadOnlyNote>}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Due now" value={nairaShort(due)} icon={ClockIcon} hint={`${statements.filter((s) => s.status !== "PAID").length} statements`} />
				<KpiCard label="Overdue" value={nairaShort(overdue)} icon={AlertTriangleIcon} pill={overdue > 0 ? <StatusPill tone="danger">{statements.filter((s) => s.status === "OVERDUE").length}</StatusPill> : undefined} />
				<KpiCard label="Collected · October" value={nairaShort(collectedThisMonth)} icon={CheckCircle2Icon} />
				<KpiCard label="Monthly fees (MRR)" value={nairaShort(businesses.reduce((a, b) => a + b.mrr, 0))} icon={CoinsIcon} hint="Live businesses" />
			</div>
			<Toolbar
				left={<PillTabs tabs={[{ key: "ALL", label: "All", count: statements.length }, { key: "OPEN", label: "Due", count: statements.filter((s) => s.status === "DUE" || s.status === "PART_PAID").length }, { key: "OVERDUE", label: "Overdue", count: statements.filter((s) => s.status === "OVERDUE").length }, { key: "PAID", label: "Paid", count: statements.filter((s) => s.status === "PAID").length }]} value={active} onChange={(k) => void setTab(k === "ALL" ? null : k)} />}
				right={<><FilterSelect value={biz} onChange={setBiz} all="All businesses" options={businesses.map((b) => ({ value: b.name, label: b.name }))} /><SearchBox value={search} onChange={setSearch} placeholder="Search…" /></>}
			/>
			<DataTable columns={columns} data={rows} search={search} onRowClick={(s) => setOpen(s.id)} emptyTitle="No statements" />

			<StatementPanel statement={selected} business={businesses.find((b) => b.name === selected?.businessName)} canPay={money} onClose={() => void setOpen(null)} onChange={(s) => setStatements((all) => all.map((x) => (x.id === s.id ? s : x)))} />
			<FeeModelModal open={!!model} onOpenChange={(o) => !o && void setModel(null)} businesses={businesses} initial={model ?? ""} />
		</>
	);
}

function StatementPanel({ statement, business, canPay, onClose, onChange }: { statement: FeeStatementRow | null; business?: BusinessRow; canPay: boolean; onClose: () => void; onChange: (s: FeeStatementRow) => void }) {
	const { run, pending } = useDemoAction();
	const [pay, setPay] = useState(false);
	const [amount, setAmount] = useState<number | "">("");
	const [method, setMethod] = useState("Bank transfer");
	const [ref, setRef] = useState("");
	if (!statement) return null;
	const balance = statement.fee - statement.paid;
	const perRoom = business?.feeModel.includes("%") ? null : business?.feeValue ?? 1500;
	const lines = perRoom ? [{ label: `${statement.base} rooms × ${naira(perRoom)}`, value: naira(statement.fee) }] : [{ label: `${business?.feeValue ?? 2}% of ${naira(statement.base)} room revenue`, value: naira(statement.fee) }];
	return (
		<SidePanel open onOpenChange={(o) => !o && onClose()} title={`${statement.businessName} · ${statement.month}`} subtitle={<span className="flex items-center gap-2">Fee statement <StatusPill tone={statusTone[statement.status]}>{statusLabel[statement.status]}</StatusPill></span>} icon={ReceiptIcon} width="md"
			footerInfo={balance > 0 ? `${naira(balance)} outstanding` : "Settled"}
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => run(`Statement emailed to ${business?.ownerEmail ?? "the owner"}`)}>Send statement</button>
					{balance > 0 && <button type="button" className={btn.secondary} onClick={() => run("Payment reminder sent on WhatsApp and email")}>Send reminder</button>}
					{balance > 0 && canPay && <button type="button" className={btn.primary} onClick={() => { setAmount(balance); setPay(true); }}>Record payment</button>}
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<DetailList columns={2} items={[{ label: "Owner", value: business?.ownerName ?? "—" }, { label: "Fee model", value: business?.feeModel ?? "—" }, { label: "Due date", value: `5 ${statement.month}` }, { label: "Account manager", value: business?.accountManager ?? "—" }]} />
				<PanelSection title="Lines">
					<TotalsList rows={[...lines, { label: "Paid", value: naira(statement.paid), tone: "success" }, { label: "Balance", value: naira(balance), strong: true, tone: balance > 0 ? "danger" : undefined }]} />
				</PanelSection>
				{statement.status === "OVERDUE" && <Note tone="danger">Overdue. After 30 days the business is flagged At risk; after 60 days Support may suspend it.</Note>}
			</div>

			<Modal open={pay} onOpenChange={setPay} title="Record fee payment" subtitle={`${statement.businessName} · ${statement.month}`} icon={CoinsIcon} size="form"
				footer={<><button type="button" className={btn.secondary} onClick={() => setPay(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!amount || pending} onClick={() => run(`${naira(Number(amount))} recorded`, () => { const paid = statement.paid + Number(amount); onChange({ ...statement, paid, status: paid >= statement.fee ? "PAID" : "PART_PAID" }); setPay(false); })}>Record {amount ? naira(Number(amount)) : ""}</button></>}
			>
				<div className="flex flex-col gap-4">
					<MoneyField label="Amount received" value={amount} onChange={setAmount} hint={`Balance ${naira(balance)}`} />
					<SelectField label="How it was paid" value={method} onChange={setMethod} options={["Bank transfer", "Deducted from POS settlement", "Card"]} />
					<TextField label="Reference" value={ref} onChange={setRef} placeholder="Bank reference or settlement id" />
				</div>
			</Modal>
		</SidePanel>
	);
}

function FeeModelModal({ open, onOpenChange, businesses, initial }: { open: boolean; onOpenChange: (o: boolean) => void; businesses: BusinessRow[]; initial: string }) {
	const { run, pending } = useDemoAction();
	const [bizId, setBizId] = useState(initial || businesses[0]?.id || "");
	const biz = businesses.find((b) => b.id === bizId);
	const [model, setModel] = useState<"ROOM" | "REVENUE">(biz?.feeModel.includes("%") ? "REVENUE" : "ROOM");
	const [perRoom, setPerRoom] = useState<number | "">(biz?.feeModel.includes("%") ? 1500 : biz?.feeValue || 1500);
	const [pct, setPct] = useState(String(biz?.feeModel.includes("%") ? biz.feeValue : 2));
	const [from, setFrom] = useState("2026-12");
	const preview = biz ? (model === "ROOM" ? Number(perRoom || 0) * biz.rooms : Math.round((Number(pct) / 100) * biz.rooms * 35000 * 20)) : 0;
	return (
		<Modal open={open} onOpenChange={onOpenChange} title="Fee model" subtitle="How a business is charged each month" icon={PencilIcon} size="form"
			footerInfo={biz ? `Estimated ${naira(preview)} / month from ${from}` : undefined}
			footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={pending} onClick={() => run(`Fee model saved for ${biz?.name} · owner notified`, () => onOpenChange(false))}>Save model</button></>}
		>
			<div className="flex flex-col gap-4">
				<SelectField label="Business" value={bizId} onChange={(v) => { setBizId(v); const b = businesses.find((x) => x.id === v); if (b) { setModel(b.feeModel.includes("%") ? "REVENUE" : "ROOM"); } }} options={businesses.map((b) => ({ value: b.id, label: b.name, hint: `${b.rooms} rooms · ${b.feeModel}` }))} />
				<ChoiceCards value={model} onChange={setModel} columns={2} options={[{ value: "ROOM", label: "Per room / month", hint: "Fixed, predictable" }, { value: "REVENUE", label: "% of room revenue", hint: "Grows with the hotel" }]} />
				{model === "ROOM" ? <MoneyField label="Fee per room per month" value={perRoom} onChange={setPerRoom} /> : <TextField label="Share of room revenue (%)" value={pct} onChange={setPct} />}
				<TextField label="Applies from month" value={from} onChange={setFrom} hint="Changes never apply to a statement already issued." />
			</div>
		</Modal>
	);
}

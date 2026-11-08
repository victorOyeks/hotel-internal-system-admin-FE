"use client";

import { ArrowRightLeftIcon, LockIcon, WalletIcon } from "lucide-react";
import { useState } from "react";
import { DetailList, Note, TotalsList } from "@/components/shared/detail-list";
import { MoneyField, SelectField, TextareaField } from "@/components/shared/field";
import { fmtWhen, naira } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { PaymentRow, StaffRow, TillRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";

/** Front office 6.1–6.4 · Till & handover. */
export function TillScreen({ tills: initial, payments, staff, me, role = "FRONT_OFFICE" }: { tills: TillRow[]; payments: PaymentRow[]; staff: StaffRow[]; me: string; role?: string }) {
	const [tills, setTills] = useState(initial.filter((t) => t.role === role));
	const [modal, setModal] = useState<"open" | "close" | "handover" | null>(null);
	const [float, setFloat] = useState<number | "">(50000);
	const [counted, setCounted] = useState<number | "">("");
	const [note, setNote] = useState("");
	const [toStaff, setToStaff] = useState("");
	const { run, pending } = useDemoAction();
	const open = tills.find((t) => t.status === "OPEN") ?? null;
	const cashToday = payments.filter((p) => p.method === "CASH" && p.status === "APPROVED" && p.role === role && p.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
	const variance = open && typeof counted === "number" ? counted - open.expected : 0;

	return (
		<>
			<PageHeader title="Till" subtitle={open ? `Open since ${fmtWhen(open.openedAt)} by ${open.openedBy}` : "Your till is closed · open it before taking cash"}>
				{open ? (
					<>
						<button type="button" className={btn.secondary} onClick={() => setModal("handover")}><ArrowRightLeftIcon className="mr-1 inline size-4" /> Hand over</button>
						<button type="button" className={btn.primary} onClick={() => setModal("close")}><LockIcon className="mr-1 inline size-4" /> Count & close</button>
					</>
				) : (
					<button type="button" className={btn.primary} onClick={() => setModal("open")}><WalletIcon className="mr-1 inline size-4" /> Open till</button>
				)}
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Opening float" value={open ? naira(open.openingFloat) : "—"} icon={WalletIcon} />
				<KpiCard label="Cash taken" value={open ? naira(open.cashIn) : "—"} icon={WalletIcon} hint={`${cashToday.length} cash payments today`} />
				<KpiCard label="Paid out" value={naira(0)} icon={WalletIcon} hint="Petty cash from this till" />
				<KpiCard label="Should be in the drawer" value={open ? naira(open.expected) : "—"} icon={LockIcon} pill={open ? <StatusPill tone="success">Open</StatusPill> : <StatusPill tone="grey">Closed</StatusPill>} />
			</div>
			<div className="grid gap-4 xl:grid-cols-2">
				<SectionCard title="Cash in this till" subtitle="Every cash payment since the till opened" flush>
					<ul className="divide-y divide-line">
						{cashToday.length === 0 && <li className="px-5 py-6 text-center text-sm text-ink-3">No cash yet.</li>}
						{cashToday.map((p) => (
							<li key={p.id} className="flex items-center gap-3 px-5 py-3 text-[13px]"><span className="w-20 text-ink-3">{fmtWhen(p.createdAt).replace("Today ", "")}</span><span className="flex-1 font-medium text-ink">{p.guestName} <span className="text-ink-3">· {p.description}</span></span><span className="font-semibold">{naira(p.amount)}</span></li>
						))}
					</ul>
				</SectionCard>
				<SectionCard title="Past tills" subtitle="Last 7 days" flush>
					<ul className="divide-y divide-line">
						{tills.filter((t) => t.status === "CLOSED").map((t) => (
							<li key={t.id} className="flex items-center gap-3 px-5 py-3 text-[13px]">
								<div className="flex-1"><p className="font-medium text-ink">{t.openedBy}</p><p className="text-xs text-ink-3">{fmtWhen(t.openedAt)} → {fmtWhen(t.closedAt)}</p></div>
								<span className="text-ink-2">expected {naira(t.expected)}</span>
								<span className={cn("font-semibold", (t.variance ?? 0) < 0 ? "text-danger" : (t.variance ?? 0) > 0 ? "text-warning" : "text-success")}>{t.variance === 0 ? "matches" : `${(t.variance ?? 0) > 0 ? "over" : "short"} ${naira(Math.abs(t.variance ?? 0))}`}</span>
							</li>
						))}
					</ul>
				</SectionCard>
			</div>

			<Modal open={modal === "open"} onOpenChange={(o) => !o && setModal(null)} title="Open your till" subtitle="Count the float the manager gave you" icon={WalletIcon} size="confirm" footer={<><button type="button" className={btn.secondary} onClick={() => setModal(null)}>Cancel</button><button type="button" className={btn.primary} disabled={typeof float !== "number" || pending} onClick={() => void run("Till open · you can take cash", () => { setTills((xs) => [{ id: `till-${Date.now()}`, role, openedBy: me, openedAt: new Date().toISOString(), openingFloat: typeof float === "number" ? float : 0, cashIn: 0, expected: typeof float === "number" ? float : 0, status: "OPEN" }, ...xs]); setModal(null); })}>Open with {naira(typeof float === "number" ? float : 0)}</button></>}>
				<MoneyField label="Opening float" value={float} onChange={setFloat} hint="Default float is ₦50,000 · set in Hotel setup" />
			</Modal>

			<Modal open={modal === "close"} onOpenChange={(o) => !o && setModal(null)} title="Count & close the till" subtitle={open ? `Should be ${naira(open.expected)} in the drawer` : undefined} icon={LockIcon} footer={<><button type="button" className={btn.secondary} onClick={() => setModal(null)}>Not yet</button><button type="button" className={btn.primary} disabled={typeof counted !== "number" || (variance !== 0 && !note) || pending} onClick={() => void run(variance === 0 ? "Till closed · counts match" : `Till closed · ${variance > 0 ? "over" : "short"} ${naira(Math.abs(variance))} · manager told`, () => { setTills((xs) => xs.map((t) => (t.id === open?.id ? { ...t, status: "CLOSED", counted: typeof counted === "number" ? counted : 0, variance, closedAt: new Date().toISOString() } : t))); setModal(null); setCounted(""); setNote(""); }, variance === 0 ? undefined : { tone: "warning" })}>Close till</button></>} footerInfo={variance !== 0 && typeof counted === "number" ? "A variance needs a note · the manager is told" : undefined}>
				<div className="flex flex-col gap-4">
					{open && <TotalsList rows={[{ label: "Opening float", value: naira(open.openingFloat) }, { label: "Cash taken", value: naira(open.cashIn) }, { label: "Expected", value: naira(open.expected), strong: true }]} />}
					<MoneyField label="Cash counted" value={counted} onChange={setCounted} required />
					{typeof counted === "number" && (variance === 0 ? <Note tone="success">Counts match.</Note> : <Note tone={variance < 0 ? "danger" : "warning"}>{variance < 0 ? "Short" : "Over"} by {naira(Math.abs(variance))}.</Note>)}
					{typeof counted === "number" && variance !== 0 && <TextareaField label="What happened" value={note} onChange={setNote} rows={2} />}
				</div>
			</Modal>

			<Modal open={modal === "handover"} onOpenChange={(o) => !o && setModal(null)} title="Hand over to the next shift" subtitle="They count the drawer with you and take it on" icon={ArrowRightLeftIcon} size="confirm" footer={<><button type="button" className={btn.secondary} onClick={() => setModal(null)}>Cancel</button><button type="button" className={btn.primary} disabled={!toStaff || typeof counted !== "number" || pending} onClick={() => void run(`Till handed to ${staff.find((s) => s.id === toStaff)?.fullName}`, () => { setTills((xs) => xs.map((t) => (t.id === open?.id ? { ...t, openedBy: staff.find((s) => s.id === toStaff)?.fullName ?? t.openedBy, openingFloat: typeof counted === "number" ? counted : t.expected, cashIn: 0, expected: typeof counted === "number" ? counted : t.expected } : t))); setModal(null); setCounted(""); })}>Hand over</button></>}>
				<div className="flex flex-col gap-4">
					<SelectField label="Handing over to" value={toStaff} onChange={setToStaff} options={staff.filter((s) => s.role === role && s.fullName !== me).map((s) => ({ value: s.id, label: s.fullName, hint: `${s.shift} shift` }))} />
					<MoneyField label="Cash counted together" value={counted} onChange={setCounted} required />
					{open && <DetailList columns={2} items={[{ label: "Expected", value: naira(open.expected) }, { label: "Difference", value: typeof counted === "number" ? naira(counted - open.expected) : "—" }]} />}
				</div>
			</Modal>
		</>
	);
}

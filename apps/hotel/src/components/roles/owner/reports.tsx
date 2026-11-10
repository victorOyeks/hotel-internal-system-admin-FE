"use client";

import {
	CalendarClockIcon,
	DownloadIcon,
	FileTextIcon,
	FolderIcon,
	MailIcon,
	SendIcon,
	SquareIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	runSchedule,
	scheduleReport,
	stopSchedule,
} from "@hospio/api/actions/owner";
import {
	type BuiltReport,
	buildReport,
	type ReportKind,
} from "@hospio/api/actions/owner-reports";
import { emailReport } from "@hospio/api/actions/ml";
import { useAction } from "@hospio/api/actions/use-action";
import type { ReportRunRow, ReportScheduleRow } from "@hospio/api/data/types";
import { Button } from "@hospio/ui/primitives/button";
import { csvName, downloadCsv } from "@hospio/ui/shared/csv";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import {
	ChoiceCards,
	FieldRow,
	SelectField,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtLongDate, fmtWhen } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { HotelFilter } from "./common";

type Hotel = { hotelId: string; name: string };
/** The "All hotels" choice in a select (an empty value is not allowed there). */
const ALL = "all";

/** The reports the owner portal builds from live data (platform-service's schedule catalogue has the same kinds). */
export const REPORTS: {
	kind: ReportKind;
	name: string;
	area: string;
	description: string;
}[] = [
	{
		kind: "DAILY_SUMMARY",
		name: "Daily summary",
		area: "Money",
		description: "Revenue, expenses and net per day and hotel",
	},
	{
		kind: "OCCUPANCY",
		name: "Occupancy",
		area: "Rooms",
		description: "Rooms and the share occupied, per night and hotel",
	},
	{
		kind: "REVENUE",
		name: "Revenue by source",
		area: "Money",
		description: "Rooms, restaurant, bar, laundry and other revenue per hotel",
	},
	{
		kind: "PAYMENTS",
		name: "Payments & refunds",
		area: "Money",
		description: "Every payment with method, who took it and its status",
	},
	{
		kind: "EXPENSES",
		name: "Expenses",
		area: "Money",
		description: "Expenses by category with who asked and their status",
	},
	{
		kind: "GUESTS",
		name: "Guest list",
		area: "Guests",
		description:
			"Everyone who stayed or is booked in the period, with contacts",
	},
];

const EVERY = {
	DAILY: "Every day",
	WEEKLY: "Every Monday",
	MONTHLY: "On the 1st of the month",
} as const;
const COVERS = {
	DAILY: "the day before",
	WEEKLY: "the week before (Monday to Sunday)",
	MONTHLY: "the month before",
} as const;

const lagos = (offsetDays = 0) =>
	new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString("en-CA", {
		timeZone: "Africa/Lagos",
	});
function period(key: string): [string, string] {
	const today = lagos();
	switch (key) {
		case "yesterday":
			return [lagos(-1), lagos(-1)];
		case "week":
			return [lagos(-6), today];
		case "last-month": {
			const first = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
			const end = new Date(first.getTime() - 86_400_000)
				.toISOString()
				.slice(0, 10);
			return [`${end.slice(0, 7)}-01`, end];
		}
		default:
			return [`${today.slice(0, 7)}-01`, today];
	}
}

/**
 * Hotel Owner · 07 Reports: six reports built from live data for a period and one hotel or every hotel, previewed and
 * downloaded as CSV; each can be scheduled (daily, weekly, monthly at a Lagos time) and arrives as an in-app notice and
 * an email link (echoed on staging) that opens it here.
 */
export function OwnerReports({
	hotels,
	schedules,
	runs,
	owner = true,
}: {
	hotels: Hotel[];
	schedules: ReportScheduleRow[];
	runs: ReportRunRow[];
	/** The owner schedules for every hotel and for the managers; a manager for their own hotel only. */
	owner?: boolean;
}) {
	const [q, setQ] = useQueryStates({
		report: parseAsString,
		from: parseAsString,
		to: parseAsString,
		hotel: parseAsString,
	});
	const [search, setSearch] = useState("");
	const [schedule, setSchedule] = useState<ReportKind | null>(null);
	const [stop, setStop] = useState<ReportScheduleRow | null>(null);
	const { run, pending } = useAction();
	const router = useRouter();
	const active = schedules.filter(
		(s) =>
			s.status === "SCHEDULED" &&
			(!q.hotel || !s.hotelId || s.hotelId === q.hotel),
	);
	const list = REPORTS.filter(
		(r) =>
			!search ||
			`${r.name} ${r.description} ${r.area}`
				.toLowerCase()
				.includes(search.toLowerCase()),
	);
	const open = REPORTS.find((r) => r.kind === q.report) ?? null;

	return (
		<>
			<PageHeader
				title="Reports"
				subtitle="Built from live data · every hotel or one branch · download as CSV or schedule"
			/>
			<Toolbar
				left={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Search reports"
					/>
				}
				right={
					<HotelFilter
						hotels={hotels}
						value={q.hotel ?? ""}
						onChange={(v) => void setQ({ hotel: v || null })}
					/>
				}
			/>
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{list.map((r) => {
					const sched = active.filter((s) => s.kind === r.kind);
					return (
						<div
							key={r.kind}
							className="flex flex-col gap-3 rounded-card border border-line bg-card p-4"
						>
							<div className="flex items-start gap-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-brand">
									<FileTextIcon className="size-4" />
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-bold text-ink">{r.name}</p>
									<p className="text-xs text-ink-3">{r.area} · CSV</p>
								</div>
								{sched.length > 0 && (
									<StatusPill dot={false} tone="info">
										Scheduled
									</StatusPill>
								)}
							</div>
							<p className="text-[13px] text-ink-2">{r.description}</p>
							{sched.map((s) => (
								<p key={s.id} className="text-[11px] text-ink-3">
									{EVERY[s.every]} at {s.sendAt} · {s.hotelName}
									{s.managers ? " · and the managers" : ""}
								</p>
							))}
							<div className="mt-auto flex gap-2">
								<Button
									variant="outline"
									className={`${btn.secondary} ${btn.small} flex-1`}
									onClick={() => {
										const [from, to] = period("month");
										void setQ({ report: r.kind, from, to });
									}}
								>
									Open
								</Button>
								<Button
									className={`${btn.primary} ${btn.small} flex-1`}
									onClick={() => setSchedule(r.kind)}
								>
									<CalendarClockIcon className="size-3" /> Schedule
								</Button>
							</div>
						</div>
					);
				})}
			</div>

			<SectionCard
				title="Scheduled reports"
				subtitle="What goes out, when, and to whom"
				count={schedules.filter((s) => s.status === "SCHEDULED").length}
				flush
			>
				{schedules.length === 0 ? (
					<EmptyState
						title="Nothing scheduled"
						hint="Schedule a report to get it by notice and email"
						className="mx-5 mb-5"
					/>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[720px] text-left">
							<thead>
								<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
									<th className="px-5 py-[10px]">Report</th>
									<th className="py-[10px]">When</th>
									<th className="py-[10px]">Hotel</th>
									<th className="py-[10px]">Next</th>
									<th className="py-[10px]">Last sent</th>
									<th className="py-[10px] pr-5 text-right" />
								</tr>
							</thead>
							<tbody>
								{schedules.map((s) => (
									<tr
										key={s.id}
										className="h-12 border-b border-line text-[13px]"
									>
										<td className="px-5 font-semibold text-ink">
											{s.name}
											<span className="block text-[11px] font-normal text-ink-3">
												by {s.requestedBy}
											</span>
										</td>
										<td className="text-ink-2">
											{EVERY[s.every]} · {s.sendAt}
										</td>
										<td className="text-ink-2">
											{s.hotelName}
											{s.managers ? " · managers too" : ""}
										</td>
										<td className="text-ink-2">
											{s.status === "STOPPED" ? (
												<StatusPill tone="grey">Stopped</StatusPill>
											) : (
												fmtWhen(s.nextRunAt)
											)}
										</td>
										<td className="text-ink-2">
											{s.lastRunAt ? fmtWhen(s.lastRunAt) : "Not yet"}
										</td>
										<td className="pr-5 text-right">
											{s.status === "SCHEDULED" && (
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														className={`${btn.secondary} ${btn.small}`}
														disabled={pending}
														onClick={() =>
															run(
																() =>
																	withDeliveries(
																		runSchedule(s.id),
																		`${s.name} · sent now`,
																	),
																`${s.name} sent`,
																() => router.refresh(),
															)
														}
													>
														<SendIcon className="size-3" /> Send now
													</Button>
													<Button
														variant="outline"
														className={`${btn.dangerSoft} ${btn.small}`}
														onClick={() => setStop(s)}
													>
														<SquareIcon className="size-3" /> Stop
													</Button>
												</div>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</SectionCard>

			{runs.length > 0 && (
				<SectionCard
					title="Sent reports"
					subtitle="Each scheduled run, to open again"
					flush
				>
					<ul className="divide-y divide-line">
						{runs.slice(0, 20).map((r) => (
							<li key={r.id}>
								<button
									type="button"
									className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-subtle/60"
									onClick={() =>
										void setQ({
											report: r.kind,
											from: r.from,
											to: r.to,
											hotel: r.hotelId ?? null,
										})
									}
								>
									<FolderIcon className="size-4 text-brand" />
									<span className="min-w-0 flex-1 text-[13px] text-ink">
										<span className="font-semibold">{r.name}</span> ·{" "}
										{r.from === r.to
											? fmtLongDate(r.from)
											: `${fmtLongDate(r.from)} to ${fmtLongDate(r.to)}`}{" "}
										· {r.hotelName}
									</span>
									<span className="text-[11px] text-ink-3">
										{fmtWhen(r.at)}
									</span>
								</button>
							</li>
						))}
					</ul>
				</SectionCard>
			)}

			<ReportPanel
				report={open}
				hotels={hotels}
				from={q.from}
				to={q.to}
				hotel={q.hotel}
				onChange={(p) => void setQ(p)}
				onClose={() => void setQ({ report: null, from: null, to: null })}
				onSchedule={() => open && setSchedule(open.kind)}
			/>
			<ScheduleModal
				kind={schedule}
				hotels={hotels}
				defaultHotel={q.hotel ?? (owner ? "" : (hotels[0]?.hotelId ?? ""))}
				owner={owner}
				onClose={() => setSchedule(null)}
			/>
			<ConfirmModal
				open={!!stop}
				onOpenChange={(o) => !o && setStop(null)}
				title={`Stop ${stop?.name}?`}
				subtitle={
					stop
						? `${EVERY[stop.every]} at ${stop.sendAt} · ${stop.hotelName}`
						: undefined
				}
				tone="danger"
				confirmLabel="Stop schedule"
				pending={pending}
				onConfirm={() =>
					stop &&
					run(
						() => stopSchedule(stop.id),
						`${stop.name} will not be sent any more`,
						() => {
							setStop(null);
							router.refresh();
						},
					)
				}
			/>
		</>
	);
}

function ReportPanel({
	report,
	hotels,
	from,
	to,
	hotel,
	onChange,
	onClose,
	onSchedule,
}: {
	report: (typeof REPORTS)[number] | null;
	hotels: Hotel[];
	from: string | null;
	to: string | null;
	hotel: string | null;
	onChange: (p: {
		from?: string | null;
		to?: string | null;
		hotel?: string | null;
	}) => void;
	onClose: () => void;
	onSchedule: () => void;
}) {
	const [built, setBuilt] = useState<BuiltReport | null>(null);
	const [error, setError] = useState<string | null>(null);
	const mail = useAction();
	const [loading, setLoading] = useState(false);
	const [f, t] = from && to ? [from, to] : period("month");
	const hotelName = hotel
		? (hotels.find((h) => h.hotelId === hotel)?.name ?? "Hotel")
		: "All hotels";
	const preset =
		["yesterday", "week", "month", "last-month"].find((k) => {
			const [a, b] = period(k);
			return a === f && b === t;
		}) ?? "custom";

	useEffect(() => {
		if (!report) return;
		let live = true;
		setLoading(true);
		setError(null);
		buildReport({
			kind: report.kind,
			from: f,
			to: t,
			hotelId: hotel ?? undefined,
		})
			.then((r) => {
				if (!live) return;
				if (r.ok) setBuilt(r.data);
				else {
					setBuilt(null);
					setError(r.error);
				}
			})
			.catch(() => live && setError("The report could not be built. Try again"))
			.finally(() => live && setLoading(false));
		return () => {
			live = false;
		};
	}, [report, f, t, hotel]);

	const what = report
		? `${report.name} · ${f === t ? f : `${f} to ${t}`} · ${hotelName}`
		: "";
	return (
		<SidePanel
			open={!!report}
			onOpenChange={(o) => !o && onClose()}
			title={report?.name ?? ""}
			subtitle={report?.description}
			icon={FolderIcon}
			width="lg"
			footerInfo={built ? `${built.rows.length} rows` : undefined}
			footer={
				report && (
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={onSchedule}
						>
							<CalendarClockIcon className="size-4" /> Schedule
						</Button>
						<Button
							variant="outline"
							className={btn.secondary}
							disabled={mail.pending || loading}
							onClick={() =>
								mail.run(
									() =>
										withDeliveries(
											emailReport({
												kind: report.kind,
												from: f,
												to: t,
												hotelId: hotel ?? undefined,
											}),
											`${report.name} · emailed`,
										),
									(d) => `Report emailed to ${d.to}`,
								)
							}
						>
							<MailIcon className="size-4" /> Email me
						</Button>
						<Button
							className={btn.primary}
							disabled={!built || built.rows.length === 0 || loading}
							onClick={() => {
								if (!built) return;
								downloadCsv(csvName(what), [built.columns, ...built.rows]);
								toast.success(`${report.name} downloaded`);
							}}
						>
							<DownloadIcon className="size-4" /> Download CSV
						</Button>
					</>
				)
			}
		>
			{report && (
				<div className="flex flex-col gap-6">
					<PanelSection title="Period and hotel">
						<div className="flex flex-col gap-3">
							<ChoiceCards
								value={preset}
								onChange={(k) => {
									if (k === "custom") return;
									const [a, b] = period(k);
									onChange({ from: a, to: b });
								}}
								columns={2}
								options={[
									{ value: "yesterday", label: "Yesterday" },
									{ value: "week", label: "Last 7 days" },
									{ value: "month", label: "This month" },
									{ value: "last-month", label: "Last month" },
								]}
							/>
							<FieldRow>
								<TextField
									label="From"
									type="date"
									value={f}
									onChange={(v) => onChange({ from: v, to: t })}
								/>
								<TextField
									label="To"
									type="date"
									value={t}
									onChange={(v) => onChange({ from: f, to: v })}
								/>
							</FieldRow>
							<SelectField
								label="Hotel"
								value={hotel ?? ALL}
								onChange={(v) => onChange({ hotel: v === ALL ? null : v })}
								options={[
									{ value: ALL, label: "All hotels" },
									...hotels.map((h) => ({ value: h.hotelId, label: h.name })),
								]}
							/>
						</div>
					</PanelSection>
					<PanelSection title="Preview">
						{loading ? (
							<p className="text-[13px] text-ink-3">Building the report…</p>
						) : error ? (
							<Note tone="danger">{error}</Note>
						) : built && built.rows.length === 0 ? (
							<EmptyState
								title="Nothing in this period"
								hint="Try another period or hotel"
							/>
						) : built ? (
							<div className="flex flex-col gap-2">
								<div className="max-h-[420px] overflow-auto rounded-xl border border-line">
									<table className="w-full text-left text-[12px]">
										<thead className="sticky top-0 bg-[#fafafa]">
											<tr>
												{built.columns.map((c) => (
													<th
														key={c}
														className="whitespace-nowrap px-3 py-2 font-semibold text-ink-3"
													>
														{c}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{built.rows.slice(0, 50).map((r, i) => (
												<tr
													key={`${i}-${r[0]}`}
													className="border-t border-line"
												>
													{r.map((c, j) => (
														<td
															key={built.columns[j]}
															className="whitespace-nowrap px-3 py-[6px] text-ink"
														>
															{typeof c === "number" &&
															built.columns[j].includes("NGN")
																? c.toLocaleString("en-NG")
																: c}
														</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
								{built.rows.length > 50 && (
									<p className="text-[11px] text-ink-3">
										The first 50 of {built.rows.length} rows · the download has
										them all.
									</p>
								)}
								{built.note && <Note tone="info">{built.note}</Note>}
							</div>
						) : null}
					</PanelSection>
				</div>
			)}
		</SidePanel>
	);
}

function ScheduleModal({
	kind,
	hotels,
	defaultHotel,
	owner,
	onClose,
}: {
	kind: ReportKind | null;
	hotels: Hotel[];
	defaultHotel: string;
	owner: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [every, setEvery] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
	const [time, setTime] = useState("07:00");
	const [hotel, setHotel] = useState<string | null>(null);
	const [managers, setManagers] = useState(false);
	const report = REPORTS.find((r) => r.kind === kind);
	const scope = hotel ?? defaultHotel;
	return (
		<Modal
			open={!!kind}
			onOpenChange={(o) => !o && onClose()}
			title="Schedule this report"
			subtitle={report?.name}
			icon={CalendarClockIcon}
			size="form"
			footerInfo="Arrives as a notice in the app and an email with the link"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !/^\d{2}:\d{2}$/.test(time)}
						onClick={() =>
							kind &&
							run(
								() =>
									scheduleReport({
										kind,
										every,
										sendAt: time,
										hotelId: scope || undefined,
										managers,
									}),
								`${report?.name} scheduled · ${EVERY[every].toLowerCase()} at ${time}`,
								() => {
									setHotel(null);
									onClose();
									router.refresh();
								},
							)
						}
					>
						Save schedule
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards
					label="How often"
					value={every}
					onChange={setEvery}
					columns={3}
					options={[
						{ value: "DAILY", label: "Daily", hint: "Yesterday's" },
						{ value: "WEEKLY", label: "Weekly", hint: "Mondays · last week" },
						{
							value: "MONTHLY",
							label: "Monthly",
							hint: "The 1st · last month",
						},
					]}
				/>
				<FieldRow>
					<TextField
						label="Time (Lagos)"
						value={time}
						onChange={setTime}
						type="time"
					/>
					<SelectField
						label="Hotel"
						value={scope || ALL}
						onChange={(v) => setHotel(v === ALL ? "" : v)}
						options={[
							...(owner ? [{ value: ALL, label: "All hotels" }] : []),
							...hotels.map((h) => ({ value: h.hotelId, label: h.name })),
						]}
					/>
				</FieldRow>
				{owner && (
					<ToggleField
						label="Also send to the managers"
						hint="Each hotel's managers get their own hotel"
						checked={managers}
						onChange={setManagers}
					/>
				)}
				<Note tone="info">
					Each run covers {COVERS[every]}. Saving the same report for the same
					hotel again changes its schedule. Each run arrives as an in-app notice
					and an email to your address with a link that opens it here; Send now
					sends the latest one at once.
				</Note>
			</div>
		</Modal>
	);
}

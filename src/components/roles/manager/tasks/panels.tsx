"use client";

import { CalendarDaysIcon, CheckCircle2Icon, ClipboardListIcon, FlagIcon, ImagePlusIcon, PauseCircleIcon, RepeatIcon, UserCheckIcon, WrenchIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DetailList, Note, Timeline } from "@/components/shared/detail-list";
import { ChoiceCards, FieldRow, MoneyField, SelectField, TextField, TextareaField, ToggleField } from "@/components/shared/field";
import { fmtDay, fmtWhen, naira, plural } from "@/components/shared/format";
import { ConfirmModal, Modal } from "@/components/shared/modal";
import { ManagerMark } from "@/components/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { RepairRow, ScheduledJobRow, SparePartRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";

export const priorityTone = { URGENT: "danger", HIGH: "warning", NORMAL: "grey", LOW: "grey" } as const;
export const statusLabel = { OPEN: "To do", ASSIGNED: "Assigned", IN_PROGRESS: "In progress", WAITING_PARTS: "Waiting", DONE: "Done", CANCELLED: "Cancelled" } as const;
export const TEAMS = ["Housekeeping", "Maintenance", "Front desk", "Kitchen", "Bar", "Laundry", "Store", "You"];
export const PEOPLE = ["Chinedu Obi", "Ibrahim Danjuma", "Grace Okafor", "Kemi Adebayo", "Ruth Eze", "Victor Adeyemi", "Toyin Balogun", "Jide Alabi", "Mariam Bello", "Segun Ajayi", "Tunde Bakare"];

export function teamOf(t: RepairRow) {
	return t.source === "Scheduled job" || t.source === "Manager" ? "Maintenance" : t.source;
}

// ---- details ---------------------------------------------------------------------------------------

export function TaskPanel({ task, areas, onClose }: { task: RepairRow | null; areas: string[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [mode, setMode] = useState<"view" | "assign" | "update" | "quote">("view");
	const [assignee, setAssignee] = useState("");
	const [update, setUpdate] = useState("");
	const [vendor, setVendor] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [done, setDone] = useState(false);
	const [ooo, setOoo] = useState(task?.roomOutOfOrder ?? false);
	const close = () => { setMode("view"); onClose(); };
	if (!task) return null;
	const open = task.status !== "DONE" && task.status !== "CANCELLED";
	return (
		<>
			<SidePanel
				open
				onOpenChange={(o) => !o && close()}
				width="lg"
				icon={teamOf(task) === "Maintenance" ? WrenchIcon : ClipboardListIcon}
				title={task.title}
				subtitle={`${teamOf(task)} · ${task.roomNumber ? `Room ${task.roomNumber}` : task.area ?? ""} · reported by ${task.reportedBy} ${fmtWhen(task.createdAt)}`}
				footerInfo={<span className="flex items-center gap-2"><StatusPill tone={priorityTone[task.priority]}>{task.priority === "URGENT" ? "Urgent" : task.priority === "HIGH" ? "High" : task.priority === "LOW" ? "Low" : "Normal"}</StatusPill><StatusPill tone={task.status === "DONE" ? "success" : task.status === "IN_PROGRESS" ? "info" : task.status === "WAITING_PARTS" ? "warning" : "grey"}>{statusLabel[task.status]}</StatusPill></span>}
				footer={
					mode === "view" ? (
						open && (
							<>
								<Button variant="outline" className={btn.secondary} onClick={() => setMode("update")}>Add update</Button>
								<Button variant="outline" className={btn.secondary} onClick={() => setMode("assign")}><UserCheckIcon className="size-4" /> {task.assignedTo ? "Reassign" : "Assign"}</Button>
								<Button className={btn.primary} onClick={() => setDone(true)}><CheckCircle2Icon className="size-4" /> Mark done</Button>
							</>
						)
					) : (
						<>
							<Button variant="outline" className={btn.secondary} onClick={() => setMode("view")}>Back</Button>
							{mode === "assign" && <Button className={btn.primary} disabled={!assignee || pending} onClick={() => run(`Assigned to ${assignee} · they are told on the tablet`, close)}>Assign</Button>}
							{mode === "update" && <Button className={btn.primary} disabled={!update || pending} onClick={() => run("Update added", () => setMode("view"))}>Post update</Button>}
							{mode === "quote" && <Button className={btn.primary} disabled={!vendor || !amount || pending} onClick={() => run(`Quote from ${vendor} added`, () => setMode("view"))}>Add quote</Button>}
						</>
					)
				}
			>
				<div className="flex flex-col gap-5">
					{mode === "view" && (
						<>
							{task.description && <p className="text-[13px] text-ink-2">{task.description}</p>}
							<DetailList columns={2} items={[{ label: "Assigned to", value: task.assignedTo ?? <span className="text-danger">Unassigned</span> }, { label: "Where", value: task.roomNumber ? `Room ${task.roomNumber}` : task.area ?? "—" }, { label: "Source", value: task.source }, { label: "Opened", value: fmtWhen(task.createdAt) }, ...(task.doneAt ? [{ label: "Done", value: fmtWhen(task.doneAt) }] : [])]} />
							{task.roomNumber && open && (
								<ToggleField label="Room out of order" hint="Blocks the room on the board until this is done" checked={ooo} onChange={(v) => { setOoo(v); run(v ? `Room ${task.roomNumber} out of order` : `Room ${task.roomNumber} back in service`); }} />
							)}
							{task.quotes && task.quotes.length > 0 && (
								<PanelSection title="Quotes">
									<ul className="divide-y divide-line rounded-xl border border-line">
										{task.quotes.map((q) => (
											<li key={q.vendor} className="flex items-center gap-3 px-3 py-[10px] text-[13px]">
												<span className="flex-1 font-medium text-ink">{q.vendor}</span>
												<span className="font-semibold text-ink">{naira(q.amount)}</span>
												{q.chosen ? <StatusPill tone="success" dot={false}>Chosen</StatusPill> : <Button size="sm" variant="outline" className={`${btn.secondary} ${btn.small}`} disabled={pending} onClick={() => run(`${q.vendor} chosen · ${naira(q.amount)} sent for approval`)}>Choose</Button>}
											</li>
										))}
									</ul>
									<button type="button" onClick={() => setMode("quote")} className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"><PlusIcon className="size-3" /> Another quote</button>
									<p className="flex items-center gap-2 text-xs text-ink-3"><ManagerMark /> Spend over ₦500,000 goes to the owner.</p>
								</PanelSection>
							)}
							{!task.quotes && teamOf(task) === "Maintenance" && open && (
								<button type="button" onClick={() => setMode("quote")} className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"><PlusIcon className="size-3" /> Add a quote from a vendor</button>
							)}
							<PanelSection title="Updates">
								{task.updates.length === 0 ? <Note tone="info">No updates yet.</Note> : <Timeline items={[...task.updates].reverse().map((u) => ({ at: fmtWhen(u.at), by: u.by, text: u.note }))} />}
							</PanelSection>
						</>
					)}
					{mode === "assign" && (
						<div className="flex flex-col gap-4">
							<ChoiceCards label="Who" value={assignee} onChange={setAssignee} options={PEOPLE.slice(0, 6).map((pname, i) => ({ value: pname, label: pname, hint: i === 0 ? "On shift · 2 open repairs" : i === 1 ? "On shift · 1 open" : "Afternoon shift" }))} />
							<SelectField label="Or a vendor" value={assignee.includes("vendor") ? assignee : ""} onChange={setAssignee} options={["Ifeoluwa Plumbing (vendor)", "Cool Breeze Ltd (vendor)", "Alaba Electricals (vendor)"]} placeholder="Outside help" setupLink="vendors" />
							<WhatHappens items={["They get it on the tablet and WhatsApp", "The task moves to Assigned", "You are told when they start and when it is done"]} />
						</div>
					)}
					{mode === "update" && (
						<div className="flex flex-col gap-4">
							<TextareaField label="What happened" value={update} onChange={setUpdate} rows={4} placeholder="Looked at it · likely gas. Will refill after lunch." />
							<button type="button" className="flex items-center gap-2 rounded-control border border-dashed border-line px-4 py-3 text-[13px] text-ink-2 hover:bg-subtle"><ImagePlusIcon className="size-4" /> Add a photo</button>
						</div>
					)}
					{mode === "quote" && (
						<div className="flex flex-col gap-4">
							<FieldRow>
								<TextField label="Vendor" value={vendor} onChange={setVendor} placeholder="Cool Breeze Ltd" />
								<MoneyField label="Quoted amount" value={amount} onChange={setAmount} />
							</FieldRow>
							<SelectField label="Area" value={task.area ?? ""} onChange={() => {}} options={areas} disabled />
							<Note tone="info">Over ₦200,000 you approve; over ₦500,000 the owner does.</Note>
						</div>
					)}
				</div>
			</SidePanel>
			<MarkDoneModal task={done ? task : null} onClose={() => setDone(false)} onDone={close} />
		</>
	);
}

export function MarkDoneModal({ task, onClose, onDone }: { task: RepairRow | null; onClose: () => void; onDone?: () => void }) {
	const { run, pending } = useDemoAction();
	const [note, setNote] = useState("");
	const [backInService, setBackInService] = useState(true);
	return (
		<Modal open={!!task} onOpenChange={(o) => !o && onClose()} icon={CheckCircle2Icon} title="Mark done" subtitle={task?.title} size="confirm" footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run(`${task?.title} done`, () => { onClose(); onDone?.(); })}>Mark done</Button></>}>
			<div className="flex flex-col gap-4">
				<TextareaField label="What was done" value={note} onChange={setNote} placeholder="Gas refilled · cooling again" />
				{task?.roomOutOfOrder && <ToggleField label={`Put room ${task.roomNumber} back in service`} hint="Housekeeping cleans it before it goes on sale" checked={backInService} onChange={setBackInService} />}
				<WhatHappens items={["Whoever reported it is told", task?.roomNumber ? "Housekeeping is asked to check the room" : "It moves to Done today"]} />
			</div>
		</Modal>
	);
}

// ---- new task / report issue -----------------------------------------------------------------------

export function NewTaskPanel({ kind, areas, onClose }: { kind: "task" | "issue"; areas: string[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [form, setForm] = useState({ title: "", team: kind === "issue" ? "Maintenance" : "", where: "", priority: "NORMAL" as RepairRow["priority"], assignee: "", due: "", note: "", ooo: false });
	const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
	return (
		<SidePanel
			open
			onOpenChange={(o) => !o && onClose()}
			icon={kind === "issue" ? FlagIcon : ClipboardListIcon}
			title={kind === "issue" ? "Report an issue" : "New task"}
			subtitle={kind === "issue" ? "Something broken or not right · goes to maintenance" : "Give someone a job and a time"}
			footerInfo={form.assignee ? `${form.assignee} is told on the tablet` : "Unassigned tasks show in To do"}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !form.title} onClick={() => run(kind === "issue" ? "Issue reported · maintenance told" : `Task created${form.assignee ? ` · ${form.assignee} told` : ""}`, onClose)}>{kind === "issue" ? "Report issue" : "Create task"}</Button></>}
		>
			<div className="flex flex-col gap-4">
				<TextField label={kind === "issue" ? "What's wrong" : "Task"} value={form.title} onChange={(v) => set("title", v)} placeholder={kind === "issue" ? "AC not cooling" : "Restock minibars on floor 2"} required />
				<FieldRow>
					<SelectField label="Team" value={form.team} onChange={(v) => set("team", v)} options={TEAMS} setupLink="departments" />
					<SelectField label="Where" value={form.where} onChange={(v) => set("where", v)} options={[...["A204", "A211", "A325", "B105", "B110"].map((r) => `Room ${r}`), ...areas]} setupLink="areas" placeholder="Room or area" />
				</FieldRow>
				<ChoiceCards label="Priority" value={form.priority} onChange={(v) => set("priority", v)} columns={3} options={[{ value: "URGENT", label: "Urgent", hint: "Guest affected now" }, { value: "HIGH", label: "High", hint: "Today" }, { value: "NORMAL", label: "Normal", hint: "This week" }]} />
				<FieldRow>
					<SelectField label="Assign to" value={form.assignee} onChange={(v) => set("assignee", v)} options={PEOPLE} placeholder="Leave open" />
					<TextField label="Due" type="datetime-local" value={form.due} onChange={(v) => set("due", v)} />
				</FieldRow>
				<TextareaField label="Details" value={form.note} onChange={(v) => set("note", v)} placeholder="Anything that helps" />
				<button type="button" className="flex items-center gap-2 rounded-control border border-dashed border-line px-4 py-3 text-[13px] text-ink-2 hover:bg-subtle"><ImagePlusIcon className="size-4" /> Add a photo</button>
				{kind === "issue" && form.where.startsWith("Room") && <ToggleField label="Take the room out of order" hint="Nobody can be checked into it until this is done" checked={form.ooo} onChange={(v) => set("ooo", v)} />}
			</div>
		</SidePanel>
	);
}

// ---- scheduled jobs --------------------------------------------------------------------------------

export function JobPanel({ job, areas, onClose, isNew }: { job: ScheduledJobRow | null; areas: string[]; onClose: () => void; isNew?: boolean }) {
	const { run, pending } = useDemoAction();
	const [form, setForm] = useState({ title: job?.title ?? "", area: job?.area ?? "", every: String(job?.everyDays ?? 30), assignee: job?.assignedTo ?? "", next: job?.nextDue ?? new Date().toISOString().slice(0, 10) });
	const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));
	const [pause, setPause] = useState(false);
	const [del, setDel] = useState(false);
	const [doIt, setDoIt] = useState(false);
	const [doneNote, setDoneNote] = useState("");
	if (!job && !isNew) return null;
	return (
		<>
			<SidePanel
				open
				onOpenChange={(o) => !o && onClose()}
				width="lg"
				icon={RepeatIcon}
				title={isNew ? "Repeating job" : job?.title ?? ""}
				subtitle={isNew ? "Generator service, AC filters, water tanks — jobs that come round" : `${job?.area} · every ${job?.everyDays} days · ${job?.paused ? "paused" : `next ${fmtDay(job?.nextDue)}`}`}
				footerInfo={job && !isNew && (job.paused ? <StatusPill tone="grey">Paused</StatusPill> : job.nextDue <= new Date().toISOString().slice(0, 10) ? <StatusPill tone="danger">Due</StatusPill> : <StatusPill tone="success">On track</StatusPill>)}
				footer={
					isNew ? (
						<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !form.title} onClick={() => run(`${form.title} repeats every ${form.every} days`, onClose)}>Save job</Button></>
					) : (
						<>
							<Button variant="outline" className={btn.dangerSoft} onClick={() => setDel(true)}>Delete</Button>
							<Button variant="outline" className={btn.secondary} onClick={() => setPause(true)}><PauseCircleIcon className="size-4" /> {job?.paused ? "Resume" : "Pause"}</Button>
							<Button className={btn.primary} onClick={() => setDoIt(true)}><CheckCircle2Icon className="size-4" /> Done today</Button>
						</>
					)
				}
			>
				<div className="flex flex-col gap-5">
					<TextField label="Job" value={form.title} onChange={(v) => set("title", v)} placeholder="Generator service" required />
					<FieldRow>
						<SelectField label="Area" value={form.area} onChange={(v) => set("area", v)} options={areas} setupLink="areas" />
						<TextField label="Every (days)" type="number" value={form.every} onChange={(v) => set("every", v)} />
					</FieldRow>
					<FieldRow>
						<SelectField label="Assigned to" value={form.assignee} onChange={(v) => set("assignee", v)} options={PEOPLE} placeholder="Anyone in maintenance" />
						<TextField label="Next due" type="date" value={form.next} onChange={(v) => set("next", v)} />
					</FieldRow>
					{job && !isNew && (
						<PanelSection title={`Past runs · ${plural(job.runs.length, "time")}`}>
							{job.runs.length === 0 ? <Note tone="info">Never done yet.</Note> : <Timeline items={job.runs.map((r) => ({ at: fmtDay(r.on), by: r.by, text: r.note ?? "Done" }))} />}
						</PanelSection>
					)}
					{!isNew && job && (
						<Button variant="outline" className={cn(btn.secondary, "self-start")} disabled={pending} onClick={() => run("Job details saved")}>Save changes</Button>
					)}
				</div>
			</SidePanel>
			<ConfirmModal open={pause} onOpenChange={setPause} title={job?.paused ? `Resume ${job?.title}?` : `Pause ${job?.title}?`} confirmLabel={job?.paused ? "Resume job" : "Pause job"} pending={pending} onConfirm={() => run(job?.paused ? "Job resumed" : "Job paused · no reminders until you resume", () => { setPause(false); onClose(); }, { tone: job?.paused ? "success" : "warning" })}>
				<WhatHappens items={job?.paused ? ["Reminders start again from the next due date"] : ["No reminders while paused", "The last run date is kept", "Shows as paused on the schedule"]} />
			</ConfirmModal>
			<ConfirmModal open={del} onOpenChange={setDel} tone="danger" title={`Delete ${job?.title}?`} subtitle="Manager only · logged" confirmLabel="Delete job" pending={pending} onConfirm={() => run("Job deleted", () => { setDel(false); onClose(); }, { tone: "warning" })} alternative={{ label: "Pause it instead", onClick: () => { setDel(false); setPause(true); } }}>
				<WhatHappens tone="danger" items={["Past runs are kept in the activity log", "Nothing reminds anyone to do it again"]} />
			</ConfirmModal>
			<Modal open={doIt} onOpenChange={setDoIt} icon={CalendarDaysIcon} title="Mark done today" subtitle={job?.title} size="confirm" footer={<><Button variant="outline" className={btn.secondary} onClick={() => setDoIt(false)}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run(`${job?.title} done · next in ${job?.everyDays} days`, () => { setDoIt(false); onClose(); })}>Mark done</Button></>}>
				<TextareaField label="Note" value={doneNote} onChange={setDoneNote} placeholder="Oil and filter changed" />
			</Modal>
		</>
	);
}

export function UsePartModal({ part, onClose }: { part: SparePartRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [qty, setQty] = useState("1");
	const [forTask, setForTask] = useState("");
	return (
		<Modal open={!!part} onOpenChange={(o) => !o && onClose()} icon={WrenchIcon} title="Use a part" subtitle={part ? `${part.name} · ${part.quantity} in stock` : ""} size="confirm" footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || Number(qty) < 1} onClick={() => run(`${qty} × ${part?.name} used`, onClose)}>Use part</Button></>}>
			<div className="flex flex-col gap-4">
				<FieldRow>
					<TextField label="Quantity" type="number" value={qty} onChange={setQty} />
					<TextField label="For which repair" value={forTask} onChange={setForTask} placeholder="A204 AC" />
				</FieldRow>
				{part && Number(qty) >= part.quantity - part.minQuantity + 1 && <Note>This takes {part.name} below its minimum of {part.minQuantity}. A reorder goes to the store.</Note>}
			</div>
		</Modal>
	);
}

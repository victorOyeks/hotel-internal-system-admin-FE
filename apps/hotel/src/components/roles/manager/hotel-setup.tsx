"use client";

import {
	AlertTriangleIcon,
	BedDoubleIcon,
	BuildingIcon,
	ChefHatIcon,
	CoinsIcon,
	CreditCardIcon,
	ListIcon,
	LockIcon,
	type LucideIcon,
	MessageSquareIcon,
	MoonIcon,
	PaletteIcon,
	PlusIcon,
	ShieldCheckIcon,
	SprayCanIcon,
	UsersIcon,
	WalletIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSetupSection } from "@hospio/api/actions/hotel-config";
import { setHotelStatus } from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import type { HotelStatus } from "@hospio/api/api/schema";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	Field,
	MoneyField,
	SelectField,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn, input as inputCls } from "@hospio/ui/shared/ui";
import type { HotelSetupSection } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";

const icons: Record<string, LucideIcon> = {
	building: BuildingIcon,
	bed: BedDoubleIcon,
	wallet: WalletIcon,
	shield: ShieldCheckIcon,
	spray: SprayCanIcon,
	chef: ChefHatIcon,
	message: MessageSquareIcon,
	users: UsersIcon,
	moon: MoonIcon,
	alert: AlertTriangleIcon,
	palette: PaletteIcon,
	"credit-card": CreditCardIcon,
	list: ListIcon,
	coins: CoinsIcon,
};

const why: Record<string, string> = {
	basics:
		"Guests see these times on their confirmation; the night audit uses them to flag late check-outs.",
	rooms:
		"Room types drive prices, availability and what the front desk can sell.",
	money:
		"Payment methods and the deposit rule show up on every booking and receipt.",
	approvals:
		"Anything over a limit waits for the right person; everything is logged.",
	housekeeping:
		"The checklist is what attendants tick on the tablet; inspections gate rooms as ready.",
	outlets:
		"Room charging posts restaurant and bar bills straight to the folio.",
	messaging: "Automatic messages go out on the channels you turn on here.",
	staff: "Shifts and departments feed the rota and lateness tracking.",
	night:
		"The day cannot close until these are done, so the numbers are trustworthy.",
	brand:
		"Your colours replace the H.M.S maroon on every screen your staff and guests see.",
	pos: "Terminals are matched to roles so a bar sale never lands in the front desk till.",
	reasons:
		"Staff pick from these lists so reports group cleanly; items in use are hidden, never deleted.",
	taxes: "Set by the owner for the whole business; every receipt shows them.",
	danger: "Only the owner can change ownership or close the hotel.",
};

/**
 * Manager · Hotel setup (the owner opens the same screen with the owner-only sections unlocked): every
 * list, time and rule the hotel runs on. Saves go to PUT /hotel-config/setup/{section} and the lists
 * routes; the danger zone changes the hotel's status on tenant-service.
 */
export function HotelSetupScreen({
	sections,
	activeKey,
	hotelName,
	hotelId,
	isOwner,
}: {
	sections: HotelSetupSection[];
	activeKey: string;
	hotelName: string;
	hotelId?: string;
	isOwner: boolean;
}) {
	const section = sections.find((s) => s.key === activeKey) ?? sections[0];
	const locked = !!section.ownerOnly && !isOwner;
	const ownerSections = sections.filter((s) => s.ownerOnly);
	const hotelSections = sections.filter((s) => !s.ownerOnly);

	return (
		<>
			<PageHeader
				title="Hotel setup"
				subtitle={`${hotelName} · your hotel's own lists, times and rules · changes apply to this hotel only`}
			>
				<ManagerMark />
			</PageHeader>
			<div className="grid gap-4 xl:grid-cols-[260px_1fr]">
				<nav className="flex h-fit flex-col gap-[2px] rounded-card border border-line bg-card p-2">
					{hotelSections.map((s) => (
						<SetupLink key={s.key} s={s} active={s.key === section.key} />
					))}
					<p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">
						Set by the owner
					</p>
					{ownerSections.map((s) => (
						<SetupLink
							key={s.key}
							s={s}
							active={s.key === section.key}
							locked
						/>
					))}
				</nav>
				<SectionForm
					key={section.key}
					section={section}
					locked={locked}
					why={why[section.key]}
					hotelId={hotelId}
				/>
			</div>
		</>
	);
}

function SetupLink({
	s,
	active,
	locked,
}: {
	s: HotelSetupSection;
	active: boolean;
	locked?: boolean;
}) {
	const Icon = icons[s.icon] ?? ListIcon;
	return (
		<Link
			href={`/dashboard/hotel-setup/${s.key}`}
			className={cn(
				"flex items-center gap-[10px] rounded-[10px] px-3 py-[9px] text-[13px] font-medium transition-colors",
				active
					? "bg-brand-soft text-brand"
					: "text-ink-2 hover:bg-subtle hover:text-ink",
			)}
		>
			<Icon className="size-4 shrink-0" />
			<span className="flex-1 truncate">{s.title}</span>
			{locked && <LockIcon className="size-3 text-ink-3" />}
		</Link>
	);
}

function SectionForm({
	section,
	locked,
	why,
	hotelId,
}: {
	section: HotelSetupSection;
	locked: boolean;
	why?: string;
	hotelId?: string;
}) {
	const router = useRouter();
	const [values, setValues] = useState<Record<string, unknown>>(() =>
		Object.fromEntries(section.fields.map((f) => [f.key, f.value])),
	);
	const [dirty, setDirty] = useState(false);
	const [danger, setDanger] = useState<HotelStatus | null>(null);
	const { run, pending } = useAction();
	const set = (key: string, v: unknown) => {
		setValues((s) => ({ ...s, [key]: v }));
		setDirty(true);
	};
	const reset = () => {
		setValues(Object.fromEntries(section.fields.map((f) => [f.key, f.value])));
		setDirty(false);
	};
	const isDanger = section.key === "danger";

	return (
		<section className="flex flex-col rounded-card border border-line bg-card">
			<header className="border-b border-line px-6 py-5">
				<h2 className="text-lg font-bold text-ink">{section.title}</h2>
				<p className="text-[13px] text-ink-3">{section.description}</p>
			</header>
			<div className="flex flex-col gap-5 px-6 py-5">
				{locked && (
					<Note tone="info">
						<LockIcon className="mr-1 inline size-3" /> Only the owner can
						change this section. You can see the values.
					</Note>
				)}
				{section.key === "brand" && (
					<div className="flex items-center gap-4 rounded-xl border border-line p-4">
						<span
							className="flex size-14 items-center justify-center rounded-xl text-sm font-bold text-white"
							style={{ background: String(values.primary ?? "#4c091e") }}
						>
							{String(values.logoText ?? "H.M.S")}
						</span>
						<div className="flex-1">
							<p className="text-[13px] font-semibold text-ink">Preview</p>
							<p className="text-xs text-ink-3">
								Sidebar and buttons use the brand colour · status colours never
								change
							</p>
						</div>
						<button type="button" className={btn.secondary}>
							Upload logo
						</button>
					</div>
				)}
				<div className="grid gap-4 md:grid-cols-2">
					{section.fields.map((f) => (
						<SetupField
							key={f.key}
							field={f}
							value={values[f.key]}
							onChange={(v) => set(f.key, v)}
							disabled={locked}
							wide={f.type === "list"}
						/>
					))}
				</div>
				{isDanger && (
					<div className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger-soft/40 p-4">
						<p className="text-[13px] font-semibold text-danger">Danger zone</p>
						<p className="text-xs text-ink-2">
							Pausing stops new bookings; closing removes the hotel from every
							screen after the last guest checks out.
						</p>
						<div className="flex gap-2">
							{values.status !== "ACTIVE" && (
								<button
									type="button"
									className={btn.secondary}
									disabled={locked}
									onClick={() => setDanger("ACTIVE")}
								>
									Reopen this hotel
								</button>
							)}
							<button
								type="button"
								className={btn.dangerSoft}
								disabled={locked || values.status === "PAUSED"}
								onClick={() => setDanger("PAUSED")}
							>
								Pause this hotel
							</button>
							<button
								type="button"
								className={btn.danger}
								disabled={locked || values.status === "CLOSED"}
								onClick={() => setDanger("CLOSED")}
							>
								Close this hotel
							</button>
						</div>
					</div>
				)}
				{why && (
					<p className="rounded-[10px] bg-subtle/70 px-4 py-3 text-xs text-ink-2">
						<span className="font-semibold text-ink">Why this matters · </span>
						{why}
					</p>
				)}
			</div>
			{!locked && !isDanger && (
				<footer className="flex items-center gap-3 border-t border-line px-6 py-4">
					<span className="flex-1 text-xs text-ink-3">
						{dirty
							? "Unsaved changes · new rules apply after you save"
							: "Saved · everyone sees the current values"}
					</span>
					<Button
						variant="outline"
						className={btn.secondary}
						disabled={!dirty || pending}
						onClick={reset}
					>
						Discard
					</Button>
					<Button
						className={btn.primary}
						disabled={!dirty || pending}
						onClick={() =>
							run(
								() => saveSetupSection(section.key, values, hotelId),
								`${section.title} saved`,
								() => setDirty(false),
							)
						}
					>
						Save changes
					</Button>
				</footer>
			)}
			<ConfirmModal
				open={!!danger}
				onOpenChange={(o) => !o && setDanger(null)}
				title={
					danger === "ACTIVE"
						? "Reopen this hotel?"
						: danger === "PAUSED"
							? "Pause this hotel?"
							: "Close this hotel?"
				}
				subtitle={
					danger === "CLOSED"
						? "Guests in house finish their stay first"
						: undefined
				}
				tone={danger === "ACTIVE" ? "default" : "danger"}
				confirmLabel={
					danger === "ACTIVE"
						? "Reopen hotel"
						: danger === "PAUSED"
							? "Pause new bookings"
							: "Close hotel"
				}
				pending={pending}
				alternative={
					danger === "CLOSED"
						? {
								label: "Pause new bookings instead",
								onClick: () => setDanger("PAUSED"),
							}
						: undefined
				}
				onConfirm={() => {
					if (!hotelId || !danger) return;
					const next = danger;
					run(
						() => setHotelStatus(hotelId, next),
						next === "ACTIVE"
							? "Hotel reopened"
							: next === "PAUSED"
								? "Hotel paused"
								: "Hotel closed",
						() => {
							setDanger(null);
							set("status", next);
							setDirty(false);
							router.refresh();
						},
					);
				}}
			>
				<WhatHappens
					tone={danger === "ACTIVE" ? "info" : "danger"}
					items={
						danger === "ACTIVE"
							? ["Bookings open again at once", "Staff access returns"]
							: danger === "PAUSED"
								? [
										"No new bookings can be made",
										"Guests in house finish their stay",
										"Staff keep their access",
									]
								: [
										"Staff cannot sign in to this hotel",
										"Guests in house finish their stay",
										"Reports and history are kept",
									]
					}
				/>
			</ConfirmModal>
		</section>
	);
}

export function SetupField({
	field,
	value,
	onChange,
	disabled,
	wide,
}: {
	field: HotelSetupSection["fields"][number];
	value: unknown;
	onChange: (v: unknown) => void;
	disabled: boolean;
	wide?: boolean;
}) {
	const cls = wide ? "md:col-span-2" : undefined;
	switch (field.type) {
		case "text":
			return (
				<TextField
					className={cls}
					label={field.label}
					value={String(value ?? "")}
					onChange={onChange}
					hint={field.help}
					disabled={disabled}
				/>
			);
		case "number":
			return (
				<TextField
					className={cls}
					label={field.label}
					type="number"
					value={String(value ?? "")}
					onChange={(v) => onChange(Number(v))}
					hint={field.help}
					disabled={disabled}
				/>
			);
		case "time":
			return (
				<TextField
					className={cls}
					label={field.label}
					type="time"
					value={String(value ?? "")}
					onChange={onChange}
					hint={field.help}
					disabled={disabled}
				/>
			);
		case "money":
			return (
				<MoneyField
					className={cls}
					label={field.label}
					value={typeof value === "number" ? value : ""}
					onChange={onChange}
					hint={field.help}
					disabled={disabled}
				/>
			);
		case "percent":
			return (
				<Field label={field.label} hint={field.help} className={cls}>
					<div className="relative">
						<input
							type="number"
							step="0.5"
							value={String(value ?? "")}
							onChange={(e) => onChange(Number(e.target.value))}
							disabled={disabled}
							className={cn(inputCls, "pr-8")}
						/>
						<span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-sm text-ink-3">
							%
						</span>
					</div>
				</Field>
			);
		case "select":
			return (
				<SelectField
					className={cls}
					label={field.label}
					value={String(value ?? "")}
					onChange={onChange}
					options={field.options ?? []}
					hint={field.help}
					disabled={disabled}
				/>
			);
		case "toggle":
			return (
				<ToggleField
					className={cn("self-end", cls)}
					label={field.label}
					hint={field.help}
					checked={!!value}
					onChange={disabled ? () => undefined : onChange}
				/>
			);
		case "list":
			return (
				<ChipList
					className={cls}
					label={field.label}
					hint={field.help}
					items={(value as string[]) ?? []}
					onChange={onChange}
					disabled={disabled}
				/>
			);
		default:
			return null;
	}
}

function ChipList({
	label,
	hint,
	items,
	onChange,
	disabled,
	className,
}: {
	label: string;
	hint?: string;
	items: string[];
	onChange: (v: string[]) => void;
	disabled: boolean;
	className?: string;
}) {
	const [draft, setDraft] = useState("");
	const add = () => {
		const v = draft.trim();
		if (!v) return;
		onChange([...items, v]);
		setDraft("");
	};
	return (
		<Field
			label={label}
			hint={hint ?? "Items in use are hidden from staff, never deleted"}
			className={className}
		>
			<div className="flex flex-wrap items-center gap-2 rounded-control border border-line px-3 py-2">
				{items.map((it, i) => (
					<span
						key={`${it}-${i}`}
						className="inline-flex items-center gap-1 rounded-pill bg-subtle px-3 py-1 text-xs font-medium text-ink"
					>
						{it}
						{!disabled && (
							<button
								type="button"
								aria-label={`Remove ${it}`}
								onClick={() => onChange(items.filter((_, j) => j !== i))}
								className="text-ink-3 hover:text-danger"
							>
								<XIcon className="size-3" />
							</button>
						)}
					</span>
				))}
				{!disabled && (
					<span className="inline-flex items-center gap-1">
						<input
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									add();
								}
							}}
							placeholder="Add…"
							className="w-32 bg-transparent text-xs text-ink outline-none placeholder:text-ink-3"
						/>
						<button
							type="button"
							onClick={add}
							className="flex size-6 items-center justify-center rounded-md text-brand hover:bg-brand-soft"
							aria-label="Add item"
						>
							<PlusIcon className="size-3" />
						</button>
					</span>
				)}
			</div>
		</Field>
	);
}

"use client";

import { AlertTriangleIcon, ArrowRightLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSetupSection } from "@hospio/api/actions/hotel-config";
import { updateMyBusiness } from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import type { Business } from "@hospio/api/api/schema";
import type { HotelSetupSection } from "@hospio/api/data/types";
import { requestOwnershipTransfer } from "@hospio/api/actions/owner";
import type { TransferRequestRow } from "@hospio/api/data/types";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { fmtWhen } from "@hospio/ui/shared/format";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	FieldRow,
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs, useTabParam } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { SetupField } from "../manager/hotel-setup";

type Tab = "company" | "taxes" | "limits" | "transfer";
const TIMEZONES = [
	"Africa/Lagos",
	"Africa/Accra",
	"Africa/Nairobi",
	"Africa/Johannesburg",
	"Europe/London",
];
const TYPES = [
	"Limited company",
	"Business name (sole proprietor)",
	"Partnership",
	"Other",
];

/**
 * Hotel Owner · 10 Settings (Figma 3087:16697, 3211:33092, 3211:33430). Company → PUT /tenant/businesses/mine;
 * Taxes & currency and Approval limits are hotel-config's owner-only sections for the active hotel.
 */
export function OwnerSettings({
	business,
	hotelName,
	hotelId,
	taxes,
	approvals,
	transfer,
}: {
	business: Business | null;
	hotelName: string;
	hotelId?: string;
	taxes?: HotelSetupSection;
	approvals?: HotelSetupSection;
	/** The latest ownership transfer request to Hospio360 support, if any. */
	transfer: TransferRequestRow | null;
}) {
	const [tab] = useTabParam<Tab>("company");
	const [panel, setPanel] = useState(false);
	const waiting =
		!!transfer &&
		(transfer.status === "OPEN" || transfer.status === "IN_PROGRESS");

	return (
		<>
			<PageHeader
				title="Settings"
				subtitle="Company details apply to every hotel · taxes and approval limits are set per hotel"
			/>
			<PillTabs
				param="tab"
				tabs={[
					{ key: "company", label: "Company" },
					{ key: "taxes", label: "Taxes & currency" },
					{ key: "limits", label: "Approval limits" },
					{ key: "transfer", label: "Transfer ownership" },
				]}
			/>

			{tab === "company" && <CompanyCard business={business} />}
			{tab === "taxes" && (
				<SetupCard
					section={taxes}
					hotelName={hotelName}
					hotelId={hotelId}
					title="Taxes & currency"
					subtitle={`${hotelName} · shown on every receipt`}
					note="Changing VAT applies to new charges only. Open folios keep their posted amounts."
				/>
			)}
			{tab === "limits" && (
				<SetupCard
					section={approvals}
					hotelName={hotelName}
					hotelId={hotelId}
					title="Approval limits"
					subtitle={`${hotelName} · what needs the manager, and what comes to you`}
				/>
			)}
			{tab === "transfer" && (
				<SectionCard
					title="Transfer ownership"
					subtitle={`Hand ${business?.name ?? "this business"} on this platform to someone else`}
					className="border-danger/40"
					bodyClassName="max-w-2xl gap-4 pt-3"
				>
					{transfer && (
						<div className="flex flex-col gap-2 rounded-xl border border-line px-4 py-3">
							<div className="flex items-center justify-between gap-3">
								<p className="text-[13px] font-semibold text-ink">
									{transfer.subject}
								</p>
								<StatusPill tone={waiting ? "info" : "grey"}>
									{transfer.status === "OPEN"
										? "With Hospio360 support"
										: transfer.status === "IN_PROGRESS"
											? "Support is on it"
											: "Closed"}
								</StatusPill>
							</div>
							<p className="text-xs text-ink-3">
								Sent {fmtWhen(transfer.createdAt)}
								{transfer.resolvedAt
									? ` · closed ${fmtWhen(transfer.resolvedAt)}`
									: ""}
							</p>
							{transfer.resolution && (
								<p className="text-[13px] text-ink-2">{transfer.resolution}</p>
							)}
						</div>
					)}
					<Note tone="danger">
						The new owner gets full control of every hotel. Managers and staff
						are not affected.
					</Note>
					<Note tone="info">
						Hospio360 support makes the transfer: this sends them your request, they
						confirm with you and the new owner, then change the owner.
					</Note>
					<Button
						variant="outline"
						className={`${btn.dangerSoft} w-fit`}
						onClick={() => setPanel(true)}
						disabled={waiting}
						title={waiting ? "A request is already with support" : undefined}
					>
						<ArrowRightLeftIcon className="size-4" />{" "}
						{waiting ? "Request sent" : "Start a transfer"}
					</Button>
				</SectionCard>
			)}

			<TransferPanel
				open={panel}
				business={business}
				onClose={() => setPanel(false)}
			/>
		</>
	);
}

function TransferPanel({
	open,
	business,
	onClose,
}: {
	open: boolean;
	business: Business | null;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [confirm, setConfirm] = useState(false);
	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		note: "",
	});
	const set = (k: keyof typeof form, v: string) =>
		setForm((f) => ({ ...f, [k]: v }));
	const emailOk = /^\S+@\S+\.\S+$/.test(form.email.trim());
	const close = () => {
		setConfirm(false);
		onClose();
	};
	return (
		<>
			<SidePanel
				open={open}
				onOpenChange={(o) => !o && close()}
				title="Transfer ownership"
				subtitle={`${business?.name ?? "Your business"} · ${business?.hotelCount ?? business?.hotels?.length ?? 0} hotels`}
				icon={AlertTriangleIcon}
				tone="danger"
				footer={
					<>
						<Button variant="outline" className={btn.secondary} onClick={close}>
							Cancel
						</Button>
						<Button
							className={btn.danger}
							disabled={!form.name.trim() || !emailOk}
							onClick={() => setConfirm(true)}
						>
							Continue
						</Button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<TextField
						label="New owner's full name"
						value={form.name}
						onChange={(v) => set("name", v)}
						required
					/>
					<FieldRow>
						<TextField
							label="New owner's email"
							value={form.email}
							onChange={(v) => set("email", v)}
							type="email"
							placeholder="name@company.com"
							required
						/>
						<TextField
							label="Their phone"
							value={form.phone}
							onChange={(v) => set("phone", v)}
							placeholder="+234 …"
						/>
					</FieldRow>
					<TextareaField
						label="Note for support"
						value={form.note}
						onChange={(v) => set("note", v)}
						rows={3}
						placeholder="Optional · e.g. the business was sold on 1 December"
					/>
					<WhatHappens
						tone="danger"
						items={[
							"Hospio360 support gets an urgent ticket with these details",
							"They confirm with you and the new owner before changing anything",
							"When the transfer is made, the new owner signs in and you lose owner access",
						]}
					/>
				</div>
			</SidePanel>
			<ConfirmModal
				open={confirm}
				onOpenChange={setConfirm}
				title="Send the transfer request?"
				subtitle={`${form.name.trim()} · ${form.email.trim()}`}
				tone="danger"
				confirmLabel="Send to Hospio360 support"
				pending={pending}
				onConfirm={() =>
					run(
						() =>
							requestOwnershipTransfer({
								newOwnerName: form.name,
								newOwnerEmail: form.email,
								newOwnerPhone: form.phone,
								note: form.note,
							}),
						"Transfer request sent to Hospio360 support",
						() => {
							setForm({ name: "", email: "", phone: "", note: "" });
							close();
							router.refresh();
						},
					)
				}
			/>
		</>
	);
}

function CompanyCard({ business }: { business: Business | null }) {
	const router = useRouter();
	const [form, setForm] = useState({
		name: business?.name ?? "",
		legalName: business?.legalName ?? "",
		registrationNumber: business?.registrationNumber ?? "",
		businessType: business?.businessType ?? "",
		address: business?.address ?? "",
		city: business?.city ?? "",
		email: business?.email ?? "",
		phone: business?.phone ?? "",
		timezone: business?.timezone ?? "Africa/Lagos",
	});
	const set = <K extends keyof typeof form>(k: K, v: string) =>
		setForm((f) => ({ ...f, [k]: v }));
	const { run, pending } = useAction();
	return (
		<SectionCard
			title="Company"
			subtitle="Shown on invoices, receipts and statements"
			bodyClassName="max-w-2xl gap-4 pt-3"
		>
			<FieldRow>
				<TextField
					label="Trading name"
					value={form.name}
					onChange={(v) => set("name", v)}
					required
				/>
				<TextField
					label="Registered company name"
					value={form.legalName}
					onChange={(v) => set("legalName", v)}
				/>
			</FieldRow>
			<FieldRow>
				<TextField
					label="RC number"
					value={form.registrationNumber}
					onChange={(v) => set("registrationNumber", v)}
				/>
				<SelectField
					label="Business type"
					value={form.businessType}
					onChange={(v) => set("businessType", v)}
					options={[
						...new Set([
							...TYPES,
							...(form.businessType ? [form.businessType] : []),
						]),
					]}
				/>
			</FieldRow>
			<TextField
				label="Registered address"
				value={form.address}
				onChange={(v) => set("address", v)}
			/>
			<FieldRow>
				<TextField
					label="City"
					value={form.city}
					onChange={(v) => set("city", v)}
				/>
				<SelectField
					label="Time zone"
					value={form.timezone}
					onChange={(v) => set("timezone", v)}
					options={[...new Set([...TIMEZONES, form.timezone])]}
				/>
			</FieldRow>
			<FieldRow>
				<TextField
					label="Owner"
					value={business?.ownerName ?? ""}
					onChange={() => undefined}
					disabled
					hint="Change under Transfer ownership"
				/>
				<TextField
					label="Business email"
					type="email"
					value={form.email}
					onChange={(v) => set("email", v)}
				/>
			</FieldRow>
			<TextField
				label="Business phone"
				type="tel"
				value={form.phone}
				onChange={(v) => set("phone", v)}
			/>
			<div className="flex items-center justify-end gap-3">
				<span className="flex-1 text-xs text-ink-3">
					Currency and taxes live per hotel under Taxes & currency
				</span>
				<Button
					className={btn.primary}
					disabled={pending || form.name.trim().length < 2}
					onClick={() =>
						run(
							() =>
								updateMyBusiness({
									name: form.name.trim(),
									legalName: form.legalName.trim() || null,
									registrationNumber: form.registrationNumber.trim() || null,
									businessType: form.businessType || null,
									address: form.address.trim() || null,
									city: form.city.trim() || null,
									email: form.email.trim() || null,
									phone: form.phone.trim() || null,
									timezone: form.timezone || null,
									logoUrl: business?.logoUrl ?? null,
									brandColour: business?.brandColour ?? null,
								}),
							"Company saved",
							() => router.refresh(),
						)
					}
				>
					Save changes
				</Button>
			</div>
		</SectionCard>
	);
}

/** One hotel-config section (taxes or approvals) edited here for the active hotel; the same fields as Hotel setup. */
function SetupCard({
	section,
	hotelName,
	hotelId,
	title,
	subtitle,
	note,
}: {
	section?: HotelSetupSection;
	hotelName: string;
	hotelId?: string;
	title: string;
	subtitle: string;
	note?: string;
}) {
	const router = useRouter();
	const [values, setValues] = useState<Record<string, unknown>>(() =>
		Object.fromEntries(
			(section?.fields ?? [])
				.filter((f) => f.key !== "status")
				.map((f) => [f.key, f.value]),
		),
	);
	const [dirty, setDirty] = useState(false);
	const { run, pending } = useAction();
	if (!section) {
		return (
			<SectionCard
				title={title}
				subtitle={subtitle}
				bodyClassName="max-w-2xl gap-4 pt-3"
			>
				<Note tone="info">
					Hotel setup could not be loaded for {hotelName}. Try again, or open
					Hotel setup from the sidebar.
				</Note>
			</SectionCard>
		);
	}
	return (
		<SectionCard
			title={title}
			subtitle={subtitle}
			bodyClassName="max-w-2xl gap-4 pt-3"
			headerRight={
				<Link
					href={`/dashboard/hotel-setup/${section.key}`}
					className="text-[13px] font-semibold text-brand hover:underline"
				>
					Open in Hotel setup →
				</Link>
			}
		>
			<Note tone="info">
				These are per hotel. You are editing {hotelName}; switch the hotel in
				the sidebar to set another branch.
			</Note>
			<div className="grid gap-4 md:grid-cols-2">
				{section.fields
					.filter((f) => f.key !== "status")
					.map((f) => (
						<SetupField
							key={f.key}
							field={f}
							value={values[f.key]}
							onChange={(v) => {
								setValues((s) => ({ ...s, [f.key]: v }));
								setDirty(true);
							}}
							disabled={false}
							wide={f.type === "list"}
						/>
					))}
			</div>
			{note && <Note tone="info">{note}</Note>}
			<div className="flex items-center justify-end gap-3">
				<span className="flex-1 text-xs text-ink-3">
					{dirty
						? "Unsaved changes"
						: "Saved · the hotel's manager sees these values but cannot change them"}
				</span>
				<Button
					className={btn.primary}
					disabled={!dirty || pending}
					onClick={() =>
						run(
							() => saveSetupSection(section.key, values, hotelId),
							`${title} saved for ${hotelName}`,
							() => {
								setDirty(false);
								router.refresh();
							},
						)
					}
				>
					Save changes
				</Button>
			</div>
		</SectionCard>
	);
}

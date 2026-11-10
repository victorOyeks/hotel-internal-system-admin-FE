"use client";

import { MessageSquareIcon, PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	pauseStaff,
	reinstateStaff,
	startThread,
	suspendStaff,
	updateStaffDetails,
} from "@hospio/api/actions/owner";
import { useAction } from "@hospio/api/actions/use-action";
import type { StaffRow } from "@hospio/api/data/types";
import { Button } from "@hospio/ui/primitives/button";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	FieldRow,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtLongDate } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";

/**
 * A staff member's account, as the owner (every hotel) and the manager (their hotel) run it: details, a pause for some
 * days, a suspension with a reason, reinstating, and a message. Each calls identity or messaging and shows the service's
 * sentence when it refuses (docs/owner-portal.md).
 */

type Person = Pick<
	StaffRow,
	"fullName" | "email" | "phone" | "jobTitle" | "hotelId"
> & {
	userId?: string;
	id: string;
	hotelName?: string;
};

const uid = (p: Person) => p.userId ?? p.id;

/** The last Lagos day of a pause that ends at `pausedUntil` (the midnight after it). */
export function pauseLastDay(pausedUntil?: string | null): string | null {
	if (!pausedUntil) return null;
	return new Date(Date.parse(pausedUntil) - 1).toLocaleDateString("en-CA", {
		timeZone: "Africa/Lagos",
	});
}

export function EditDetailsModal({
	staff,
	onClose,
}: {
	staff: Person | null;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [form, setForm] = useState({
		fullName: "",
		phone: "",
		email: "",
		jobTitle: "",
	});
	useEffect(() => {
		if (staff)
			setForm({
				fullName: staff.fullName,
				phone: staff.phone ?? "",
				email: staff.email ?? "",
				jobTitle: staff.jobTitle ?? "",
			});
	}, [staff]);
	if (!staff) return null;
	const changes: Record<string, string> = {};
	if (form.fullName.trim() !== staff.fullName)
		changes.fullName = form.fullName.trim();
	if (form.phone.trim() !== (staff.phone ?? ""))
		changes.phone = form.phone.trim();
	if (form.email.trim().toLowerCase() !== (staff.email ?? "").toLowerCase())
		changes.email = form.email.trim();
	if (form.jobTitle.trim() !== (staff.jobTitle ?? ""))
		changes.jobTitle = form.jobTitle.trim();
	const emailOk = /^\S+@\S+\.\S+$/.test(form.email.trim());
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`Edit ${staff.fullName}`}
			subtitle="Name, phone, email and job title"
			icon={PencilIcon}
			size="form"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={
							pending ||
							Object.keys(changes).length === 0 ||
							!form.fullName.trim() ||
							!emailOk
						}
						onClick={() =>
							run(
								() => updateStaffDetails(uid(staff), changes),
								`${form.fullName.trim()} saved`,
								() => {
									onClose();
									router.refresh();
								},
							)
						}
					>
						Save changes
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Full name"
					value={form.fullName}
					onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
					required
				/>
				<FieldRow>
					<TextField
						label="Phone"
						value={form.phone}
						onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
						placeholder="+234 …"
					/>
					<TextField
						label="Email"
						type="email"
						value={form.email}
						onChange={(v) => setForm((f) => ({ ...f, email: v }))}
						hint="They sign in with this"
						required
					/>
				</FieldRow>
				<TextField
					label="Job title"
					value={form.jobTitle}
					onChange={(v) => setForm((f) => ({ ...f, jobTitle: v }))}
					placeholder="e.g. Night auditor"
				/>
				<Note tone="info">
					They are told in the app. A new email is what they sign in with from
					now on.
				</Note>
			</div>
		</Modal>
	);
}

export function PauseModal({
	staff,
	onClose,
}: {
	staff: Person | null;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [days, setDays] = useState("7");
	const [reason, setReason] = useState("");
	const n = Math.floor(Number(days));
	const valid = Number.isFinite(n) && n >= 1 && n <= 90;
	const last = valid
		? new Date(Date.now() + (n - 1) * 86_400_000).toLocaleDateString("en-CA", {
				timeZone: "Africa/Lagos",
			})
		: null;
	return (
		<ConfirmModal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			title={`Pause ${staff?.fullName}?`}
			subtitle="Their access stops now and comes back by itself"
			confirmLabel={
				valid ? `Pause for ${n === 1 ? "1 day" : `${n} days`}` : "Pause"
			}
			pending={pending}
			onConfirm={() =>
				staff &&
				valid &&
				run(
					() => pauseStaff(uid(staff), n, reason),
					`${staff.fullName} is paused until ${last ? fmtLongDate(last) : "then"}`,
					() => {
						onClose();
						setReason("");
						router.refresh();
					},
				)
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Days"
					type="number"
					value={days}
					onChange={setDays}
					hint={
						valid && last
							? `Back on ${fmtLongDate(new Date(Date.parse(`${last}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10))}`
							: "1 to 90 days"
					}
				/>
				<TextareaField
					label="Reason"
					value={reason}
					onChange={setReason}
					rows={2}
					placeholder="e.g. Family emergency · optional"
				/>
				<WhatHappens
					items={[
						"They are signed out of every device and can't sign in until the pause ends",
						"Their access comes back by itself after the last day, or when you resume it",
						"The managers of their hotels are told",
					]}
				/>
			</div>
		</ConfirmModal>
	);
}

export function SuspendStaffModal({
	staff,
	onClose,
	onPauseInstead,
}: {
	staff: Person | null;
	onClose: () => void;
	onPauseInstead?: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [reason, setReason] = useState("");
	return (
		<ConfirmModal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			tone="danger"
			title={`Suspend ${staff?.fullName}?`}
			subtitle="Until you reinstate them · logged with your reason"
			confirmLabel="Suspend"
			pending={pending}
			onConfirm={() => {
				if (!staff) return;
				if (reason.trim().length < 3) {
					run(
						async () => ({
							ok: false as const,
							error: `Say why ${staff.fullName} is suspended`,
						}),
						"",
					);
					return;
				}
				run(
					() => suspendStaff(uid(staff), reason.trim()),
					`${staff.fullName} suspended`,
					() => {
						onClose();
						setReason("");
						router.refresh();
					},
				);
			}}
			alternative={
				onPauseInstead
					? { label: "Pause for a few days instead", onClick: onPauseInstead }
					: undefined
			}
		>
			<div className="flex flex-col gap-4">
				<WhatHappens
					tone="danger"
					items={[
						"They are signed out of every device and can't sign in until reinstated",
						"Their history (shifts, payments they took) is kept",
						"The managers of their hotels are told",
					]}
				/>
				<TextareaField
					label="Reason (required)"
					value={reason}
					onChange={setReason}
					rows={3}
					placeholder="What happened"
				/>
			</div>
		</ConfirmModal>
	);
}

export function ReinstateModal({
	staff,
	until,
	onClose,
}: {
	staff: Person | null;
	/** Set when a timed pause is being ended early. */
	until?: string | null;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	return (
		<ConfirmModal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			title={`Let ${staff?.fullName} sign in again?`}
			subtitle={
				until
					? `Paused until ${fmtLongDate(until)}`
					: "Lifts the suspension or pause now"
			}
			confirmLabel={until ? "End the pause now" : "Reinstate"}
			pending={pending}
			onConfirm={() =>
				staff &&
				run(
					() => reinstateStaff(uid(staff)),
					`${staff.fullName} can sign in again`,
					() => {
						onClose();
						router.refresh();
					},
				)
			}
		>
			<WhatHappens
				items={[
					"Every role they hold works again",
					"They are told in the app",
					"The managers of their hotels are told",
				]}
			/>
		</ConfirmModal>
	);
}

export function MessageStaffModal({
	staff,
	onClose,
}: {
	staff: Person | null;
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const [body, setBody] = useState("");
	const [whatsapp, setWhatsapp] = useState(false);
	if (!staff) return null;
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			icon={MessageSquareIcon}
			title={`Message ${staff.fullName.split(" ")[0]}`}
			subtitle={
				staff.hotelName
					? `${staff.fullName} · ${staff.hotelName}`
					: staff.fullName
			}
			size="form"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={!body.trim() || pending}
						onClick={() =>
							run(
								() =>
									withDeliveries(
										startThread({
											hotelId: staff.hotelId,
											toUserId: uid(staff),
											body,
											whatsapp,
										}),
										`Message to ${staff.fullName}`,
									),
								`Message sent to ${staff.fullName}`,
								() => {
									setBody("");
									onClose();
								},
							)
						}
					>
						Send
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextareaField
					label="Message"
					value={body}
					onChange={setBody}
					rows={4}
					placeholder="Please come 30 minutes early tomorrow…"
				/>
				<ToggleField
					label="WhatsApp copy (coming soon)"
					hint={
						staff.phone
							? `${staff.phone} · not connected yet: the text is shown on screen to copy`
							: "No phone on file: in the app only"
					}
					checked={whatsapp && !!staff.phone}
					onChange={(v) => setWhatsapp(v && !!staff.phone)}
				/>
				<Note tone="info">
					They get it in the app (Inbox) and can reply there.
				</Note>
			</div>
		</Modal>
	);
}

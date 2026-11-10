"use client";

import { FileTextIcon, MessageSquareIcon, SendIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	useHotelActions,
	useHotelScope,
} from "@hospio/api/actions/hotel-scope";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	GuestChannel,
	MessageTemplateRow,
} from "@hospio/api/data/guest-message-types";
import { Button } from "@hospio/ui/primitives/button";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	SelectField,
	TextField,
	TextareaField,
} from "@hospio/ui/shared/field";
import { Modal } from "@hospio/ui/shared/modal";
import { btn } from "@hospio/ui/shared/ui";

export type GuestToMessage = {
	bookingId: string;
	guestId?: string;
	guestName: string;
	guestEmail?: string | null;
	guestPhone?: string | null;
	reference?: string;
};

/** The channel choices: email is sent; WhatsApp and SMS are saved and shown on screen (coming soon). */
export function channelOptions(email?: string | null, phone?: string | null) {
	return [
		{
			value: "EMAIL" as GuestChannel,
			label: "Email",
			hint: email ? email : "No email on file",
			disabled: !email,
		},
		{
			value: "WHATSAPP" as GuestChannel,
			label: "WhatsApp · coming soon",
			hint: phone ? "Shown on screen to copy" : "No phone on file",
			disabled: !phone,
		},
		{
			value: "SMS" as GuestChannel,
			label: "SMS · coming soon",
			hint: phone ? "Shown on screen to copy" : "No phone on file",
			disabled: !phone,
		},
	];
}

/**
 * Message a guest about their booking (Front office and Manager · Bookings, Owner · Bookings through HotelScope). The
 * message goes into the booking's conversation in Messages. Templates are the hotel's, filled from the booking.
 */
export function GuestMessageModal({
	guest,
	onClose,
}: {
	guest: GuestToMessage | null;
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const { messageGuest, messageTemplates, fillTemplate } = useHotelActions();
	const { hotelName } = useHotelScope();
	const [channel, setChannel] = useState<GuestChannel>("EMAIL");
	const [templates, setTemplates] = useState<MessageTemplateRow[]>([]);
	const [template, setTemplate] = useState("");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [missing, setMissing] = useState<string[]>([]);
	const bookingId = guest?.bookingId;

	useEffect(() => {
		if (!guest) return;
		setChannel(
			guest.guestEmail ? "EMAIL" : guest.guestPhone ? "WHATSAPP" : "EMAIL",
		);
		setTemplate("");
		setBody("");
		setMissing([]);
		setSubject(hotelName ? `Your stay at ${hotelName}` : "About your stay");
		let live = true;
		messageTemplates()
			.then((r) => live && r.ok && setTemplates(r.data))
			.catch(() => undefined);
		return () => {
			live = false;
		};
	}, [bookingId]);

	if (!guest) return null;
	const contact = channel === "EMAIL" ? guest.guestEmail : guest.guestPhone;
	const connected = channel === "EMAIL";

	const pick = async (id: string) => {
		setTemplate(id);
		if (!id) return;
		const r = await fillTemplate(id, { bookingId: guest.bookingId });
		if (!r.ok) {
			toast.error(r.error);
			return;
		}
		setBody(r.data.body);
		if (r.data.subject) setSubject(r.data.subject);
		setMissing(r.data.missing);
	};

	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`Message ${guest.guestName}`}
			subtitle={guest.reference ? `Booking ${guest.reference}` : undefined}
			icon={MessageSquareIcon}
			size="form"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !body.trim() || !contact}
						onClick={() =>
							run(
								() =>
									withDeliveries(
										messageGuest({
											bookingId: guest.bookingId,
											guestId: guest.guestId,
											guestName: guest.guestName,
											contact: contact ?? "",
											channel,
											subject: connected ? subject : undefined,
											body,
										}),
										`Message to ${guest.guestName}`,
									),
								(d) =>
									d.note ??
									(connected
										? `Email sent to ${contact}`
										: "Saved · copy it to the guest"),
								() => {
									setBody("");
									onClose();
								},
							)
						}
					>
						<SendIcon className="size-4" />{" "}
						{connected ? "Send email" : "Save and show to copy"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards
					label="Send by"
					value={channel}
					onChange={setChannel}
					columns={3}
					options={channelOptions(guest.guestEmail, guest.guestPhone)}
				/>
				{!connected && (
					<Note tone="warning">
						WhatsApp and SMS are coming soon. The message is saved in the
						conversation and shown on screen so you can copy it to the guest.
					</Note>
				)}
				<SelectField
					label="Start from a template"
					value={template}
					onChange={(v) => void pick(v)}
					placeholder={
						templates.length
							? "Blank message"
							: "No templates yet (Messages → Templates)"
					}
					options={templates.map((t) => ({ value: t.id, label: t.name }))}
				/>
				{connected && (
					<TextField label="Subject" value={subject} onChange={setSubject} />
				)}
				<TextareaField
					label="Message"
					value={body}
					onChange={setBody}
					rows={6}
					placeholder="Type the message…"
				/>
				{missing.length > 0 && (
					<Note tone="info">
						<FileTextIcon className="mr-1 inline size-3" /> This booking has no{" "}
						{missing.map((m) => m.replace(/_/g, " ")).join(", ")} yet; replace{" "}
						{missing.map((m) => `{{${m}}}`).join(", ")} before sending.
					</Note>
				)}
			</div>
		</Modal>
	);
}

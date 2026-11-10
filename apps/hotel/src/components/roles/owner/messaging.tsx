"use client";

import { MegaphoneIcon, MessageSquareIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	parseAsInteger,
	parseAsString,
	useQueryState,
	useQueryStates,
} from "nuqs";
import { useState } from "react";
import { messageAllManagers, startThread } from "@hospio/api/actions/owner";
import { useAction } from "@hospio/api/actions/use-action";
import type { PageResult } from "@hospio/api/data/paging";
import type { OwnerThreadRow } from "@hospio/api/data/types";
import { Button } from "@hospio/ui/primitives/button";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	SelectField,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn as btnStyle } from "@hospio/ui/shared/ui";
import { ThreadsView } from "../shared-staff/threads";
import { HotelFilter } from "./common";

type Hotel = { hotelId: string; name: string };
export type ManagerContact = {
	userId: string;
	fullName: string;
	phone?: string;
	hotelId: string;
	hotelName: string;
};

/**
 * Hotel Owner · Messaging: the owner's staff threads across every hotel. Write to one manager, to a hotel (its managers)
 * or to every manager at once (one thread each); replies come back here. Guests are messaged from Bookings.
 */
export function OwnerMessaging({
	threads,
	hotels,
	managers,
}: {
	threads: PageResult<OwnerThreadRow>;
	hotels: Hotel[];
	managers: ManagerContact[];
}) {
	const [open, setOpen] = useQueryState("open", parseAsString);
	// The hotel filter goes to the server (that hotel's threads), so a change reads the list again from page 1.
	const [{ hotel }, setFilter] = useQueryStates(
		{ hotel: parseAsString, page: parseAsInteger },
		{ shallow: false, history: "push" },
	);
	const setHotel = (v: string | null) =>
		void setFilter({ hotel: v, page: null });
	const [compose, setCompose] = useState(false);
	const [all, setAll] = useState(false);
	const people = [...new Map(managers.map((m) => [m.userId, m])).values()];

	return (
		<>
			<PageHeader
				title="Messaging"
				subtitle="Your managers and teams · guests are messaged from Bookings"
			>
				<Button
					variant="outline"
					className={btnStyle.secondary}
					onClick={() => setAll(true)}
					disabled={people.length === 0}
				>
					<MegaphoneIcon className="size-4" /> Message all managers
				</Button>
				<Button
					className={btnStyle.primary}
					onClick={() => setCompose(true)}
					disabled={hotels.length === 0}
				>
					<PlusIcon className="size-4" /> New message
				</Button>
			</PageHeader>
			<ThreadsView
				result={threads}
				filtered={!!hotel}
				onClearFilters={() => setHotel(null)}
				openId={open}
				onOpen={(id) => void setOpen(id)}
				emptyTitle={hotel ? "No messages at this hotel" : "No messages yet"}
				emptyHint="Start one with New message"
				toolbar={
					<HotelFilter
						hotels={hotels}
						value={hotel ?? ""}
						onChange={(v) => setHotel(v || null)}
					/>
				}
			/>
			<NewMessagePanel
				open={compose}
				hotels={hotels}
				managers={managers}
				defaultHotel={hotel ?? ""}
				onClose={() => setCompose(false)}
				onSent={(id) => void setOpen(id)}
			/>
			<MessageAllModal
				open={all}
				managers={people}
				onClose={() => setAll(false)}
			/>
		</>
	);
}

/** To one manager (at their hotel) or to a hotel's managers as a group. */
function NewMessagePanel({
	open,
	hotels,
	managers,
	defaultHotel,
	onClose,
	onSent,
}: {
	open: boolean;
	hotels: Hotel[];
	managers: ManagerContact[];
	defaultHotel: string;
	onClose: () => void;
	onSent: (threadId: string) => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [to, setTo] = useState("");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [whatsapp, setWhatsapp] = useState(false);
	const options = [
		...managers.map((m) => ({
			value: `person:${m.userId}:${m.hotelId}`,
			label: m.fullName,
			hint: `Manager · ${m.hotelName}`,
		})),
		...hotels.map((h) => ({
			value: `hotel:${h.hotelId}`,
			label: `${h.name} · managers`,
			hint: "Every manager of the hotel",
		})),
	];
	const choice =
		to || (defaultHotel ? `hotel:${defaultHotel}` : (options[0]?.value ?? ""));
	const [kind, id, hotelOfPerson] = choice.split(":");
	const hotelId = kind === "hotel" ? id : hotelOfPerson;
	const label = options.find((o) => o.value === choice)?.label ?? "";
	const reset = () => {
		setTo("");
		setSubject("");
		setBody("");
		setWhatsapp(false);
	};
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="New message"
			subtitle="To a manager, or to every manager of a hotel"
			icon={MessageSquareIcon}
			footerInfo="They see it in the app (Inbox) and reply there"
			footer={
				<>
					<Button
						variant="outline"
						className={btnStyle.secondary}
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button
						className={btnStyle.primary}
						disabled={pending || !body.trim() || !hotelId}
						onClick={() =>
							run(
								() =>
									withDeliveries(
										startThread({
											hotelId,
											toUserId: kind === "person" ? id : undefined,
											toHotelManagers: kind === "hotel",
											subject,
											body,
											whatsapp,
										}),
										`Message to ${label}`,
									),
								`Message sent to ${label}`,
								(r) => {
									reset();
									onClose();
									onSent(r.thread.id);
									router.refresh();
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
				<SelectField
					label="To"
					value={choice}
					onChange={setTo}
					options={options}
				/>
				{options.length === hotels.length && (
					<Note tone="info">
						None of your hotels has a manager yet. Add one on Staff.
					</Note>
				)}
				<TextField
					label="Subject"
					value={subject}
					onChange={setSubject}
					placeholder="Optional · the start of the message if empty"
				/>
				<TextareaField
					label="Message"
					value={body}
					onChange={setBody}
					rows={6}
				/>
				<ToggleField
					label="WhatsApp copy (coming soon)"
					hint="WhatsApp isn't connected yet: the text is shown on screen to copy to their phone"
					checked={whatsapp}
					onChange={setWhatsapp}
				/>
			</div>
		</SidePanel>
	);
}

function MessageAllModal({
	open,
	managers,
	onClose,
}: {
	open: boolean;
	managers: ManagerContact[];
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [whatsapp, setWhatsapp] = useState(false);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Message all managers"
			subtitle={`${plural(managers.length, "manager")} · ${managers.map((m) => m.fullName.split(" ")[0]).join(", ")}`}
			icon={MegaphoneIcon}
			size="form"
			footer={
				<>
					<Button
						variant="outline"
						className={btnStyle.secondary}
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button
						className={btnStyle.primary}
						disabled={pending || !body.trim()}
						onClick={() =>
							run(
								() =>
									withDeliveries(
										messageAllManagers({ subject, body, whatsapp }),
										"Message to every manager",
									),
								(r) => `Sent to ${plural(r.count, "manager")}`,
								() => {
									setSubject("");
									setBody("");
									setWhatsapp(false);
									onClose();
									router.refresh();
								},
							)
						}
					>
						Send to all
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Subject"
					value={subject}
					onChange={setSubject}
					placeholder="Optional"
				/>
				<TextareaField
					label="Message"
					value={body}
					onChange={setBody}
					rows={5}
					placeholder="e.g. December rate proposals by Friday please"
				/>
				<ToggleField
					label="WhatsApp copy (coming soon)"
					hint="WhatsApp isn't connected yet: the text is shown on screen to copy to their phone"
					checked={whatsapp}
					onChange={setWhatsapp}
				/>
				<WhatHappens
					items={[
						"Each manager gets it as a separate conversation",
						"Replies come back to you one by one",
					]}
				/>
			</div>
		</Modal>
	);
}

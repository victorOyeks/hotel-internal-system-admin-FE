"use client";

import { BuildingIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createHotel, updateHotel } from "@hospio/api/actions/tenant";
import type { Hotel } from "@hospio/api/api/schema";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { FieldRow, TextField } from "@hospio/ui/shared/field";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import {
	checkAddress,
	checkCity,
	checkEmail,
	checkName,
	checkPhone,
	checkTime,
	only,
} from "@hospio/ui/shared/validate";
import { cn } from "@hospio/ui/utils";
import type { WizardCtx } from "./wizard";
import {
	nextStep,
	prevStep,
	ResultLine,
	StepFrame,
	useWizardSave,
	type WizardHotel,
} from "./shared";

/**
 * J5 · step 4: the business's hotels, each created on tenant with `businessId`; the step saves `{hotelIds}`. A hotel needs
 * a name with letters (one name per business), a real city and both times; address, phone and email are checked when typed.
 */

const toWizardHotel = (h: Hotel, prev?: WizardHotel): WizardHotel => ({
	id: h.id,
	name: h.name,
	city: h.city ?? "",
	address: h.address ?? "",
	rooms: h.roomCount || prev?.rooms || 0,
	timezone: h.timezone ?? "Africa/Lagos",
	occupancy: prev?.occupancy ?? 0,
	manager: prev?.manager ?? "—",
	phone: h.phone ?? undefined,
	email: h.email ?? undefined,
	checkInTime: h.checkInTime ?? undefined,
	checkOutTime: h.checkOutTime ?? undefined,
});

export function HotelsStep({ ctx }: { ctx: WizardCtx }) {
	const { business, hotels } = ctx;
	const [panel, setPanel] = useState<"new" | WizardHotel | null>(null);
	const { pending, busy } = useWizardSave();

	const save = () =>
		busy(async () => {
			const row = await ctx.saveStep("hotels", {
				hotelIds: hotels.map((h) => h.id),
			});
			if (row) {
				ctx.setBusiness({ ...business, hotels: hotels.length });
				ctx.goTo(nextStep("hotels"));
			}
		});

	return (
		<StepFrame
			step="hotels"
			onBack={() => ctx.goTo(prevStep("hotels"))}
			onContinue={ctx.editable ? save : undefined}
			continueDisabled={hotels.length === 0}
			pending={pending}
			footerNote={
				hotels.length === 0
					? "Add at least one hotel to continue."
					: `Currency ${business.currency ?? "NGN"} · time zone ${business.timezone ?? "Africa/Lagos"}.`
			}
		>
			<DataTable
				data={hotels}
				columns={[
					{
						accessorKey: "name",
						header: "Hotel",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.name}
								secondary={row.original.city || "—"}
							/>
						),
					},
					{
						accessorKey: "address",
						header: "Address",
						cell: ({ row }) => (
							<span className="text-ink-2">{row.original.address || "—"}</span>
						),
					},
					{
						id: "times",
						header: "Check-in · out",
						cell: ({ row }) => (
							<span>
								{row.original.checkInTime ?? "14:00"} ·{" "}
								{row.original.checkOutTime ?? "12:00"}
							</span>
						),
					},
					{ accessorKey: "rooms", header: "Rooms" },
					{
						id: "edit",
						header: "",
						cell: ({ row }) =>
							ctx.editable ? (
								<button
									type="button"
									className={cn(
										btn.secondary,
										btn.small,
										"flex items-center gap-1",
									)}
									onClick={() => setPanel(row.original)}
								>
									<PencilIcon className="size-3" /> Edit
								</button>
							) : null,
					},
				]}
				emptyTitle="No hotels yet"
				emptyHint="Each hotel gets its own setup, staff and rooms."
			/>
			{ctx.editable && (
				<div>
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => setPanel("new")}
					>
						<PlusIcon className="size-4" /> Add a hotel
					</button>
				</div>
			)}
			{hotels.length > 0 && (
				<ResultLine tone="muted">
					{hotels.length} {hotels.length === 1 ? "hotel" : "hotels"} ·{" "}
					{hotels.reduce((s, h) => s + h.rooms, 0)} rooms so far
				</ResultLine>
			)}

			<HotelPanel
				open={panel !== null}
				onOpenChange={(o) => !o && setPanel(null)}
				businessId={business.id}
				hotel={panel === "new" ? null : panel}
				defaultCity={business.city}
				others={hotels.filter((h) => panel === "new" || h.id !== panel?.id)}
				onSaved={(h, prev) => {
					ctx.setHotels((list) =>
						prev
							? list.map((x) => (x.id === prev.id ? toWizardHotel(h, prev) : x))
							: [...list, toWizardHotel(h)],
					);
					setPanel(null);
				}}
			/>
		</StepFrame>
	);
}

/** Add or edit a hotel: name, city, address, contacts, check-in and check-out times. */
export function HotelPanel({
	open,
	onOpenChange,
	businessId,
	hotel,
	defaultCity,
	others = [],
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	businessId: string;
	hotel: WizardHotel | null;
	defaultCity?: string;
	/** The business's other hotels: a name already used is refused (one name per business). */
	others?: WizardHotel[];
	onSaved: (saved: Hotel, prev: WizardHotel | null) => void;
}) {
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title={hotel ? `Edit ${hotel.name}` : "Add a hotel"}
			subtitle={
				hotel
					? "Name, address, contacts and times"
					: "A new hotel with default setup; rooms come in the next step"
			}
			icon={BuildingIcon}
			width="md"
		>
			{open && (
				<HotelForm
					key={hotel?.id ?? "new"}
					businessId={businessId}
					hotel={hotel}
					defaultCity={defaultCity}
					others={others}
					onCancel={() => onOpenChange(false)}
					onSaved={onSaved}
				/>
			)}
		</SidePanel>
	);
}

type HotelField =
	| "name"
	| "city"
	| "address"
	| "phone"
	| "email"
	| "checkIn"
	| "checkOut";

/** Which field a refusal from tenant-service is about. */
function hotelFieldOf(message: string): HotelField | null {
	if (/hotel called|hotel name/i.test(message)) return "name";
	if (/city/i.test(message)) return "city";
	if (/address/i.test(message)) return "address";
	if (/phone/i.test(message)) return "phone";
	if (/email/i.test(message)) return "email";
	if (/check-in/i.test(message)) return "checkIn";
	if (/check-out/i.test(message)) return "checkOut";
	return null;
}

function HotelForm({
	businessId,
	hotel,
	defaultCity,
	others,
	onCancel,
	onSaved,
}: {
	businessId: string;
	hotel: WizardHotel | null;
	defaultCity?: string;
	others: WizardHotel[];
	onCancel: () => void;
	onSaved: (saved: Hotel, prev: WizardHotel | null) => void;
}) {
	const [name, setName] = useState(hotel?.name ?? "");
	const [city, setCity] = useState(hotel?.city ?? defaultCity ?? "");
	const [address, setAddress] = useState(hotel?.address ?? "");
	const [phone, setPhone] = useState(hotel?.phone ?? "");
	const [email, setEmail] = useState(hotel?.email ?? "");
	const [checkIn, setCheckIn] = useState(hotel?.checkInTime ?? "14:00");
	const [checkOut, setCheckOut] = useState(hotel?.checkOutTime ?? "12:00");
	const [errors, setErrors] = useState<Partial<Record<HotelField, string>>>({});
	const { pending, busy } = useWizardSave();
	const edit = (set: (v: string) => void, field: HotelField) => (v: string) => {
		set(v);
		if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
	};

	const submit = () =>
		busy(async () => {
			const key = name.trim().replace(/\s+/g, " ").toLowerCase();
			const twin = others.find(
				(h) => h.name.trim().replace(/\s+/g, " ").toLowerCase() === key,
			);
			const found = only({
				name:
					checkName(name, "the hotel name") ??
					(twin
						? `This business already has a hotel called ${twin.name}. Give this one a different name`
						: undefined),
				city: checkCity(city),
				address: checkAddress(address, false),
				phone: checkPhone(phone, false),
				email: checkEmail(email, false),
				checkIn: checkTime(checkIn, "check-in"),
				checkOut: checkTime(checkOut, "check-out"),
			});
			setErrors(found);
			if (Object.keys(found).length) return;
			const input = {
				name: name.trim(),
				city: city.trim(),
				address: address.trim() || null,
				phone: phone.trim() || null,
				email: email.trim() || null,
				timezone: hotel?.timezone ?? "Africa/Lagos",
				checkInTime: checkIn,
				checkOutTime: checkOut,
				businessId,
			};
			const result = hotel
				? await updateHotel(hotel.id, input)
				: await createHotel(input);
			if (!result.ok) {
				const field = hotelFieldOf(result.error);
				if (field) setErrors({ [field]: result.error });
				else toast.error(result.error, { duration: 8000 });
				return;
			}
			toast.success(hotel ? "Hotel saved" : "Hotel added");
			onSaved(result.data, hotel);
		});

	return (
		<div className="flex h-full flex-col gap-5">
			{Object.keys(errors).length > 0 && (
				<p className="text-xs font-medium text-danger" role="alert">
					Fix the fields marked in red to {hotel ? "save" : "add"} the hotel.
				</p>
			)}
			<PanelSection title="Hotel">
				<TextField
					label="Hotel name"
					value={name}
					onChange={edit(setName, "name")}
					placeholder="e.g. Abuja Palms Wuse"
					required
					error={errors.name}
				/>
				<FieldRow>
					<TextField
						label="City"
						value={city}
						onChange={edit(setCity, "city")}
						placeholder="e.g. Abuja"
						required
						error={errors.city}
					/>
					<TextField
						label="Address"
						value={address}
						onChange={edit(setAddress, "address")}
						placeholder="e.g. Plot 41 Aminu Kano Cres, Wuse 2"
						error={errors.address}
					/>
				</FieldRow>
			</PanelSection>
			<PanelSection title="Contact">
				<FieldRow>
					<TextField
						label="Phone"
						value={phone}
						onChange={edit(setPhone, "phone")}
						placeholder="e.g. +234 803 555 0192"
						error={errors.phone}
					/>
					<TextField
						label="Email"
						type="email"
						value={email}
						onChange={edit(setEmail, "email")}
						placeholder="e.g. wuse@abujapalms.ng"
						error={errors.email}
					/>
				</FieldRow>
			</PanelSection>
			<PanelSection title="Times">
				<FieldRow>
					<TextField
						label="Check-in"
						type="time"
						value={checkIn}
						onChange={edit(setCheckIn, "checkIn")}
						required
						error={errors.checkIn}
					/>
					<TextField
						label="Check-out"
						type="time"
						value={checkOut}
						onChange={edit(setCheckOut, "checkOut")}
						required
						error={errors.checkOut}
					/>
				</FieldRow>
			</PanelSection>
			<div className="mt-auto flex items-center justify-end gap-2 border-t border-line pt-4">
				<button
					type="button"
					className={btn.secondary}
					onClick={onCancel}
					disabled={pending}
				>
					Cancel
				</button>
				<button
					type="button"
					className={btn.primary}
					onClick={submit}
					disabled={pending}
				>
					{hotel ? "Save hotel" : "Add hotel"}
				</button>
			</div>
		</div>
	);
}

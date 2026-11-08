"use client";

import { useState } from "react";
import { updateBusiness } from "@hospio/api/actions/tenant";
import { feeModelLabels } from "@hospio/api/data/mappers/tenant";
import {
	ChoiceCards,
	FieldRow,
	MoneyField,
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import { Note } from "@hospio/ui/shared/detail-list";
import type { WizardCtx } from "./wizard";
import {
	businessRequestFrom,
	nextStep,
	refreshBusiness,
	prevStep,
	StepCard,
	StepFrame,
	useWizardSave,
	type WizardData,
} from "./shared";

/** J2–J4 · steps 1–3 write the business (PUT /tenant/businesses/{id}) then save the step's form. */

const BUSINESS_TYPES = [
	"Limited company",
	"Business name",
	"Sole proprietor",
	"Partnership",
	"Other",
];
const TIMEZONES = [
	"Africa/Lagos",
	"Africa/Accra",
	"Africa/Nairobi",
	"Europe/London",
];

export function BusinessStep({ ctx }: { ctx: WizardCtx }) {
	const { business, data } = ctx;
	const saved = data.business;
	const [name, setName] = useState(saved?.name ?? business.name);
	const [legalName, setLegalName] = useState(
		saved?.legalName ?? business.legalName ?? "",
	);
	const [registrationNumber, setReg] = useState(
		saved?.registrationNumber ?? business.registrationNumber ?? "",
	);
	const [businessType, setType] = useState(
		saved?.businessType ?? business.businessType ?? "",
	);
	const [address, setAddress] = useState(
		saved?.address ?? business.address ?? "",
	);
	const [city, setCity] = useState(saved?.city ?? business.city ?? "");
	const [email, setEmail] = useState(business.email ?? "");
	const [phone, setPhone] = useState(business.phone ?? "");
	const [timezone, setTimezone] = useState(
		saved?.timezone ?? business.timezone ?? "Africa/Lagos",
	);
	const { pending, call, busy } = useWizardSave();
	const valid = name.trim().length > 1 && city.trim().length > 0;

	const save = () =>
		busy(async () => {
			const patch = {
				name: name.trim(),
				legalName: legalName.trim() || null,
				registrationNumber: registrationNumber.trim() || null,
				businessType: businessType || null,
				address: address.trim() || null,
				city: city.trim() || null,
				email: email.trim() || null,
				phone: phone.trim() || null,
				timezone,
			};
			const b = await call(() =>
				updateBusiness(business.id, businessRequestFrom(business, patch)),
			);
			if (!b) return;
			ctx.setBusiness(refreshBusiness(business, b));
			const row = await ctx.saveStep("business", {
				name: patch.name,
				legalName: patch.legalName ?? undefined,
				registrationNumber: patch.registrationNumber ?? undefined,
				businessType: patch.businessType ?? undefined,
				address: patch.address ?? undefined,
				city: patch.city ?? undefined,
				country: business.country ?? "NG",
				timezone,
			});
			if (row) ctx.goTo(nextStep("business"));
		});

	return (
		<StepFrame
			step="business"
			onContinue={ctx.editable ? save : undefined}
			continueDisabled={!valid}
			pending={pending}
		>
			<StepCard title="Business">
				<FieldRow>
					<TextField
						label="Trading name"
						value={name}
						onChange={setName}
						placeholder="Abuja Palms"
						required
					/>
					<TextField
						label="Registered name"
						value={legalName}
						onChange={setLegalName}
						placeholder="Abuja Palms Hotels Ltd"
						hint="As on the CAC certificate"
					/>
				</FieldRow>
				<FieldRow>
					<TextField
						label="CAC / registration number"
						value={registrationNumber}
						onChange={setReg}
						placeholder="RC 1873402"
					/>
					<SelectField
						label="Business type"
						value={businessType}
						onChange={setType}
						options={BUSINESS_TYPES}
						placeholder="Choose…"
					/>
				</FieldRow>
				<TextField
					label="Head office address"
					value={address}
					onChange={setAddress}
					placeholder="Plot 41 Aminu Kano Crescent, Wuse 2, Abuja"
				/>
				<FieldRow>
					<TextField
						label="City"
						value={city}
						onChange={setCity}
						placeholder="Abuja"
						required
					/>
					<SelectField
						label="Time zone"
						value={timezone}
						onChange={setTimezone}
						options={TIMEZONES}
					/>
				</FieldRow>
			</StepCard>
			<StepCard
				title="Business contact"
				subtitle="Where statements and notices go. The owner's own contact is the next step."
			>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={email}
						onChange={setEmail}
						placeholder="accounts@abujapalms.ng"
					/>
					<TextField
						label="Phone"
						value={phone}
						onChange={setPhone}
						placeholder="+234 …"
					/>
				</FieldRow>
			</StepCard>
		</StepFrame>
	);
}

export function OwnerStep({ ctx }: { ctx: WizardCtx }) {
	const { business, data } = ctx;
	const saved = data.owner;
	const [ownerName, setOwnerName] = useState(
		saved?.ownerName ?? (business.ownerName === "—" ? "" : business.ownerName),
	);
	const [ownerEmail, setOwnerEmail] = useState(
		saved?.ownerEmail ?? business.ownerEmail ?? "",
	);
	const [ownerPhone, setOwnerPhone] = useState(
		saved?.ownerPhone ?? business.ownerPhone ?? "",
	);
	const [contactName, setContactName] = useState(saved?.contactName ?? "");
	const [contactEmail, setContactEmail] = useState(saved?.contactEmail ?? "");
	const [contactPhone, setContactPhone] = useState(saved?.contactPhone ?? "");
	const { pending, call, busy } = useWizardSave();
	const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim());
	const valid = ownerName.trim().length > 1 && emailOk;

	const save = () =>
		busy(async () => {
			const patch = {
				ownerName: ownerName.trim(),
				ownerEmail: ownerEmail.trim().toLowerCase(),
				ownerPhone: ownerPhone.trim() || null,
			};
			const b = await call(() =>
				updateBusiness(business.id, businessRequestFrom(business, patch)),
			);
			if (!b) return;
			ctx.setBusiness(refreshBusiness(business, b));
			const stepData: NonNullable<WizardData["owner"]> = {
				ownerName: patch.ownerName,
				ownerEmail: patch.ownerEmail,
				ownerPhone: patch.ownerPhone ?? undefined,
				contactName: contactName.trim() || undefined,
				contactEmail: contactEmail.trim() || undefined,
				contactPhone: contactPhone.trim() || undefined,
			};
			const row = await ctx.saveStep("owner", stepData);
			if (row) ctx.goTo(nextStep("owner"));
		});

	return (
		<StepFrame
			step="owner"
			onBack={() => ctx.goTo(prevStep("owner"))}
			onContinue={ctx.editable ? save : undefined}
			continueDisabled={!valid}
			pending={pending}
		>
			<StepCard
				title="Owner"
				subtitle="Gets the handover pack and the owner login. The email is their sign-in."
			>
				<TextField
					label="Full name"
					value={ownerName}
					onChange={setOwnerName}
					placeholder="Musa Danladi"
					required
				/>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={ownerEmail}
						onChange={setOwnerEmail}
						placeholder="musa@abujapalms.ng"
						required
						error={
							ownerEmail && !emailOk
								? "That does not look like an email"
								: undefined
						}
					/>
					<TextField
						label="Phone"
						value={ownerPhone}
						onChange={setOwnerPhone}
						placeholder="+234 803 000 0000"
					/>
				</FieldRow>
				{business.stage !== "ONBOARDING" && (
					<Note tone="info">
						The owner's login already exists. Changing the email here does not
						change their sign-in.
					</Note>
				)}
			</StepCard>
			<StepCard
				title="Second contact"
				subtitle="Optional · a co-owner or general manager we can call. Kept on the onboarding notes only."
			>
				<TextField
					label="Full name"
					value={contactName}
					onChange={setContactName}
					placeholder="Hauwa Danladi"
				/>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={contactEmail}
						onChange={setContactEmail}
						placeholder="hauwa@abujapalms.ng"
					/>
					<TextField
						label="Phone"
						value={contactPhone}
						onChange={setContactPhone}
						placeholder="+234 …"
					/>
				</FieldRow>
			</StepCard>
		</StepFrame>
	);
}

const FEE_MODELS = [
	{
		value: "PERCENT_OF_PAYMENTS",
		label: feeModelLabels.PERCENT_OF_PAYMENTS,
		hint: "A share of every guest payment taken through H.M.S",
	},
	{
		value: "PER_ROOM_NIGHT",
		label: feeModelLabels.PER_ROOM_NIGHT,
		hint: "A fixed naira amount for each room night sold",
	},
	{
		value: "PERCENT_OF_BOOKINGS",
		label: feeModelLabels.PERCENT_OF_BOOKINGS,
		hint: "A share of the booking value, whatever is paid",
	},
] as const;
type FeeModelKey = (typeof FEE_MODELS)[number]["value"];
const isFeeModel = (v: unknown): v is FeeModelKey =>
	FEE_MODELS.some((m) => m.value === v);

export function FeeStep({ ctx }: { ctx: WizardCtx }) {
	const { business, data } = ctx;
	const saved = data.fee;
	const [feeModel, setFeeModel] = useState<FeeModelKey>(
		isFeeModel(saved?.feeModel)
			? saved.feeModel
			: isFeeModel(business.feeModelKey)
				? business.feeModelKey
				: "PERCENT_OF_PAYMENTS",
	);
	const initialValue = saved?.feeValue ?? business.feeValue ?? 0;
	const [pct, setPct] = useState(initialValue ? String(initialValue) : "");
	const [amount, setAmount] = useState<number | "">(initialValue || "");
	const [contractStartsOn, setStartsOn] = useState(
		saved?.contractStartsOn ?? business.contractStartsOn ?? "",
	);
	const [contractNotes, setNotes] = useState(
		saved?.contractNotes ?? business.contractNotes ?? "",
	);
	const { pending, call, busy } = useWizardSave();
	const perNight = feeModel === "PER_ROOM_NIGHT";
	const feeValue = perNight
		? amount === ""
			? 0
			: amount
		: Number(pct.replace(",", "."));
	const valid =
		Number.isFinite(feeValue) && feeValue > 0 && (perNight || feeValue <= 100);

	const save = () =>
		busy(async () => {
			const patch = {
				feeModel,
				feeValue,
				contractStartsOn: contractStartsOn || null,
				contractNotes: contractNotes.trim() || null,
			};
			const b = await call(() =>
				updateBusiness(business.id, businessRequestFrom(business, patch)),
			);
			if (!b) return;
			ctx.setBusiness(refreshBusiness(business, b));
			const row = await ctx.saveStep("fee", {
				feeModel,
				feeValue,
				currency: business.currency ?? "NGN",
				contractStartsOn: patch.contractStartsOn ?? undefined,
				contractNotes: patch.contractNotes ?? undefined,
				marketerId: business.marketerId,
			});
			if (row) ctx.goTo(nextStep("fee"));
		});

	return (
		<StepFrame
			step="fee"
			onBack={() => ctx.goTo(prevStep("fee"))}
			onContinue={ctx.editable ? save : undefined}
			continueDisabled={!valid}
			pending={pending}
		>
			<StepCard
				title="Fee model"
				subtitle="How H.M.S is paid. Statements are produced monthly from this."
			>
				<ChoiceCards
					value={feeModel}
					onChange={setFeeModel}
					options={[...FEE_MODELS]}
				/>
				{perNight ? (
					<MoneyField
						label="Fee per room night"
						value={amount}
						onChange={setAmount}
						required
						hint="Charged on every room night sold"
					/>
				) : (
					<TextField
						label="Share (%)"
						value={pct}
						onChange={setPct}
						placeholder="1.5"
						required
						hint="Between 0 and 100"
						error={
							pct && !valid ? "Enter a percentage between 0 and 100" : undefined
						}
					/>
				)}
			</StepCard>
			<StepCard title="Contract">
				<FieldRow>
					<TextField
						label="Agreement starts on"
						type="date"
						value={contractStartsOn}
						onChange={setStartsOn}
					/>
					<SelectField
						label="Referred by"
						value={business.marketerId ?? ""}
						onChange={() => undefined}
						options={
							business.marketerId
								? [
										{
											value: business.marketerId,
											label: business.marketer ?? "Marketer",
										},
									]
								: []
						}
						placeholder="Nobody · direct"
						disabled
						hint="Set when the business was created"
					/>
				</FieldRow>
				<TextareaField
					label="Contract notes"
					value={contractNotes}
					onChange={setNotes}
					placeholder="First 30 days free · reviewed every 12 months"
					rows={3}
				/>
			</StepCard>
		</StepFrame>
	);
}

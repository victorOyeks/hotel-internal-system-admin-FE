"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateBusiness } from "@hospio/api/actions/tenant";
import type { BusinessRequest } from "@hospio/api/api/schema";
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
import {
	checkAddress,
	checkCity,
	checkEmail,
	checkName,
	checkPercent,
	checkPerNight,
	checkPhone,
	checkRegistration,
	only,
} from "@hospio/ui/shared/validate";
import type { WizardCtx } from "./wizard";
import {
	nextStep,
	refreshBusiness,
	prevStep,
	StepCard,
	StepFrame,
	useWizardSave,
	type WizardData,
} from "./shared";

/**
 * J2–J4 · steps 1–3 write the business (PUT /tenant/businesses/{id}, only the step's own fields) then save the step's
 * form. Every field is checked before saving (names with letters, a real city, address, email, phone, a CAC number,
 * a share from 0 to 100) and the API refuses the same; a refusal about one field shows under it.
 */

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

/** The step's field errors: one sentence per field, the same rules the API applies (tenant's Fields.java). */
type Errors<K extends string> = Partial<Record<K, string>>;

/**
 * Saves a step's business fields; a refusal about one field (a duplicate CAC number, a taken email) is shown under it,
 * anything else is toasted. Returns the saved business, or null.
 */
async function saveFields<K extends string>(
	ctx: WizardCtx,
	patch: Partial<BusinessRequest>,
	fieldOf: (message: string) => K | null,
	setErrors: (e: Errors<K>) => void,
) {
	const result = await updateBusiness(ctx.business.id, patch);
	if (!result.ok) {
		const field = fieldOf(result.error);
		if (field) setErrors({ [field]: result.error } as Errors<K>);
		else toast.error(result.error, { duration: 8000 });
		return null;
	}
	ctx.setBusiness(refreshBusiness(ctx.business, result.data));
	return result.data;
}

/** Clears one field's message as soon as it is edited. */
function editor<K extends string>(
	errors: Errors<K>,
	setErrors: (f: (e: Errors<K>) => Errors<K>) => void,
) {
	return (set: (v: string) => void, field: K) => (v: string) => {
		set(v);
		if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
	};
}

type BusinessField =
	| "name"
	| "legalName"
	| "registrationNumber"
	| "address"
	| "city"
	| "email"
	| "phone";

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
	const [errors, setErrors] = useState<Errors<BusinessField>>({});
	const edit = editor(errors, setErrors);
	const { pending, busy } = useWizardSave();

	const save = () =>
		busy(async () => {
			const found = only({
				name: checkName(name, "the trading name"),
				legalName: checkName(legalName, "the registered name", 120, false),
				registrationNumber: checkRegistration(registrationNumber),
				address: checkAddress(address, false),
				city: checkCity(city),
				email: checkEmail(email, false),
				phone: checkPhone(phone, false),
			});
			setErrors(found);
			if (Object.keys(found).length) return;
			// Blank optional fields are sent as "" so a cleared value is cleared; the API refuses anything meaningless.
			const patch = {
				name: name.trim(),
				legalName: legalName.trim(),
				registrationNumber: registrationNumber.trim(),
				businessType: businessType || "",
				address: address.trim(),
				city: city.trim(),
				email: email.trim(),
				phone: phone.trim(),
				timezone,
			};
			const b = await saveFields<BusinessField>(
				ctx,
				patch,
				(m) =>
					/CAC/i.test(m)
						? "registrationNumber"
						: /registered name/i.test(m)
							? "legalName"
							: /trading name|business called/i.test(m)
								? "name"
								: /address/i.test(m)
									? "address"
									: /city/i.test(m)
										? "city"
										: /email/i.test(m)
											? "email"
											: /phone/i.test(m)
												? "phone"
												: null,
				setErrors,
			);
			if (!b) return;
			const row = await ctx.saveStep("business", {
				name: b.name,
				legalName: b.legalName ?? undefined,
				registrationNumber: b.registrationNumber ?? undefined,
				businessType: b.businessType ?? undefined,
				address: b.address ?? undefined,
				city: b.city ?? undefined,
				country: business.country ?? "NG",
				timezone,
			});
			if (row) ctx.goTo(nextStep("business"));
		});

	return (
		<StepFrame
			step="business"
			onContinue={ctx.editable ? save : undefined}
			pending={pending}
			footerNote={
				Object.keys(errors).length
					? "Fix the fields marked in red to continue."
					: undefined
			}
		>
			<StepCard title="Business">
				<FieldRow>
					<TextField
						label="Trading name"
						value={name}
						onChange={edit(setName, "name")}
						placeholder="e.g. Abuja Palms"
						required
						error={errors.name}
					/>
					<TextField
						label="Registered name"
						value={legalName}
						onChange={edit(setLegalName, "legalName")}
						placeholder="e.g. Abuja Palms Hotels Ltd"
						hint="As on the CAC certificate"
						error={errors.legalName}
					/>
				</FieldRow>
				<FieldRow>
					<TextField
						label="CAC / registration number"
						value={registrationNumber}
						onChange={edit(setReg, "registrationNumber")}
						placeholder="e.g. RC 1873402"
						hint="RC, BN or IT and the digits; one business per number"
						error={errors.registrationNumber}
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
					onChange={edit(setAddress, "address")}
					placeholder="e.g. Plot 41 Aminu Kano Crescent, Wuse 2, Abuja"
					error={errors.address}
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
						onChange={edit(setEmail, "email")}
						placeholder="e.g. accounts@abujapalms.ng"
						error={errors.email}
					/>
					<TextField
						label="Phone"
						value={phone}
						onChange={edit(setPhone, "phone")}
						placeholder="e.g. +234 803 555 0192"
						error={errors.phone}
					/>
				</FieldRow>
			</StepCard>
		</StepFrame>
	);
}

type OwnerField =
	| "ownerName"
	| "ownerEmail"
	| "ownerPhone"
	| "contactName"
	| "contactEmail"
	| "contactPhone";

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
	const [errors, setErrors] = useState<Errors<OwnerField>>({});
	const edit = editor(errors, setErrors);
	const { pending, busy } = useWizardSave();

	const save = () =>
		busy(async () => {
			// The second contact is optional: blank is fine, anything typed must be real.
			const found = only({
				ownerName: checkName(ownerName, "the owner's full name"),
				ownerEmail: checkEmail(ownerEmail),
				ownerPhone: checkPhone(ownerPhone, false),
				contactName: checkName(contactName, "the contact's name", 120, false),
				contactEmail: checkEmail(contactEmail, false),
				contactPhone: checkPhone(contactPhone, false),
			});
			setErrors(found);
			if (Object.keys(found).length) return;
			const patch = {
				ownerName: ownerName.trim(),
				ownerEmail: ownerEmail.trim().toLowerCase(),
				ownerPhone: ownerPhone.trim(),
			};
			const b = await saveFields<OwnerField>(
				ctx,
				patch,
				(m) =>
					/already has an account|email/i.test(m)
						? "ownerEmail"
						: /phone/i.test(m)
							? "ownerPhone"
							: /name/i.test(m)
								? "ownerName"
								: null,
				setErrors,
			);
			if (!b) return;
			const stepData: NonNullable<WizardData["owner"]> = {
				ownerName: patch.ownerName,
				ownerEmail: patch.ownerEmail,
				ownerPhone: patch.ownerPhone || undefined,
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
			pending={pending}
			footerNote={
				Object.keys(errors).length
					? "Fix the fields marked in red to continue."
					: undefined
			}
		>
			<StepCard
				title="Owner"
				subtitle="Gets the handover pack and the owner login. The email is their sign-in."
			>
				<TextField
					label="Full name"
					value={ownerName}
					onChange={edit(setOwnerName, "ownerName")}
					placeholder="e.g. Musa Danladi"
					required
					error={errors.ownerName}
				/>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={ownerEmail}
						onChange={edit(setOwnerEmail, "ownerEmail")}
						placeholder="e.g. musa@abujapalms.ng"
						required
						error={errors.ownerEmail}
					/>
					<TextField
						label="Phone"
						value={ownerPhone}
						onChange={edit(setOwnerPhone, "ownerPhone")}
						placeholder="e.g. +234 803 555 0192"
						error={errors.ownerPhone}
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
					onChange={edit(setContactName, "contactName")}
					placeholder="e.g. Hauwa Danladi"
					error={errors.contactName}
				/>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={contactEmail}
						onChange={edit(setContactEmail, "contactEmail")}
						placeholder="e.g. hauwa@abujapalms.ng"
						error={errors.contactEmail}
					/>
					<TextField
						label="Phone"
						value={contactPhone}
						onChange={edit(setContactPhone, "contactPhone")}
						placeholder="e.g. +234 803 555 0193"
						error={errors.contactPhone}
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
		hint: "A share of every guest payment taken through Hospio360",
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
	// Only the value saved for this business is shown, and only under its own model; switching model starts empty.
	const savedModel = isFeeModel(saved?.feeModel)
		? saved.feeModel
		: business.feeModelKey;
	const savedValue = saved?.feeValue ?? business.feeValue;
	// A business with no fee model has no fee yet (the row maps a missing value to 0, which is not a choice).
	const hasSaved =
		(saved?.feeValue !== null && saved?.feeValue !== undefined) ||
		!!business.feeModelKey;
	const [pct, setPct] = useState(
		hasSaved && savedModel !== "PER_ROOM_NIGHT" ? String(savedValue) : "",
	);
	const [amount, setAmount] = useState<number | "">(
		hasSaved && savedModel === "PER_ROOM_NIGHT" ? Number(savedValue) : "",
	);
	const [contractStartsOn, setStartsOn] = useState(
		saved?.contractStartsOn ?? business.contractStartsOn ?? "",
	);
	const [contractNotes, setNotes] = useState(
		saved?.contractNotes ?? business.contractNotes ?? "",
	);
	const [error, setError] = useState<string | undefined>();
	const { pending, busy } = useWizardSave();
	const perNight = feeModel === "PER_ROOM_NIGHT";

	const save = () =>
		busy(async () => {
			const problem = perNight ? checkPerNight(amount) : checkPercent(pct);
			setError(problem);
			if (problem) return;
			const feeValue = perNight
				? (amount as number)
				: Number(pct.trim().replace(",", "."));
			const patch = {
				feeModel,
				feeValue,
				contractStartsOn: contractStartsOn || null,
				contractNotes: contractNotes.trim(),
			};
			const b = await saveFields<"fee">(
				ctx,
				patch,
				(m) => (/share|fee|percent/i.test(m) ? "fee" : null),
				(e) => setError(e.fee),
			);
			if (!b) return;
			const row = await ctx.saveStep("fee", {
				feeModel,
				feeValue,
				currency: business.currency ?? "NGN",
				contractStartsOn: patch.contractStartsOn ?? undefined,
				contractNotes: patch.contractNotes || undefined,
				marketerId: business.marketerId,
			});
			if (row) ctx.goTo(nextStep("fee"));
		});

	return (
		<StepFrame
			step="fee"
			onBack={() => ctx.goTo(prevStep("fee"))}
			onContinue={ctx.editable ? save : undefined}
			pending={pending}
		>
			<StepCard
				title="Fee model"
				subtitle="How Hospio360 is paid. Statements are produced monthly from this."
			>
				<ChoiceCards
					value={feeModel}
					onChange={(m) => {
						setFeeModel(m);
						setError(undefined);
					}}
					options={[...FEE_MODELS]}
				/>
				{perNight ? (
					<MoneyField
						label="Fee per room night"
						value={amount}
						onChange={(v) => {
							setAmount(v);
							setError(undefined);
						}}
						placeholder="e.g. 1,500"
						required
						error={error}
						hint="₦0 to ₦1,000,000, charged on every room night sold"
					/>
				) : (
					<TextField
						label="Share (%)"
						value={pct}
						onChange={(v) => {
							setPct(v);
							setError(undefined);
						}}
						placeholder="e.g. 1.5"
						required
						hint="0 to 100, up to two decimals"
						error={error}
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

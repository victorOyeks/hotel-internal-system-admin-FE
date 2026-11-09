"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveMyOnboardingStep } from "@hospio/api/actions/onboarding";
import { updateMyBusiness } from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import type { Business, Me } from "@hospio/api/api/schema";
import type { OwnerOnboardingData } from "@hospio/api/types";
import { FieldRow, SelectField, TextField } from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { SideCard, StepCard, StepFooter, StepPage } from "./common";
import { useFreshOnOpen, useSaveLater, useStepForm } from "./persist";
import { stepHref } from "./steps";
import {
	checkAddress,
	checkCity,
	checkEmail,
	checkName,
	checkPhone,
	only,
} from "./validate";

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

/** Step 1 · Your business (Figma 3164:16113) → PUT /tenant/businesses/mine, then the draft. */
export function BusinessStep({
	business,
	draft,
	user,
}: {
	business: Business | null;
	draft: OwnerOnboardingData;
	user: Me | null;
}) {
	const router = useRouter();
	const saved = draft.business;
	useFreshOnOpen();
	const { form, update, forget } = useStepForm("business", user?.id, {
		name: saved?.name ?? business?.name ?? "",
		legalName: saved?.legalName ?? business?.legalName ?? "",
		registrationNumber:
			saved?.registrationNumber ?? business?.registrationNumber ?? "",
		businessType:
			saved?.businessType ?? business?.businessType ?? "Limited company",
		email: saved?.email ?? business?.email ?? user?.email ?? "",
		phone: saved?.phone ?? business?.phone ?? user?.phoneNumber ?? "",
		address: saved?.address ?? business?.address ?? "",
		city: saved?.city ?? business?.city ?? "",
		timezone: saved?.timezone ?? business?.timezone ?? "Africa/Lagos",
	});
	const set = <K extends keyof typeof form>(k: K, v: string) =>
		update({ [k]: v } as Partial<typeof form>);
	const { run, pending } = useAction();
	const [errors, setErrors] = useState<
		Partial<Record<keyof typeof form, string>>
	>({});

	const check = () =>
		only({
			name: checkName(form.name, "the trading name"),
			legalName: form.legalName.trim()
				? checkName(form.legalName, "the registered name", 160)
				: undefined,
			email: checkEmail(form.email),
			phone: checkPhone(form.phone),
			address: checkAddress(form.address),
			city: checkCity(form.city),
		});

	async function save() {
		const body = {
			name: form.name.trim(),
			legalName: form.legalName.trim() || null,
			registrationNumber: form.registrationNumber.trim() || null,
			businessType: form.businessType || null,
			email: form.email.trim() || null,
			phone: form.phone.trim() || null,
			address: form.address.trim() || null,
			city: form.city.trim() || null,
			timezone: form.timezone || null,
			logoUrl: business?.logoUrl ?? null,
			brandColour: business?.brandColour ?? null,
		};
		const r = await updateMyBusiness(body);
		if (!r.ok) return r;
		const step = await saveMyOnboardingStep("business", {
			name: body.name,
			legalName: body.legalName ?? undefined,
			registrationNumber: body.registrationNumber ?? undefined,
			businessType: body.businessType ?? undefined,
			email: body.email ?? undefined,
			phone: body.phone ?? undefined,
			address: body.address ?? undefined,
			city: body.city ?? undefined,
			timezone: body.timezone ?? undefined,
		});
		if (step.ok) forget();
		return step;
	}

	function submit() {
		const e = check();
		setErrors(e);
		if (Object.keys(e).length) return;
		run(save, "Business saved", () => router.push(stepHref("hotel")));
	}

	useSaveLater(async () => {
		if (Object.keys(check()).length) return "kept";
		return (await save()).ok ? "saved" : "failed";
	});

	const receiptName = form.name.trim() || "Your trading name";
	const legal = [form.legalName.trim(), form.registrationNumber.trim()]
		.filter(Boolean)
		.join(" · ");

	return (
		<StepPage
			aside={
				<>
					<SideCard eyebrow="How it looks on a receipt">
						<div className="flex items-center gap-3">
							<span className="flex size-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
								{receiptName.slice(0, 1).toUpperCase()}
							</span>
							<div className="min-w-0">
								<p className="truncate text-[13px] font-bold text-ink">
									{receiptName}
								</p>
								<p className="truncate text-[11px] text-ink-3">
									{legal || "Registered name · RC number"}
								</p>
							</div>
						</div>
						<div className="mt-1 flex flex-col gap-1 border-t border-line pt-2 text-[11px]">
							<p className="flex justify-between">
								<span>Room · 2 nights</span>
								<span className="font-semibold text-ink">{naira(137000)}</span>
							</p>
							<p className="flex justify-between">
								<span>VAT (7.5%, included)</span>
								<span className="font-semibold text-ink">{naira(9558)}</span>
							</p>
						</div>
					</SideCard>
					<SideCard title="Why we ask">
						<p>
							Your registered name and RC number go on invoices to organizations
							and on tax reports.
						</p>
						<p>Nothing here is shared publicly except your trading name.</p>
						<p>
							Currency and taxes are set per hotel, in Hotel setup → Taxes &
							currency, once your first hotel exists.
						</p>
					</SideCard>
				</>
			}
		>
			<StepCard
				step="business"
				title="Tell us about your business"
				intro="This is the company that owns the hotels. Guests see your trading name; tax documents use the registered name."
			>
				<form
					className="flex flex-col gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						submit();
					}}
				>
					<FieldRow>
						<TextField
							label="Trading name (what guests see)"
							value={form.name}
							onChange={(v) => set("name", v)}
							placeholder="Simpas Hotels"
							required
							error={errors.name}
						/>
						<TextField
							label="Registered company name"
							value={form.legalName}
							onChange={(v) => set("legalName", v)}
							placeholder="Royal Suites Ltd"
							error={errors.legalName}
							hint="Optional"
						/>
					</FieldRow>
					<FieldRow>
						<TextField
							label="RC number"
							value={form.registrationNumber}
							onChange={(v) => set("registrationNumber", v)}
							placeholder="RC 1458823"
							hint="Optional"
						/>
						<SelectField
							label="Business type"
							value={form.businessType}
							onChange={(v) => set("businessType", v)}
							options={TYPES}
						/>
					</FieldRow>
					<TextField
						label="Head office address"
						value={form.address}
						onChange={(v) => set("address", v)}
						placeholder="14 Adeola Odeku Street, Victoria Island, Lagos"
						required
						error={errors.address}
					/>
					<FieldRow>
						<TextField
							label="City"
							value={form.city}
							onChange={(v) => set("city", v)}
							placeholder="Lagos"
							required
							error={errors.city}
						/>
						<SelectField
							label="Time zone"
							value={form.timezone}
							onChange={(v) => set("timezone", v)}
							options={TIMEZONES}
						/>
					</FieldRow>
					<FieldRow>
						<TextField
							label="Business email"
							type="email"
							value={form.email}
							onChange={(v) => set("email", v)}
							placeholder="hello@simpashotels.com"
							required
							error={errors.email}
							hint="On receipts and invoices"
						/>
						<TextField
							label="Business phone"
							type="tel"
							value={form.phone}
							onChange={(v) => set("phone", v)}
							placeholder="+234 803 555 0192"
							required
							error={errors.phone}
						/>
					</FieldRow>
					<StepFooter
						label="Continue"
						pending={pending}
						onContinue={submit}
						info="Saved to your business now · you can change any of it in Settings → Company"
					/>
				</form>
			</StepCard>
		</StepPage>
	);
}

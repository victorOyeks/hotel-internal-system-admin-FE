"use client";

import { CheckIcon } from "lucide-react";
import { useState } from "react";
import type { AdminOnboardingStep } from "@hospio/api/types";
import { TextareaField } from "@hospio/ui/shared/field";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { cn } from "@hospio/ui/utils";
import { GuestMessagePlans } from "../guest-messages";
import type { WizardCtx } from "./wizard";
import {
	nextStep,
	prevStep,
	StepCard,
	StepFrame,
	useWizardSave,
	type WizardData,
} from "./shared";

/** J12 · step 9: the go-live checklist, computed from the business, its hotels, logins and the draft. */

type Check = {
	key: string;
	label: string;
	done: boolean;
	detail?: string;
	step: AdminOnboardingStep;
};

export function goLiveChecks(ctx: WizardCtx): Check[] {
	const { business, hotels, users, data } = ctx;
	const logins = data.people?.logins ?? [];
	const managers = new Set([
		...users.filter((u) => u.role === "MANAGER").map((u) => u.userId),
		...logins.filter((l) => l.role === "MANAGER").map((l) => l.userId),
	]).size;
	const withRooms = hotels.filter((h) => h.rooms > 0).length;
	const applied = new Set(data.template?.appliedTo ?? []);
	const templated = hotels.filter((h) => applied.has(h.id)).length;
	const numbers = data.connections?.whatsappByHotel ?? {};
	const withWhatsapp = hotels.filter(
		(h) =>
			(
				numbers[h.id] ??
				(h.id === hotels[0]?.id ? data.connections?.whatsappNumber : "") ??
				""
			).trim().length > 0,
	).length;
	const feeOk = !!business.feeModelKey && business.feeValue > 0;
	const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(business.ownerEmail ?? "");
	return [
		{
			key: "business",
			label: "Business details complete",
			done:
				!!business.name &&
				!!business.city &&
				(ctx.draft.completedSteps.includes("business") || !!business.address),
			detail:
				[business.legalName, business.registrationNumber, business.city]
					.filter(Boolean)
					.join(" · ") || "Name, city and address",
			step: "business",
		},
		{
			key: "owner",
			label: "Owner contact set",
			done: business.ownerName !== "—" && emailOk,
			detail: emailOk
				? `${business.ownerName} · ${business.ownerEmail}`
				: "Owner name and a valid email",
			step: "owner",
		},
		{
			key: "fee",
			label: "Fee model set",
			done: feeOk,
			detail: feeOk
				? `${business.feeModel} · ${business.feeModel.includes("%") ? `${business.feeValue}%` : `₦${business.feeValue.toLocaleString("en-NG")}`}`
				: "Choose a fee model and value",
			step: "fee",
		},
		{
			key: "hotels",
			label: "At least one hotel",
			done: hotels.length > 0,
			detail: `${hotels.length} ${hotels.length === 1 ? "hotel" : "hotels"}`,
			step: "hotels",
		},
		{
			key: "rooms",
			label: "Every hotel has rooms",
			done: hotels.length > 0 && withRooms === hotels.length,
			detail: `${withRooms} of ${hotels.length} hotels · ${hotels.reduce((s, h) => s + h.rooms, 0)} rooms`,
			step: "rooms",
		},
		{
			key: "template",
			label: "Hotel setup applied from a template",
			done: hotels.length > 0 && templated === hotels.length,
			detail: `${templated} of ${hotels.length} hotels`,
			step: "template",
		},
		{
			key: "manager",
			label: "At least one manager login",
			done: managers > 0,
			detail: `${managers} ${managers === 1 ? "manager" : "managers"} · ${users.length + logins.filter((l) => !users.some((u) => u.userId === l.userId)).length} people in all`,
			step: "people",
		},
		{
			key: "whatsapp",
			label: "WhatsApp number on every hotel",
			done: hotels.length > 0 && withWhatsapp === hotels.length,
			detail: `${withWhatsapp} of ${hotels.length} hotels`,
			step: "connections",
		},
	];
}

export function GoLiveStep({ ctx }: { ctx: WizardCtx }) {
	const checks = goLiveChecks(ctx);
	const [notes, setNotes] = useState(ctx.data.golive?.notes ?? "");
	const { pending, busy } = useWizardSave();
	const done = checks.filter((c) => c.done).length;
	const ready = done === checks.length;

	const save = () =>
		busy(async () => {
			const stepData: NonNullable<WizardData["golive"]> = {
				checks: checks.map(({ key, label, done, detail }) => ({
					key,
					label,
					done,
					detail,
				})),
				notes: notes.trim() || undefined,
				readyAt: new Date().toISOString(),
			};
			const row = await ctx.saveStep(
				"golive",
				stepData,
				ready
					? "Send the handover to the owner"
					: `Finish the go-live checklist (${checks.length - done} left)`,
			);
			if (row) ctx.goTo(nextStep("golive"));
		});

	return (
		<StepFrame
			step="golive"
			onBack={() => ctx.goTo(prevStep("golive"))}
			onContinue={ctx.editable ? save : undefined}
			continueLabel="Mark ready for handover"
			pending={pending}
			footerNote={
				ready
					? "Everything is in place. The next step makes the owner's login and hands the business over."
					: `${checks.length - done} ${checks.length - done === 1 ? "item" : "items"} still open. You can continue, but the owner will find gaps.`
			}
		>
			<StepCard
				title={`${ctx.business.name} · ${done} of ${checks.length} ready`}
				subtitle="Click an item to go to its step"
			>
				<ProgressBar
					value={done}
					max={checks.length}
					tone={ready ? "success" : "brand"}
				/>
				<ul className="flex flex-col">
					{checks.map((c, i) => (
						<li
							key={c.key}
							className={cn(i < checks.length - 1 && "border-b border-line")}
						>
							<button
								type="button"
								onClick={() => ctx.goTo(c.step)}
								className="flex w-full items-center gap-3 py-3 text-left hover:bg-subtle/60"
							>
								<span
									className={cn(
										"flex size-5 shrink-0 items-center justify-center rounded-md border",
										c.done
											? "border-brand bg-brand text-white"
											: "border-line-strong bg-card",
									)}
								>
									{c.done && <CheckIcon className="size-3" />}
								</span>
								<span className="min-w-0 flex-1">
									<span
										className={cn(
											"block text-[13px] font-medium",
											c.done ? "text-ink" : "text-warning",
										)}
									>
										{c.label}
									</span>
									{c.detail && (
										<span className="block text-xs text-ink-3">{c.detail}</span>
									)}
								</span>
							</button>
						</li>
					))}
				</ul>
			</StepCard>
			<StepCard
				title="Notes for the handover"
				subtitle="Training date, who was on the call, anything the owner should know"
			>
				<TextareaField
					label="Notes"
					value={notes}
					onChange={setNotes}
					rows={3}
					placeholder="Training Thu 2 Oct, 10am at the Wuse hotel · taxes checked with the accountant"
				/>
			</StepCard>
			<GuestMessagePlans
				businessId={ctx.business.id}
				hotels={ctx.hotels.map((h) => ({ id: h.id, name: h.name }))}
				title="Guest messages · opt in?"
				subtitle="Ask the owner: booking emails, SMS and WhatsApp to guests are a paid service, billed monthly per hotel. Switch on the hotels that want it."
			/>
		</StepFrame>
	);
}

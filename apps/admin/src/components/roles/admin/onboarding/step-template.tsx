"use client";

import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { applyTemplate } from "@hospio/api/actions/hotel-config";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { ChoiceCards } from "@hospio/ui/shared/field";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { cn } from "@hospio/ui/utils";
import type { WizardCtx } from "./wizard";
import {
	KeyRow,
	nextStep,
	prevStep,
	StepCard,
	StepFrame,
	useWizardSave,
} from "./shared";

/** J8 · step 6: pick a setup template and the hotels to apply it to (POST /hotel-config/setup/apply-template per hotel). */

const SECTION_LABELS: Record<string, string> = {
	BASICS: "Times & basics",
	BRAND: "Brand",
	STAY_RULES: "Stay rules",
	PAYMENTS: "Payments",
	TAXES_CURRENCY: "Taxes & currency",
	APPROVAL_LIMITS: "Approval limits",
	HOUSEKEEPING: "Housekeeping",
	OUTLETS: "Restaurants & bars",
	MESSAGING: "Guest messages",
	STAFF: "Staff",
	NIGHT_AUDIT: "Night audit",
	POS: "POS",
	lists: "Reasons & lists",
};

/** "checkInTime 14:00 · checkOutTime 12:00" for one section of a template. */
function describe(section: string, value: unknown): string {
	if (!value || typeof value !== "object") return String(value ?? "");
	if (section === "lists")
		return Object.entries(value as Record<string, unknown>)
			.map(
				([k, v]) =>
					`${k.toLowerCase().replace(/_/g, " ")} (${Array.isArray(v) ? v.length : 0})`,
			)
			.join(" · ");
	return Object.entries(value as Record<string, unknown>)
		.map(
			([k, v]) =>
				`${k
					.replace(/([A-Z])/g, " $1")
					.toLowerCase()
					.replace(/pct$/, " %")
					.trim()} ${typeof v === "boolean" ? (v ? "on" : "off") : String(v)}`,
		)
		.join(" · ");
}

export function TemplateStep({ ctx }: { ctx: WizardCtx }) {
	const { hotels, templates, data } = ctx;
	const saved = data.template;
	const [templateId, setTemplateId] = useState(
		saved?.templateId ?? templates[0]?.id ?? "",
	);
	const [picked, setPicked] = useState<string[]>(hotels.map((h) => h.id));
	const [appliedTo, setAppliedTo] = useState<string[]>(saved?.appliedTo ?? []);
	const { pending, call, busy } = useWizardSave();
	const template = templates.find((t) => t.id === templateId);
	const toggle = (id: string) =>
		setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

	const apply = () =>
		busy(async () => {
			if (!templateId) {
				toast.error("Choose a template");
				return;
			}
			const done: string[] = [...appliedTo];
			for (const hotelId of picked) {
				const ok = await call(() => applyTemplate({ templateId }, hotelId));
				if (ok === null) break;
				if (!done.includes(hotelId)) done.push(hotelId);
			}
			setAppliedTo(done);
			const applied = picked.filter((id) => done.includes(id)).length;
			if (applied > 0)
				toast.success(
					`${template?.name ?? "Template"} applied to ${applied} ${applied === 1 ? "hotel" : "hotels"}`,
				);
			const row = await ctx.saveStep("template", {
				templateId,
				appliedTo: done,
			});
			if (row && applied === picked.length) ctx.goTo(nextStep("template"));
		});

	const skip = () =>
		busy(async () => {
			const row = await ctx.saveStep("template", {
				templateId: saved?.templateId,
				appliedTo,
			});
			if (row) ctx.goTo(nextStep("template"));
		});

	return (
		<StepFrame
			step="template"
			subtitle={
				hotels.length > 1
					? `Start from a ready setup, then change anything · applies to the hotels you tick`
					: undefined
			}
			onBack={() => ctx.goTo(prevStep("template"))}
			onContinue={ctx.editable ? apply : undefined}
			continueLabel={
				picked.length === 0
					? "Save and continue"
					: `Apply to ${picked.length} ${picked.length === 1 ? "hotel" : "hotels"} and continue`
			}
			continueDisabled={!templateId || hotels.length === 0}
			pending={pending}
			extra={
				ctx.editable && appliedTo.length > 0 ? (
					<button
						type="button"
						className="text-[13px] font-semibold text-brand hover:underline"
						onClick={skip}
						disabled={pending}
					>
						Continue without re-applying
					</button>
				) : undefined
			}
			footerNote="Each hotel already answers with the default setup; the template changes what differs. Anything can be changed later in Hotel setup."
		>
			{templates.length === 0 ? (
				<EmptyState
					title="No templates yet"
					hint="The hotels keep the default setup. Continue and adjust each hotel in Hotel setup."
				/>
			) : (
				<StepCard title="Choose a template">
					<ChoiceCards
						value={templateId}
						onChange={setTemplateId}
						options={templates.map((t) => ({
							value: t.id,
							label: t.name,
							hint: t.description,
						}))}
					/>
				</StepCard>
			)}

			{template && (
				<StepCard
					title="What it fills in"
					subtitle="You can open any of these in Hotel setup to change them"
				>
					<div>
						{Object.entries(template.settings).map(
							([section, value], i, arr) => (
								<KeyRow
									key={section}
									label={SECTION_LABELS[section] ?? section}
									last={i === arr.length - 1}
								>
									<span className="text-xs">
										{describe(section, value) || "—"}
									</span>
								</KeyRow>
							),
						)}
						{Object.keys(template.settings).length === 0 && (
							<p className="py-3 text-[13px] text-ink-3">
								This template only confirms the defaults.
							</p>
						)}
					</div>
				</StepCard>
			)}

			<StepCard
				title="Apply to"
				subtitle={
					hotels.length === 0
						? "Add a hotel first"
						: "Tick the hotels that should start from this setup"
				}
			>
				<ul className="flex flex-col gap-2">
					{hotels.map((h) => {
						const on = picked.includes(h.id);
						const was = appliedTo.includes(h.id);
						return (
							<li key={h.id}>
								<button
									type="button"
									onClick={() => toggle(h.id)}
									disabled={!ctx.editable}
									className={cn(
										"flex w-full items-center gap-3 rounded-control border px-4 py-3 text-left",
										on
											? "border-brand bg-brand-soft/40"
											: "border-line bg-card hover:bg-subtle",
									)}
								>
									<span
										className={cn(
											"flex size-5 shrink-0 items-center justify-center rounded-md border",
											on
												? "border-brand bg-brand text-white"
												: "border-line-strong",
										)}
									>
										{on && <CheckIcon className="size-3" />}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block text-[13px] font-semibold text-ink">
											{h.name}
										</span>
										<span className="block text-xs text-ink-3">
											{h.city || "—"} · {h.rooms} rooms
										</span>
									</span>
									{was && <StatusPill tone="success">applied</StatusPill>}
								</button>
							</li>
						);
					})}
				</ul>
			</StepCard>
		</StepFrame>
	);
}

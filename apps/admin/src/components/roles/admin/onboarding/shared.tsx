"use client";

import { ArrowLeftIcon, CheckIcon, CopyIcon, Loader2Icon } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@hospio/api/actions/auth";
import type { Business, BusinessRequest } from "@hospio/api/api/schema";
import { toBusinessRowFromBusiness } from "@hospio/api/data/mappers/tenant";
import type {
	BusinessRow,
	HotelSummary,
	OnboardingRow,
} from "@hospio/api/data/types";
import {
	ADMIN_ONBOARDING_STEPS,
	type AdminOnboardingData,
	type AdminOnboardingStep,
} from "@hospio/api/types";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/** Shared pieces of the back-office wizard (J2–J18): step metadata, the step frame, saving, copying. */

export const STEP_META: Record<
	AdminOnboardingStep,
	{ label: string; subtitle: string }
> = {
	business: {
		label: "Business & legal",
		subtitle: "The company that will pay H.M.S and own the hotels",
	},
	owner: {
		label: "Owner & contacts",
		subtitle: "Who signs, who we call, and who gets the handover pack",
	},
	fee: {
		label: "Fee & contract",
		subtitle: "How H.M.S is paid and when the agreement starts",
	},
	hotels: {
		label: "Hotels",
		subtitle: "Each hotel gets its own setup, staff and rooms",
	},
	rooms: {
		label: "Rooms",
		subtitle: "Room types and numbers for each hotel",
	},
	template: {
		label: "Hotel setup",
		subtitle: "Start from a ready setup; anything can be changed afterwards",
	},
	people: {
		label: "People",
		subtitle: "Managers and staff for each hotel; each one gets a login",
	},
	connections: {
		label: "Connections",
		subtitle: "How guests reach each hotel and how cards are taken",
	},
	golive: {
		label: "Go-live checklist",
		subtitle: "Everything each hotel needs before staff start using it",
	},
	handover: {
		label: "Logins & handover",
		subtitle: "Everyone's login, then hand the business to the owner",
	},
};

export const TOTAL_STEPS = ADMIN_ONBOARDING_STEPS.length;

export const stepIndex = (step: AdminOnboardingStep) =>
	ADMIN_ONBOARDING_STEPS.indexOf(step);
export const nextStep = (step: AdminOnboardingStep) =>
	ADMIN_ONBOARDING_STEPS[Math.min(TOTAL_STEPS - 1, stepIndex(step) + 1)];
export const prevStep = (step: AdminOnboardingStep) =>
	ADMIN_ONBOARDING_STEPS[Math.max(0, stepIndex(step) - 1)];
export const isAdminStep = (v: string | null): v is AdminOnboardingStep =>
	!!v && (ADMIN_ONBOARDING_STEPS as readonly string[]).includes(v);

/** The draft's `data`, typed, plus the extras the wizard keeps that the shared type does not name. */
export type WizardData = AdminOnboardingData & {
	owner?: AdminOnboardingData["owner"] & {
		contactName?: string;
		contactEmail?: string;
		contactPhone?: string;
	};
	connections?: AdminOnboardingData["connections"] & {
		whatsappByHotel?: Record<string, string>;
	};
	golive?: AdminOnboardingData["golive"] & { readyAt?: string };
};

/** A hotel in the wizard: the summary row plus the contact fields the forms edit. */
export type WizardHotel = HotelSummary & {
	phone?: string;
	email?: string;
	checkInTime?: string;
	checkOutTime?: string;
};

/**
 * PUT /tenant/businesses/{id} replaces every field, so each step sends the whole business as the
 * page knows it with its own fields changed.
 */
export function businessRequestFrom(
	b: BusinessRow,
	patch: Partial<BusinessRequest>,
): Partial<BusinessRequest> {
	return {
		name: b.name,
		legalName: b.legalName ?? null,
		registrationNumber: b.registrationNumber ?? null,
		businessType: b.businessType ?? null,
		ownerName: b.ownerName === "—" ? "" : b.ownerName,
		ownerEmail: b.ownerEmail,
		ownerPhone: b.ownerPhone ?? null,
		feeModel: b.feeModelKey ?? null,
		feeValue: b.feeValue || null,
		currency: b.currency ?? "NGN",
		country: b.country ?? "NG",
		timezone: b.timezone ?? "Africa/Lagos",
		marketerId: b.marketerId ?? null,
		accountManagerId: b.accountManagerId ?? null,
		city: b.city || null,
		address: b.address ?? null,
		email: b.email ?? null,
		phone: b.phone ?? null,
		logoUrl: b.logoUrl ?? null,
		brandColour: b.brandColour ?? null,
		contractStartsOn: b.contractStartsOn ?? null,
		contractNotes: b.contractNotes ?? null,
		source: b.source ?? "BACK_OFFICE",
		...patch,
	};
}

/**
 * The per-step forms inside a draft's `data`. tenant-service keeps them under a `steps` key
 * (`{ steps: { business: {…} } }`); a draft saved through the demo actions has them at the top level.
 */
export function stepsOf(data: Record<string, unknown> | undefined): WizardData {
	if (!data) return {};
	const steps = data.steps;
	if (steps && typeof steps === "object" && !Array.isArray(steps))
		return steps as WizardData;
	return data as WizardData;
}

/** The business a write returned, over the row the page holds (keeps counts and names the response lacks). */
export function refreshBusiness(prev: BusinessRow, b: Business): BusinessRow {
	const next = toBusinessRowFromBusiness(b);
	return {
		...prev,
		...next,
		hotels: next.hotels || prev.hotels,
		rooms: next.rooms || prev.rooms,
		accountManager: prev.accountManager,
		marketer: prev.marketer,
		health: prev.health,
		adoption: prev.adoption,
		openTickets: prev.openTickets,
		dueFees: prev.dueFees,
		mrr: prev.mrr,
		lastActive: prev.lastActive,
	};
}

/** The saved row from `saveOnboardingStep` merged over the draft the page holds. */
export function mergeDraft(
	prev: OnboardingRow,
	row: OnboardingRow,
): OnboardingRow {
	const completed = Array.from(
		new Set([...prev.completedSteps, ...row.completedSteps]),
	);
	return {
		...prev,
		step: row.step,
		status: row.status,
		completedSteps: completed,
		nextAction: row.nextAction || prev.nextAction,
		updatedAt: row.updatedAt ?? new Date().toISOString(),
		data: { ...stepsOf(prev.data), ...stepsOf(row.data) },
	};
}

/**
 * Runs the real actions behind a step: `call` runs one action and toasts its error; `busy` wraps the
 * whole save so the buttons stay disabled from the first call to the last.
 */
export function useWizardSave() {
	const [pending, setPending] = useState(false);
	const call = useCallback(
		async <T,>(
			action: () => Promise<ActionResult<T>>,
			message?: string,
		): Promise<T | null> => {
			try {
				const result = await action();
				if (!result.ok) {
					toast.error(result.error, { duration: 8000 });
					return null;
				}
				if (message) toast.success(message);
				return result.data;
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "Something went wrong", {
					duration: 8000,
				});
				return null;
			}
		},
		[],
	);
	const busy = useCallback(async (work: () => Promise<void>) => {
		setPending(true);
		try {
			await work();
		} finally {
			setPending(false);
		}
	}, []);
	return { pending, call, busy };
}

/** The right-hand column of the wizard: "Step n of 10 · Label", the step's body and its footer. */
export function StepFrame({
	step,
	subtitle,
	children,
	onBack,
	onContinue,
	continueLabel = "Save and continue",
	continueDisabled,
	pending,
	extra,
	footerNote,
}: {
	step: AdminOnboardingStep;
	subtitle?: ReactNode;
	children: ReactNode;
	onBack?: () => void;
	onContinue?: () => void;
	continueLabel?: string;
	continueDisabled?: boolean;
	pending?: boolean;
	/** Extra buttons next to the primary one. */
	extra?: ReactNode;
	footerNote?: ReactNode;
}) {
	const meta = STEP_META[step];
	return (
		<div className="flex min-w-0 flex-1 flex-col gap-5">
			<div>
				<h2 className="text-xl font-bold leading-tight text-ink">
					Step {stepIndex(step) + 1} of {TOTAL_STEPS} · {meta.label}
				</h2>
				<p className="mt-1 text-[13px] text-ink-3">
					{subtitle ?? meta.subtitle}
				</p>
			</div>
			<div className="flex flex-col gap-4">{children}</div>
			<div className="mt-2 flex flex-wrap items-center gap-3 border-t border-line pt-4">
				{onBack && (
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={onBack}
						disabled={pending}
					>
						<ArrowLeftIcon className="size-4" /> Back
					</button>
				)}
				<div className="min-w-0 flex-1 text-xs text-ink-3">{footerNote}</div>
				{extra}
				{onContinue && (
					<button
						type="button"
						className={cn(btn.primary, "flex items-center gap-2")}
						onClick={onContinue}
						disabled={pending || continueDisabled}
					>
						{pending ? <Loader2Icon className="size-4 animate-spin" /> : null}
						{continueLabel}
					</button>
				)}
			</div>
		</div>
	);
}

/** A white card inside a step, with a bold title and optional one-line context. */
export function StepCard({
	title,
	subtitle,
	headerRight,
	children,
	className,
}: {
	title?: string;
	subtitle?: ReactNode;
	headerRight?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"flex flex-col gap-4 rounded-card border border-line bg-card p-5",
				className,
			)}
		>
			{(title || headerRight) && (
				<header className="flex items-start gap-3">
					<div className="min-w-0 flex-1">
						{title && <h3 className="text-base font-bold text-ink">{title}</h3>}
						{subtitle && <p className="text-xs text-ink-3">{subtitle}</p>}
					</div>
					{headerRight}
				</header>
			)}
			{children}
		</section>
	);
}

/** Copies text to the clipboard and says so for a moment. */
export function CopyButton({
	text,
	label = "Copy",
	copiedLabel = "Copied",
	className,
	small = true,
}: {
	text: string;
	label?: string;
	copiedLabel?: string;
	className?: string;
	small?: boolean;
}) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			className={cn(
				btn.secondary,
				small && btn.small,
				"flex items-center gap-[6px]",
				className,
			)}
			onClick={() => {
				navigator.clipboard
					?.writeText(text)
					.then(() => {
						setCopied(true);
						setTimeout(() => setCopied(false), 1800);
					})
					.catch(() => toast.error("Could not copy. Select the text instead"));
			}}
		>
			{copied ? (
				<CheckIcon className="size-[14px] text-success" />
			) : (
				<CopyIcon className="size-[14px]" />
			)}
			{copied ? copiedLabel : label}
		</button>
	);
}

/** Where the hotel app lives, for invite links (staging by default). */
export const HOTEL_APP_URL =
	process.env.NEXT_PUBLIC_HOTEL_APP_URL ?? "https://web-staging.hospio360.com";

export const inviteLink = (token: string) =>
	`${HOTEL_APP_URL}/accept-invite?token=${encodeURIComponent(token)}`;

/** Pasted rows: one per line, comma or tab separated, blank lines and a header row skipped. */
export function parseRows(text: string, columns: string[]): string[][] {
	return text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => line.split(/\t|,/).map((c) => c.trim()))
		.filter((cells) => {
			const first = cells[0]?.toLowerCase();
			return !(first && columns[0] && first === columns[0].toLowerCase());
		});
}

/** The green "120 of 120 rooms made" line under a step's cards. */
export function ResultLine({
	children,
	tone = "success",
}: {
	children: ReactNode;
	tone?: "success" | "warning" | "muted";
}) {
	return (
		<p
			className={cn(
				"text-[13px] font-medium",
				tone === "success" && "text-success",
				tone === "warning" && "text-warning",
				tone === "muted" && "text-ink-3",
			)}
		>
			{children}
		</p>
	);
}

/** A row in a step card: label left, value or pill right, a hairline between rows. */
export function KeyRow({
	label,
	children,
	last,
}: {
	label: ReactNode;
	children: ReactNode;
	last?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex items-start justify-between gap-4 py-3 text-[13px]",
				!last && "border-b border-line",
			)}
		>
			{/* The label keeps its width; a long value wraps inside the card instead of pushing past it. */}
			<span className="shrink-0 whitespace-nowrap font-medium text-ink">
				{label}
			</span>
			<span className="min-w-0 flex-1 break-words text-right text-ink-2">
				{children}
			</span>
		</div>
	);
}

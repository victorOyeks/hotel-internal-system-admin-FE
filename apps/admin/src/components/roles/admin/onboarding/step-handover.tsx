"use client";

import {
	FileTextIcon,
	HandshakeIcon,
	KeyRoundIcon,
	PrinterIcon,
	SendIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { resetPassword } from "@hospio/api/actions/identity";
import { sendHandover } from "@hospio/api/actions/tenant";
import type { Handover, UserCreated } from "@hospio/api/api/schema";
import { isHotelRole, roleLabels } from "@hospio/api/roles";
import type { OnboardingLogin } from "@hospio/api/types";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { TextareaField } from "@hospio/ui/shared/field";
import { fmtLongDate, fmtWhen, naira } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import type { WizardCtx } from "./wizard";
import { goLiveChecks } from "./step-golive";
import {
	CopyButton,
	HOTEL_APP_URL,
	inviteLink,
	prevStep,
	StepCard,
	StepFrame,
	useWizardSave,
} from "./shared";

/**
 * J14–J17 · step 10: every login made during onboarding, the handover pack (printable) and "Send
 * handover" (POST /tenant/onboarding/{id}/handover). The owner's temporary password and invite link
 * come back once and are shown once; afterwards the business is HANDED_OVER and this step is the
 * done state, with a reset of the owner's temporary password (POST /identity/users/{id}/reset-password).
 */

type OwnerLogin = {
	userId: string;
	email: string;
	fullName: string;
	temporaryPassword?: string;
	inviteToken?: string;
	expiresAt?: string;
};

export function HandoverStep({ ctx }: { ctx: WizardCtx }) {
	const { business, hotels, users, data } = ctx;
	const logins: OnboardingLogin[] = data.people?.logins ?? [];
	const handedOver =
		business.stage === "HANDED_OVER" ||
		business.stage === "LIVE" ||
		ctx.draft.status === "DONE";
	const checks = goLiveChecks(ctx);
	const open = checks.filter((c) => !c.done);
	const [confirm, setConfirm] = useState(false);
	const [message, setMessage] = useState("");
	const [pack, setPack] = useState(false);
	const [reset, setReset] = useState(false);
	const [owner, setOwner] = useState<OwnerLogin | null>(null);
	const [fresh, setFresh] = useState<UserCreated | null>(null);
	const { pending, call, busy } = useWizardSave();
	const ownerUser = users.find((u) => u.role === "OWNER");
	const ownerUserId =
		owner?.userId ?? ownerUser?.userId ?? data.handover?.ownerUserId;
	const ownerEmail = owner?.email ?? business.ownerEmail;

	const send = () =>
		busy(async () => {
			// Step 10 is saved first (READY_FOR_HANDOVER) so the draft carries the owner it was sent to.
			const row = await ctx.saveStep("handover", {
				ownerEmail: business.ownerEmail,
			});
			if (!row) return;
			const result = await call(() => sendHandover(business.id));
			if (!result) return;
			applyHandover(result);
			setConfirm(false);
			toast.success(`${business.name} handed over to ${business.ownerName}`);
		});

	const applyHandover = (h: Handover) => {
		const o = h.ownerLogin;
		if (o)
			setOwner({
				userId: o.userId,
				email: o.email,
				fullName: o.fullName ?? business.ownerName,
				temporaryPassword: o.temporaryPassword ?? undefined,
				inviteToken: o.inviteToken ?? undefined,
				expiresAt: o.temporaryPasswordExpiresAt ?? o.expiresAt ?? undefined,
			});
		ctx.setBusiness({ ...business, stage: "HANDED_OVER" });
		if (o)
			ctx.setUsers((list) =>
				list.some((u) => u.userId === o.userId)
					? list
					: [
							...list,
							{
								id: o.userId,
								userId: o.userId,
								businessId: business.id,
								fullName: o.fullName ?? business.ownerName,
								email: o.email,
								phone: business.ownerPhone ?? "",
								role: "OWNER",
								level: "FULL",
								hotels: ["All hotels"],
								hotelIds: [],
								hotel: "All hotels",
								grants: [
									{
										id: `${o.userId}-g0`,
										role: "OWNER",
										level: "FULL",
										paused: false,
									},
								],
								status: "INVITED",
								inviteStatus: "PENDING",
								mustChangePassword: true,
								twoStep: false,
							},
						],
			);
	};

	const resetOwner = () =>
		busy(async () => {
			if (!ownerUserId) return;
			const r = await call(
				() => resetPassword(ownerUserId, business.id),
				"Temporary password reset",
			);
			if (!r) return;
			setFresh(r);
			setReset(false);
		});

	const copyAll = () => {
		const lines = [
			owner?.temporaryPassword
				? `${owner.fullName} (owner) · ${owner.email} · ${owner.temporaryPassword}`
				: null,
			...logins
				.filter((l) => l.temporaryPassword)
				.map(
					(l) =>
						`${l.fullName} (${isHotelRole(l.role) ? roleLabels[l.role] : l.role}${l.hotelName ? ` · ${l.hotelName}` : ""}) · ${l.email} · ${l.temporaryPassword}`,
				),
		].filter(Boolean);
		if (lines.length === 0) {
			toast.error("No temporary passwords to copy");
			return;
		}
		navigator.clipboard
			?.writeText(lines.join("\n"))
			.then(() =>
				toast.success(
					`${lines.length} ${lines.length === 1 ? "login" : "logins"} copied`,
				),
			)
			.catch(() => toast.error("Could not copy"));
	};

	const tableRows = [
		...(owner
			? [
					{
						userId: owner.userId,
						fullName: owner.fullName,
						email: owner.email,
						role: "OWNER",
						hotelName: "All hotels",
						temporaryPassword: owner.temporaryPassword,
						inviteToken: owner.inviteToken,
					} satisfies OnboardingLogin,
				]
			: ownerUser
				? [
						{
							userId: ownerUser.userId,
							fullName: ownerUser.fullName,
							email: ownerUser.email,
							role: "OWNER",
							hotelName: "All hotels",
						} satisfies OnboardingLogin,
					]
				: []),
		...logins,
	];

	return (
		<StepFrame
			step="handover"
			subtitle={
				handedOver
					? `Handed over · the owner signs in on ${HOTEL_APP_URL.replace(/^https?:\/\//, "")}, sets a password and accepts the handover`
					: undefined
			}
			onBack={handedOver ? undefined : () => ctx.goTo(prevStep("handover"))}
			onContinue={
				ctx.editable && !handedOver ? () => setConfirm(true) : undefined
			}
			continueLabel="Send handover"
			continueDisabled={!business.ownerEmail || business.ownerName === "—"}
			pending={pending}
			extra={
				<>
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => setPack(true)}
					>
						<FileTextIcon className="size-4" />{" "}
						{handedOver ? "Handover pack" : "Preview handover pack"}
					</button>
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={copyAll}
					>
						<KeyRoundIcon className="size-4" /> Copy passwords
					</button>
				</>
			}
			footerNote={
				handedOver ? (
					<Link
						href={`/dashboard/businesses/${business.id}`}
						className="font-semibold text-brand hover:underline"
					>
						Open the business page →
					</Link>
				) : (
					"Stage changes to Handed over until the owner accepts."
				)
			}
		>
			{handedOver ? (
				<Note tone="success">
					{business.name} was handed over
					{data.golive?.readyAt
						? ` · ready since ${fmtLongDate(data.golive.readyAt)}`
						: ""}
					. The owner signs in with the temporary password, chooses a new one,
					then reviews and accepts the handover.
				</Note>
			) : (
				<Note tone="warning">
					Temporary passwords are shown once. They go in the handover pack and
					H.M.S cannot see them again. They expire in 72 hours; invite links in
					7 days.
				</Note>
			)}

			{owner && (
				<StepCard
					title={`Owner login · ${owner.fullName}`}
					subtitle="Shown once. Copy it into the handover pack now."
					className="border-brand/40"
				>
					<div className="grid gap-3 md:grid-cols-2">
						<Secret label="Email" value={owner.email} />
						<Secret
							label="Temporary password"
							value={owner.temporaryPassword ?? "—"}
							mono
							hint={
								owner.expiresAt
									? `Expires ${fmtWhen(owner.expiresAt)}`
									: "Expires in 72 hours"
							}
						/>
						{owner.inviteToken && (
							<Secret
								label="Invite link"
								value={inviteLink(owner.inviteToken)}
								hint="Opens the password screen directly · 7 days"
								className="md:col-span-2"
							/>
						)}
					</div>
				</StepCard>
			)}
			{fresh && (
				<StepCard
					title="New temporary password"
					subtitle="Shown once; the old one no longer works"
					className="border-brand/40"
				>
					<div className="grid gap-3 md:grid-cols-2">
						<Secret label="Email" value={ownerEmail} />
						<Secret
							label="Temporary password"
							value={fresh.temporaryPassword ?? "—"}
							mono
							hint={
								fresh.temporaryPasswordExpiresAt
									? `Expires ${fmtWhen(fresh.temporaryPasswordExpiresAt)}`
									: undefined
							}
						/>
						{fresh.inviteToken && (
							<Secret
								label="Invite link"
								value={inviteLink(fresh.inviteToken)}
								className="md:col-span-2"
							/>
						)}
					</div>
				</StepCard>
			)}

			{!handedOver && open.length > 0 && (
				<Note tone="warning">
					{open.length} go-live {open.length === 1 ? "item is" : "items are"}{" "}
					still open: {open.map((c) => c.label.toLowerCase()).join(", ")}.{" "}
					<button
						type="button"
						className="font-semibold underline"
						onClick={() => ctx.goTo("golive")}
					>
						Back to the checklist
					</button>
				</Note>
			)}

			<DataTable
				data={tableRows}
				columns={[
					{
						accessorKey: "fullName",
						header: "Person",
						cell: ({ row }) => (
							<TwoLine
								primary={`${row.original.fullName} · ${isHotelRole(row.original.role) ? roleLabels[row.original.role].toLowerCase() : row.original.role}`}
								secondary={row.original.hotelName}
							/>
						),
					},
					{ accessorKey: "email", header: "Login" },
					{
						id: "password",
						header: "Temporary password",
						cell: ({ row }) =>
							row.original.temporaryPassword ? (
								<span className="font-mono text-[13px] font-semibold text-brand">
									{row.original.temporaryPassword}
								</span>
							) : (
								<span className="text-xs text-ink-3">
									{row.original.role === "OWNER" && !handedOver
										? "Made when the handover is sent"
										: "Not shown again"}
								</span>
							),
					},
					{
						id: "first",
						header: "First sign-in",
						cell: ({ row }) => (
							<span className="text-ink-2">
								{row.original.role === "OWNER"
									? "Set a password, accept the handover"
									: "Set a password from the invite link"}
							</span>
						),
					},
					{
						id: "state",
						header: "",
						cell: ({ row }) => {
							const u = users.find((x) => x.userId === row.original.userId);
							return u?.status === "ACTIVE" ? (
								<StatusPill tone="success">signed in</StatusPill>
							) : (
								<StatusPill tone="info">invited</StatusPill>
							);
						},
					},
				]}
				emptyTitle="No logins yet"
				emptyHint="Add people in step 7; the owner's login is made when the handover is sent."
			/>

			{handedOver && ctx.editable && ownerUserId && (
				<div>
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => setReset(true)}
					>
						<KeyRoundIcon className="size-4" /> Reset the owner's temporary
						password
					</button>
				</div>
			)}

			<ConfirmModal
				open={confirm}
				onOpenChange={setConfirm}
				title={`Hand ${business.name} over to ${business.ownerName}?`}
				subtitle={`The owner login is made for ${business.ownerEmail}`}
				confirmLabel="Send handover"
				pending={pending}
				onConfirm={send}
			>
				<div className="flex flex-col gap-3">
					<WhatHappens
						items={[
							`An owner login is created for ${business.ownerEmail} with a temporary password shown once`,
							"The stage changes to Handed over until the owner accepts",
							`${hotels.length} ${hotels.length === 1 ? "hotel" : "hotels"}, ${logins.length} ${logins.length === 1 ? "login" : "logins"} and the settings go in the handover pack`,
							"No email is sent yet: share the pack and the password with the owner yourself",
						]}
					/>
					<TextareaField
						label="Note to the owner (kept on the pack)"
						value={message}
						onChange={setMessage}
						rows={2}
						placeholder={`Your hotels are ready. ${ctx.draft.assignedTo !== "Unassigned" ? ctx.draft.assignedTo : "We"} will call you tomorrow at 10am to walk you through it.`}
					/>
				</div>
			</ConfirmModal>

			<ConfirmModal
				open={reset}
				onOpenChange={setReset}
				title="Reset the owner's temporary password?"
				subtitle={`${ownerEmail} gets a new one, shown once`}
				confirmLabel="Reset password"
				pending={pending}
				onConfirm={resetOwner}
			>
				<WhatHappens
					tone="warning"
					items={[
						"The old temporary password stops working now",
						"The owner must change it on first sign-in",
						"Use this only if the owner never received or lost the first one",
					]}
				/>
			</ConfirmModal>

			<HandoverPackModal
				open={pack}
				onOpenChange={setPack}
				ctx={ctx}
				owner={owner}
				message={message}
				onSend={
					!handedOver && ctx.editable
						? () => {
								setPack(false);
								setConfirm(true);
							}
						: undefined
				}
			/>
		</StepFrame>
	);
}

function Secret({
	label,
	value,
	mono,
	hint,
	className,
}: {
	label: string;
	value: string;
	mono?: boolean;
	hint?: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-1 rounded-xl bg-subtle/70 px-4 py-3",
				className,
			)}
		>
			<span className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
				{label}
			</span>
			<div className="flex items-center gap-2">
				<span
					className={cn(
						"min-w-0 flex-1 break-all text-[13px] font-semibold text-ink",
						mono && "font-mono text-brand",
					)}
				>
					{value}
				</span>
				<CopyButton text={value} />
			</div>
			{hint && <span className="text-xs text-ink-3">{hint}</span>}
		</div>
	);
}

/** J15 · the handover pack: hotels, logins and settings, printable from the browser. */
function HandoverPackModal({
	open,
	onOpenChange,
	ctx,
	owner,
	message,
	onSend,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	ctx: WizardCtx;
	owner: OwnerLogin | null;
	message: string;
	onSend?: () => void;
}) {
	const { business, hotels, users, data } = ctx;
	const logins = data.people?.logins ?? [];
	const numbers = data.connections?.whatsappByHotel ?? {};
	const staffAt = (hotelId: string) =>
		new Set([
			...users.filter((u) => u.hotelIds.includes(hotelId)).map((u) => u.userId),
			...logins.filter((l) => l.hotelId === hotelId).map((l) => l.userId),
		]).size;
	const terminalsAt = (hotelId: string) =>
		(ctx.terminals[hotelId] ?? []).length;
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Handover pack"
			subtitle="What the owner receives. Keep it private: it carries temporary passwords."
			icon={HandshakeIcon}
			size="large"
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Close
					</button>
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => window.print()}
					>
						<PrinterIcon className="size-4" /> Print
					</button>
					{onSend && (
						<button
							type="button"
							className={cn(btn.primary, "flex items-center gap-2")}
							onClick={onSend}
						>
							<SendIcon className="size-4" /> Send handover
						</button>
					)}
				</>
			}
		>
			<style>{`@media print { body * { visibility: hidden !important; } #handover-pack, #handover-pack * { visibility: visible !important; } #handover-pack { position: fixed; inset: 0; padding: 32px; background: #fff; overflow: visible; } }`}</style>
			<article id="handover-pack" className="flex flex-col gap-5 text-ink">
				<header>
					<p className="text-sm font-bold tracking-[0.2em] text-brand">H.M.S</p>
					<h2 className="mt-2 text-2xl font-bold leading-tight">
						Welcome to H.M.S, {business.name}
					</h2>
					<p className="mt-1 text-[13px] text-ink-2">
						Your {hotels.length}{" "}
						{hotels.length === 1 ? "hotel is" : "hotels are"} set up and ready.
						Keep this pack private.
					</p>
					{message.trim() && (
						<p className="mt-3 rounded-xl bg-brand-soft/60 px-4 py-3 text-[13px] text-ink">
							{message.trim()}
						</p>
					)}
				</header>

				<section className="rounded-xl bg-subtle/70 px-5 py-4">
					<h3 className="text-[13px] font-bold">
						Your logins · {HOTEL_APP_URL.replace(/^https?:\/\//, "")}
					</h3>
					<dl className="mt-2 flex flex-col gap-1 text-[13px]">
						<PackLogin
							name={owner?.fullName ?? business.ownerName}
							title="owner"
							email={owner?.email ?? business.ownerEmail}
							password={
								owner?.temporaryPassword ??
								(business.stage === "ONBOARDING"
									? "made when the handover is sent"
									: "sent separately")
							}
						/>
						{logins.map((l) => (
							<PackLogin
								key={l.userId}
								name={l.fullName}
								title={`${isHotelRole(l.role) ? roleLabels[l.role].toLowerCase() : l.role}${l.hotelName ? ` · ${l.hotelName}` : ""}`}
								email={l.email}
								password={l.temporaryPassword ?? "set from the invite link"}
							/>
						))}
					</dl>
					<p className="mt-2 text-xs text-ink-3">
						Each temporary password works once, for 72 hours. You will choose
						your own and can turn on 2-step sign-in.
					</p>
				</section>

				<section>
					<h3 className="text-[13px] font-bold">Your setup</h3>
					<ul className="mt-2 flex flex-col gap-1 text-[13px] text-ink-2">
						{hotels.map((h) => (
							<li key={h.id}>
								• {h.name} · {h.rooms} rooms · {staffAt(h.id)} staff
								{terminalsAt(h.id) ? ` · ${terminalsAt(h.id)} POS` : ""}
								{numbers[h.id] ? ` · WhatsApp ${numbers[h.id]}` : ""}
							</li>
						))}
						<li>
							• Fee: {business.feeModel}
							{business.feeValue
								? ` · ${business.feeModel.includes("%") ? `${business.feeValue}%` : naira(business.feeValue)}`
								: ""}
							{business.contractStartsOn
								? ` · from ${fmtLongDate(business.contractStartsOn)}`
								: ""}
						</li>
						<li>• Your account manager: {business.accountManager}</li>
						{data.template?.templateId && (
							<li>
								• Hotel setup from template:{" "}
								{ctx.templates.find((t) => t.id === data.template?.templateId)
									?.name ?? "applied"}
							</li>
						)}
					</ul>
				</section>

				<section>
					<h3 className="text-[13px] font-bold">Your first sign-in</h3>
					<ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] text-ink-2">
						<li>
							Open {HOTEL_APP_URL.replace(/^https?:\/\//, "")} and sign in with
							your email and the temporary password.
						</li>
						<li>Choose your own password.</li>
						<li>
							Review what H.M.S set up and accept the handover. Your hotels go
							live.
						</li>
						<li>
							Managers and staff open their invite link, set a password and
							start their first day.
						</li>
					</ol>
				</section>
				{data.golive?.notes && (
					<p className="text-[13px] font-semibold text-brand">
						{data.golive.notes}
					</p>
				)}
			</article>
		</Modal>
	);
}

function PackLogin({
	name,
	title,
	email,
	password,
}: {
	name: string;
	title: string;
	email: string;
	password: string;
}) {
	return (
		<div className="flex flex-wrap items-baseline justify-between gap-x-4">
			<dt className="font-semibold text-ink">
				{name} <span className="font-normal text-ink-3">({title})</span>
			</dt>
			<dd className="text-ink-2">
				{email} ·{" "}
				<span className="font-mono font-semibold text-brand">{password}</span>
			</dd>
		</div>
	);
}

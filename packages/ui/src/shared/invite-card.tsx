"use client";

import {
	CheckIcon,
	CopyIcon,
	KeyRoundIcon,
	LinkIcon,
	MessageCircleIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@hospio/ui/utils";
import { fmtLongDate } from "./format";
import { btn } from "./ui";

/**
 * A new login's temporary password and invite link, shown once (owner Users, manager Staff, the
 * onboarding wizards). The link opens /accept-invite?token= on this app; WhatsApp gets the invite
 * email's wording (Figma 3167:16163) with the link and the temporary password.
 */

/** `/accept-invite?token=…` on the host the page is open on (empty on the server). */
export function useInviteLink(token?: string | null) {
	const [origin, setOrigin] = useState("");
	useEffect(() => setOrigin(window.location.origin), []);
	return token
		? `${origin}/accept-invite?token=${encodeURIComponent(token)}`
		: "";
}

export function inviteMessage(input: {
	firstName: string;
	inviterName: string;
	businessName: string;
	hotelName?: string | null;
	roleLabel: string;
	link: string;
	temporaryPassword?: string | null;
}) {
	const where = input.hotelName
		? `manage ${input.hotelName} on the ${input.businessName} dashboard`
		: `join ${input.businessName} on Hospio360`;
	const lines = [
		`Hi ${input.firstName},`,
		"",
		`${input.inviterName} has invited you to ${where}.`,
		"",
		`Your role: ${input.roleLabel}`,
		...(input.hotelName ? [`Your hotel: ${input.hotelName}`] : []),
		`Invited by: ${input.inviterName} · ${input.businessName}`,
		"",
		`Accept the invite and set your password: ${input.link}`,
		...(input.temporaryPassword
			? [
					`Temporary password (if the link does not open): ${input.temporaryPassword}`,
				]
			: []),
		"",
		"This link works for 7 days.",
	];
	return lines.join("\n");
}

export function whatsappUrl(phone: string | null | undefined, text: string) {
	const digits = (phone ?? "").replace(/[^\d]/g, "");
	return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export async function copyText(value: string, what = "Copied") {
	try {
		await navigator.clipboard.writeText(value);
		toast.success(what);
		return true;
	} catch {
		toast.error("Could not copy. Select the text and copy it yourself");
		return false;
	}
}

/** A labelled value with a copy button. */
export function CopyValue({
	label,
	value,
	icon: Icon,
	mono = true,
	className,
}: {
	label: string;
	value: string;
	icon?: typeof CopyIcon;
	mono?: boolean;
	className?: string;
}) {
	const [done, setDone] = useState(false);
	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-control border border-line bg-card px-4 py-3",
				className,
			)}
		>
			{Icon && (
				<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
					<Icon className="size-4" />
				</span>
			)}
			<div className="min-w-0 flex-1">
				<p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
					{label}
				</p>
				<p
					className={cn(
						"truncate text-[13px] text-ink",
						mono ? "font-mono font-semibold" : "font-medium",
					)}
					title={value}
				>
					{value || "—"}
				</p>
			</div>
			<button
				type="button"
				className={cn(btn.secondary, btn.small, "flex items-center gap-1")}
				disabled={!value}
				onClick={async () => {
					if (await copyText(value, `${label} copied`)) {
						setDone(true);
						setTimeout(() => setDone(false), 1500);
					}
				}}
			>
				{done ? (
					<CheckIcon className="size-3" />
				) : (
					<CopyIcon className="size-3" />
				)}{" "}
				{done ? "Copied" : "Copy"}
			</button>
		</div>
	);
}

export function InviteCard({
	fullName,
	email,
	phone,
	roleLabel,
	hotelName,
	businessName,
	inviterName,
	temporaryPassword,
	inviteToken,
	inviteExpiresAt,
	temporaryPasswordExpiresAt,
	title = "Invite ready",
	children,
	className,
}: {
	fullName: string;
	email: string;
	phone?: string | null;
	roleLabel: string;
	hotelName?: string | null;
	businessName: string;
	inviterName: string;
	temporaryPassword?: string | null;
	inviteToken?: string | null;
	inviteExpiresAt?: string | null;
	temporaryPasswordExpiresAt?: string | null;
	title?: string;
	children?: ReactNode;
	className?: string;
}) {
	const link = useInviteLink(inviteToken);
	const text = inviteMessage({
		firstName: fullName.split(" ")[0] || fullName,
		inviterName,
		businessName,
		hotelName,
		roleLabel,
		link: link || "(link)",
		temporaryPassword,
	});
	return (
		<div
			className={cn(
				"flex flex-col gap-3 rounded-card border border-success/30 bg-success-soft/40 p-4",
				className,
			)}
		>
			<div>
				<p className="text-[13px] font-bold text-ink">{title}</p>
				<p className="text-xs text-ink-2">
					{fullName} · {email}
					{phone ? ` · ${phone}` : ""} · {roleLabel}
					{hotelName ? ` · ${hotelName}` : ""}
				</p>
			</div>
			<p className="text-xs text-ink-2">
				Nothing is emailed yet. Send the link yourself, or read out the
				temporary password. Both are shown only now.
			</p>
			{inviteToken && (
				<CopyValue
					label="Invite link"
					value={link}
					icon={LinkIcon}
					mono={false}
				/>
			)}
			{temporaryPassword && (
				<CopyValue
					label="Temporary password"
					value={temporaryPassword}
					icon={KeyRoundIcon}
				/>
			)}
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					className={cn(btn.secondary, "flex items-center gap-2")}
					onClick={() => copyText(text, "Invite message copied")}
				>
					<CopyIcon className="size-4" /> Copy the message
				</button>
				<a
					href={whatsappUrl(phone, text)}
					target="_blank"
					rel="noreferrer"
					className={cn(
						btn.primary,
						"flex items-center gap-2",
						!phone && "pointer-events-none opacity-60",
					)}
				>
					<MessageCircleIcon className="size-4" /> Send on WhatsApp
				</a>
			</div>
			<p className="text-[11px] text-ink-3">
				{inviteExpiresAt
					? `Link works until ${fmtLongDate(inviteExpiresAt)}`
					: "Link works for 7 days"}
				{temporaryPasswordExpiresAt
					? ` · temporary password until ${fmtLongDate(temporaryPasswordExpiresAt)}`
					: ""}
			</p>
			{children}
		</div>
	);
}

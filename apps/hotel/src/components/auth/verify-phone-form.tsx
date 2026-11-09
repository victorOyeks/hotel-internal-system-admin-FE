"use client";

import { Loader2Icon, SmartphoneIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { sendPhoneCode, verifyPhone } from "@hospio/api/actions/onboarding";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { Button } from "@hospio/ui/primitives/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@hospio/ui/primitives/input-otp";
import { cn } from "@hospio/ui/utils";

const RESEND_SECONDS = 45;

/** "+234 803 555 0192" → "+234 803 ••• 0192" */
function maskPhone(phone: string) {
	const digits = phone.replace(/[^\d+]/g, "");
	if (digits.length < 8) return phone;
	return `${digits.slice(0, -7)} ${digits.slice(-7, -4).replace(/\d/g, "•")} ${digits.slice(-4)}`;
}

/** Check your phone (Figma 3163:16180): the code is sent on open, six boxes, resend with a cool-down, skip allowed. */
export function VerifyPhoneForm({
	phone,
	staging,
	next = "/onboarding",
}: {
	phone: string;
	staging: boolean;
	next?: string;
}) {
	const router = useRouter();
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [left, setLeft] = useState(RESEND_SECONDS);
	const [sending, setSending] = useState(false);
	const [pending, startTransition] = useTransition();
	const sent = useRef(false);

	const send = useCallback(async () => {
		setSending(true);
		const result = await withDeliveries(sendPhoneCode(), "Your phone code");
		setSending(false);
		if (!result.ok) {
			toast.error(result.error);
			return;
		}
		setLeft(RESEND_SECONDS);
	}, []);

	useEffect(() => {
		if (sent.current) return;
		sent.current = true;
		void send();
	}, [send]);

	useEffect(() => {
		if (left <= 0) return;
		const t = setTimeout(() => setLeft((s) => s - 1), 1000);
		return () => clearTimeout(t);
	}, [left]);

	function submit(value = code) {
		if (value.length !== 6) {
			setError("Enter the 6 digits");
			return;
		}
		setError(null);
		startTransition(async () => {
			const result = await verifyPhone(value);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			toast.success("Phone confirmed");
			router.replace(next);
		});
	}

	return (
		<form
			className="flex flex-col gap-4"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
				<SmartphoneIcon className="size-5" />
			</span>
			<div>
				<h1 className="text-[28px] font-bold text-ink">Check your phone</h1>
				<p className="mt-2 text-sm text-ink-3">
					{phone
						? `We sent a 6-digit code to ${maskPhone(phone)}.`
						: "We sent a 6-digit code to your phone."}
				</p>
			</div>

			<InputOTP
				maxLength={6}
				value={code}
				onChange={(v) => setCode(v.replace(/\D/g, ""))}
				onComplete={(v) => submit(v)}
				containerClassName="justify-between gap-2"
				autoFocus
			>
				<InputOTPGroup className="w-full justify-between gap-2">
					{[0, 1, 2, 3, 4, 5].map((i) => (
						<InputOTPSlot
							key={i}
							index={i}
							className={cn(
								"h-[52px] w-[46px] rounded-[10px] border border-line text-lg font-semibold text-ink shadow-none first:rounded-[10px] last:rounded-[10px] data-[active=true]:border-brand data-[active=true]:ring-0",
								error && "border-danger",
							)}
						/>
					))}
				</InputOTPGroup>
			</InputOTP>
			{error && <p className="text-xs text-danger">{error}</p>}
			{staging && (
				<p className="rounded-[10px] bg-info-soft px-4 py-3 text-xs text-info">
					<span className="font-semibold">Staging accepts 123456.</span> No SMS
					is sent yet; the real code is in the identity-service log.
				</p>
			)}

			<Button
				type="submit"
				disabled={pending || code.length !== 6}
				className="h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90"
			>
				{pending ? (
					<Loader2Icon className="size-4 animate-spin" />
				) : (
					"Verify and continue"
				)}
			</Button>

			<p className="text-center text-xs text-ink-3">
				Didn't get it?{" "}
				{left > 0 ? (
					<span>Resend in 0:{String(left).padStart(2, "0")}</span>
				) : (
					<button
						type="button"
						onClick={send}
						disabled={sending}
						className="font-semibold text-brand hover:underline disabled:opacity-60"
					>
						{sending ? "Sending…" : "Send the code again"}
					</button>
				)}
				{" · "}
				<Link href={next} className="font-semibold text-brand hover:underline">
					Skip for now
				</Link>
			</p>
		</form>
	);
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	BuildingIcon,
	EyeIcon,
	EyeOffIcon,
	Loader2Icon,
	LockIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { acceptInvite } from "@hospio/api/actions/onboarding";
import type { Invite } from "@hospio/api/api/schema";
import { isHotelRole, roleLabels } from "@hospio/api/roles";
import { Button } from "@hospio/ui/primitives/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@hospio/ui/primitives/form";
import { Input } from "@hospio/ui/primitives/input";

const schema = z
	.object({
		password: z
			.string()
			.min(8, "At least 8 characters")
			.max(72, "At most 72 characters"),
		confirm: z.string(),
	})
	.refine((v) => v.password === v.confirm, {
		path: ["confirm"],
		message: "The passwords don't match",
	});

const input =
	"h-auto rounded-control border-line px-[14px] py-3 text-sm focus-visible:border-brand focus-visible:ring-0";
const label = "text-[13px] font-medium text-ink-2";

/** Set up your account (Figma 3167:16201): who the invite is for, then a password; accepting signs them in. */
export function AcceptInviteForm({
	token,
	invite,
}: {
	token: string;
	invite: Invite;
}) {
	const router = useRouter();
	const [show, setShow] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [pending, startTransition] = useTransition();
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: { password: "", confirm: "" },
	});
	const role = isHotelRole(invite.role) ? roleLabels[invite.role] : invite.role;
	const where = invite.hotelName ?? invite.businessName ?? "Hospio360";

	function onSubmit(values: z.infer<typeof schema>) {
		startTransition(async () => {
			const result = await acceptInvite({ token, password: values.password });
			if (!result.ok) {
				form.setError("confirm", { message: result.error });
				return;
			}
			toast.success(`Welcome, ${invite.fullName.split(" ")[0]}`);
			router.replace("/dashboard");
		});
	}

	return (
		<Form {...form}>
			<form
				method="post"
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-4"
			>
				<div>
					<h1 className="text-[28px] font-bold text-ink">
						Set up your account
					</h1>
					<p className="mt-2 text-sm text-ink-3">
						You'll use this to sign in to {invite.businessName ?? "Hospio360"}.
					</p>
				</div>
				<div className="flex items-center gap-3 rounded-control border border-line bg-subtle/60 px-4 py-3">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-brand">
						<BuildingIcon className="size-4" />
					</span>
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							{role} · {where}
						</p>
						<p className="text-xs text-ink-3">
							{invite.hotelName
								? "More hotels can be added to your account later"
								: "Business-wide access"}
						</p>
					</div>
				</div>
				<div className="flex flex-col gap-[6px]">
					<span className={label}>Full name</span>
					<Input
						value={invite.fullName}
						readOnly
						className={`${input} bg-subtle`}
					/>
				</div>
				<div className="flex flex-col gap-[6px]">
					<span className={label}>Email</span>
					<div className="relative">
						<Input
							value={invite.email}
							readOnly
							className={`${input} bg-subtle pr-10 text-ink-3`}
						/>
						<LockIcon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
					</div>
					<p className="text-xs text-ink-3">
						Set by the person who invited you
					</p>
				</div>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className={label}>Create a password</FormLabel>
							<FormControl>
								<div className="relative">
									<Input
										{...field}
										type={show ? "text" : "password"}
										autoComplete="new-password"
										placeholder="••••••••••"
										className={`${input} pr-11`}
									/>
									<button
										type="button"
										onClick={() => setShow((s) => !s)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
										aria-label={show ? "Hide password" : "Show password"}
									>
										{show ? (
											<EyeOffIcon className="size-4" />
										) : (
											<EyeIcon className="size-4" />
										)}
									</button>
								</div>
							</FormControl>
							<p className="text-xs text-ink-3">At least 8 characters</p>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="confirm"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className={label}>Password again</FormLabel>
							<FormControl>
								<div className="relative">
									<Input
										{...field}
										type={showConfirm ? "text" : "password"}
										autoComplete="new-password"
										placeholder="••••••••••"
										className={`${input} pr-11`}
									/>
									<button
										type="button"
										onClick={() => setShowConfirm((s) => !s)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
										aria-label={
											showConfirm
												? "Hide password again"
												: "Show password again"
										}
									>
										{showConfirm ? (
											<EyeOffIcon className="size-4" />
										) : (
											<EyeIcon className="size-4" />
										)}
									</button>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					type="submit"
					disabled={pending}
					className="h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90"
				>
					{pending ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						"Accept and continue"
					)}
				</Button>
			</form>
		</Form>
	);
}

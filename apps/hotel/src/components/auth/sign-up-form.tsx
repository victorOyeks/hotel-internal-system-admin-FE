"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { signUp } from "@hospio/api/actions/onboarding";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
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

const letters = (v: string) => v.replace(/[^\p{L}]/gu, "").length;
const realPhone = (v: string) => {
	const d = v.replace(/\D/g, "");
	return d.length >= 10 && d.length <= 15 && !/^(\d)\1*$/.test(d.slice(-10));
};

const schema = z.object({
	fullName: z
		.string()
		.trim()
		.min(2, "Enter your name")
		.max(120, "Keep your name under 120 characters")
		.refine((v) => letters(v) >= 2, "Your name must contain letters"),
	email: z.email("Enter a work email"),
	phone: z
		.string()
		.trim()
		.min(1, "Enter your phone number")
		.regex(
			/^\+?[\d\s()-]{7,24}$/,
			"Enter a phone number like +234 803 555 0192",
		)
		.refine(realPhone, "Enter a real phone number, like +234 803 555 0192"),
	password: z
		.string()
		.min(8, "At least 8 characters")
		.max(72, "At most 72 characters"),
	businessName: z
		.string()
		.trim()
		.min(2, "Enter your company or group name")
		.max(120, "Keep the name under 120 characters")
		.refine(
			(v) => letters(v) >= 2,
			"The business name must contain letters, not only numbers or symbols",
		),
	city: z
		.string()
		.trim()
		.min(1, "Enter your city")
		.max(80, "Keep the city under 80 characters")
		.refine((v) => letters(v) >= 2 && !/\d/.test(v), "Enter a real city name"),
});

const input =
	"h-auto rounded-control border-line px-[14px] py-3 text-sm focus-visible:border-brand focus-visible:ring-0";
const label = "text-[13px] font-medium text-ink-2";

/** Create your hotel account (Figma 3163:16114): the owner's details and the business they own. */
export function SignUpForm() {
	const router = useRouter();
	const [show, setShow] = useState(false);
	const [pending, startTransition] = useTransition();
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			fullName: "",
			email: "",
			phone: "",
			password: "",
			businessName: "",
			city: "",
		},
	});

	function onSubmit(values: z.infer<typeof schema>) {
		startTransition(async () => {
			const result = await withDeliveries(
				signUp({
					...values,
					city: values.city,
				}),
				`Phone code for ${values.fullName.trim()}`,
			);
			if (!result.ok) {
				// A taken address comes back as "Someone already signs in with …": that belongs under the email.
				const field = /phone/i.test(result.error)
					? "phone"
					: /full name/i.test(result.error)
						? "fullName"
						: /business name/i.test(result.error)
							? "businessName"
							: /city/i.test(result.error)
								? "city"
								: /email|already|sign in instead|exists/i.test(result.error)
									? "email"
									: "password";
				form.setError(field, { message: result.error });
				return;
			}
			toast.success("Account created");
			// Sign-up already sent the code; the check page must not send (and so replace) a second one.
			router.replace("/verify-phone?sent=1");
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
						Create your hotel account
					</h1>
					<p className="mt-2 text-sm text-ink-3">
						For hotel owners. Your managers and staff are invited later.
					</p>
				</div>

				<FormField
					control={form.control}
					name="fullName"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className={label}>Full name</FormLabel>
							<FormControl>
								<Input
									{...field}
									autoComplete="name"
									placeholder="Godwin Kwin"
									className={input}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className={label}>Work email</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="email"
									autoComplete="email"
									placeholder="godwin@royalsuites.ng"
									className={input}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="phone"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className={label}>Phone</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="tel"
									autoComplete="tel"
									placeholder="+234 803 555 0192"
									className={input}
								/>
							</FormControl>
							<p className="text-xs text-ink-3">
								We'll text a code to check it's you
							</p>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className={label}>Password</FormLabel>
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
				<div className="grid grid-cols-[1fr_140px] gap-3">
					<FormField
						control={form.control}
						name="businessName"
						render={({ field }) => (
							<FormItem className="gap-[6px]">
								<FormLabel className={label}>Business name</FormLabel>
								<FormControl>
									<Input
										{...field}
										autoComplete="organization"
										placeholder="Royal Suites Ltd"
										className={input}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="city"
						render={({ field }) => (
							<FormItem className="gap-[6px]">
								<FormLabel className={label}>City</FormLabel>
								<FormControl>
									<Input
										{...field}
										autoComplete="address-level2"
										placeholder="Lagos"
										className={input}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<Button
					type="submit"
					disabled={pending}
					className="mt-1 h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90"
				>
					{pending ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						"Create account"
					)}
				</Button>
				<p className="text-center text-xs text-ink-3">
					By continuing you agree to the Terms and Privacy Policy.
				</p>
				<p className="text-center text-[13px] text-ink-2">
					Already have an account?{" "}
					<Link
						href="/auth"
						className="font-semibold text-brand hover:underline"
					>
						Sign in
					</Link>
				</p>
			</form>
		</Form>
	);
}

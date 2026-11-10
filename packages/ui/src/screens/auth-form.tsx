"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { login, loginWithCode } from "@hospio/api/actions";
import { isAppRole, OTHER_APP_URL } from "@hospio/api/app";

const schema = z.object({
	email: z.email("Enter your email"),
	password: z.string().min(1, "Enter your password"),
});

/** `email` fills the field (a "No PIN yet" tile on a shared device's lock screen opens sign-in with it). */
export function AuthForm({ from, email = "" }: { from?: string; email?: string }) {
	const router = useRouter();
	const [show, setShow] = useState(false);
	const [pending, startTransition] = useTransition();
	// 2-step sign-in (docs/profile.md in hospio-backend): after the right password, the code step.
	const [twoStepToken, setTwoStepToken] = useState<string | null>(null);
	const [code, setCode] = useState("");
	const [recovery, setRecovery] = useState(false);
	const [codeError, setCodeError] = useState<string | undefined>();
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: { email, password: "" },
	});

	function signedIn(data: { mustChangePassword: boolean; roles: string[] }, email: string) {
		// An account with none of this app's roles belongs on the other app: go there with a full
			// navigation. A client-side push would be redirected cross-origin by the middleware and the
			// RSC fetch would fail on CORS before the browser fell back to a plain navigation.
		if (data.roles.length > 0 && !data.roles.some((r) => isAppRole(r))) {
			window.location.assign(`${OTHER_APP_URL}/auth?switch=${encodeURIComponent(email)}`);
			return;
		}
		toast.success("Signed in");
		// Only return to an app page; "/" and anything outside the app go to the dashboard.
		const back = from?.startsWith("/dashboard") ? from : "/dashboard";
		router.replace(data.mustChangePassword ? "/reset-password" : back);
	}

	function onSubmit(values: z.infer<typeof schema>) {
		startTransition(async () => {
			const result = await login(values);
			if (!result.ok) {
				form.setError("password", { message: result.error });
				return;
			}
			const data = result.data;
			if (data.twoStepToken !== undefined) {
				setTwoStepToken(data.twoStepToken);
				setCode("");
				setCodeError(undefined);
				return;
			}
			signedIn(data, values.email);
		});
	}

	function submitCode(e: FormEvent) {
		e.preventDefault();
		if (!twoStepToken) return;
		setCodeError(undefined);
		startTransition(async () => {
			const result = await loginWithCode({ twoStepToken, code });
			if (!result.ok) {
				setCodeError(result.error);
				// The step has run out or sign-in is locked: start again with the password.
				if (/expired|locked/i.test(result.error)) {
					setTwoStepToken(null);
					form.setValue("password", "");
					form.setError("password", { message: result.error });
				}
				return;
			}
			signedIn(result.data, form.getValues("email"));
		});
	}

	if (twoStepToken) {
		return (
			<form method="post" onSubmit={submitCode} className="flex flex-col gap-4">
				<div>
					<h1 className="text-[28px] font-bold text-ink">2-step sign-in</h1>
					<p className="mt-2 text-sm text-ink-3">
						{recovery ? "Enter one of your recovery codes. Each works once." : "Enter the 6-digit code from your authenticator app."}
					</p>
				</div>
				<div className="flex flex-col gap-[6px]">
					<label htmlFor="two-step-code" className="text-[13px] font-medium text-ink-2">
						{recovery ? "Recovery code" : "Code"}
					</label>
					<Input
						id="two-step-code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						autoFocus
						autoComplete="one-time-code"
						inputMode={recovery ? "text" : "numeric"}
						placeholder={recovery ? "abcde-12345" : "123456"}
						className="h-auto rounded-control border-line px-[14px] py-3 text-sm focus-visible:border-brand focus-visible:ring-0"
					/>
					{codeError && <p className="text-[13px] text-danger">{codeError}</p>}
				</div>
				<button
					type="button"
					className="w-fit text-[13px] font-semibold text-brand hover:underline"
					onClick={() => {
						setRecovery((r) => !r);
						setCode("");
						setCodeError(undefined);
					}}
				>
					{recovery ? "Use the code from my app" : "Lost your phone? Use a recovery code"}
				</button>
				<Button
					type="submit"
					disabled={pending || !code.trim()}
					className="h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90"
				>
					{pending ? <Loader2Icon className="size-4 animate-spin" /> : "Continue"}
				</Button>
				<button
					type="button"
					className="text-[13px] font-semibold text-ink-3 hover:text-ink"
					onClick={() => {
						setTwoStepToken(null);
						form.setValue("password", "");
					}}
				>
					Back to email and password
				</button>
			</form>
		);
	}

	return (
		<Form {...form}>
			{/* method="post": a submit before hydration must never put the credentials in the URL. */}
			<form
				method="post"
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-4"
			>
				<div>
					<h1 className="text-[28px] font-bold text-ink">Sign in</h1>
					<p className="mt-2 text-sm text-ink-3">Welcome back to Hospio360</p>
				</div>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className="text-[13px] font-medium text-ink-2">
								Email or phone
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="email"
									autoComplete="username"
									placeholder="you@hotel.com"
									className="h-auto rounded-control border-line px-[14px] py-3 text-sm focus-visible:border-brand focus-visible:ring-0"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className="text-[13px] font-medium text-ink-2">
								Password
							</FormLabel>
							<FormControl>
								<div className="relative">
									<Input
										{...field}
										type={show ? "text" : "password"}
										autoComplete="current-password"
										placeholder="••••••••••"
										className="h-auto rounded-control border-line px-[14px] py-3 pr-11 text-sm focus-visible:border-brand focus-visible:ring-0"
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
							<FormMessage />
						</FormItem>
					)}
				/>

				<Link
					href="/forgot-password"
					className="text-[13px] font-semibold text-brand hover:underline"
				>
					Forgot your password?
				</Link>

				<Button
					type="submit"
					disabled={pending}
					className="h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90"
				>
					{pending ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						"Sign in"
					)}
				</Button>
			</form>
		</Form>
	);
}

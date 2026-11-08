"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@hospio/ui/primitives/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@hospio/ui/primitives/form";
import { Input } from "@hospio/ui/primitives/input";
import { login } from "@hospio/api/actions";

const schema = z.object({
	email: z.email("Enter your email"),
	password: z.string().min(1, "Enter your password"),
});

export function AuthForm({ from }: { from?: string }) {
	const router = useRouter();
	const [show, setShow] = useState(false);
	const [pending, startTransition] = useTransition();
	const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

	function onSubmit(values: z.infer<typeof schema>) {
		startTransition(async () => {
			const result = await login(values);
			if (!result.ok) {
				form.setError("password", { message: result.error });
				return;
			}
			toast.success("Signed in");
			// Only return to an app page; "/" and anything outside the app go to the dashboard.
			const back = from?.startsWith("/dashboard") ? from : "/dashboard";
			router.replace(result.data.mustChangePassword ? "/reset-password" : back);
		});
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
				<div>
					<h1 className="text-[28px] font-bold text-ink">Sign in</h1>
					<p className="mt-2 text-sm text-ink-3">Welcome back to Hospio360</p>
				</div>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className="text-[13px] font-medium text-ink-2">Email or phone</FormLabel>
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
							<FormLabel className="text-[13px] font-medium text-ink-2">Password</FormLabel>
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
										{show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
									</button>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Link href="/forgot-password" className="text-[13px] font-semibold text-brand hover:underline">
					Forgot your password?
				</Link>

				<Button type="submit" disabled={pending} className="h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90">
					{pending ? <Loader2Icon className="size-4 animate-spin" /> : "Sign in"}
				</Button>
			</form>
		</Form>
	);
}

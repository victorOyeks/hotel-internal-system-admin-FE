"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { changePassword } from "@hospio/api/actions";

const schema = z
	.object({
		currentPassword: z.string().min(1, "Enter the temporary password"),
		newPassword: z.string().min(8, "At least 8 characters"),
		confirm: z.string(),
	})
	.refine((v) => v.newPassword === v.confirm, {
		path: ["confirm"],
		message: "The passwords don't match",
	});

const input =
	"h-auto rounded-control border-line px-[14px] py-3 text-sm focus-visible:border-brand focus-visible:ring-0";

export function ResetPasswordForm() {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	// Each password field has its own eye, as on the invite screen.
	const [shown, setShown] = useState<Record<string, boolean>>({});
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
	});

	function onSubmit(values: z.infer<typeof schema>) {
		startTransition(async () => {
			const result = await changePassword({
				currentPassword: values.currentPassword,
				newPassword: values.newPassword,
			});
			if (!result.ok) {
				form.setError("currentPassword", { message: result.error });
				return;
			}
			// This device stays signed in with the new password; any other session ended (docs/profile.md).
			toast.success("Password changed");
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
						Choose your password
					</h1>
					<p className="mt-2 text-sm text-ink-3">
						Your temporary password works once. Pick one only you know.
					</p>
				</div>
				{(
					[
						["currentPassword", "Temporary password"],
						["newPassword", "New password"],
						["confirm", "New password again"],
					] as const
				).map(([name, label]) => (
					<FormField
						key={name}
						control={form.control}
						name={name}
						render={({ field }) => (
							<FormItem className="gap-[6px]">
								<FormLabel className="text-[13px] font-medium text-ink-2">
									{label}
								</FormLabel>
								<FormControl>
									<div className="relative">
										<Input
											{...field}
											type={shown[name] ? "text" : "password"}
											className={`${input} pr-11`}
											autoComplete={
												name === "currentPassword"
													? "current-password"
													: "new-password"
											}
										/>
										<button
											type="button"
											onClick={() =>
												setShown((s) => ({ ...s, [name]: !s[name] }))
											}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
											aria-label={`${shown[name] ? "Hide" : "Show"} ${label.toLowerCase()}`}
										>
											{shown[name] ? (
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
				))}
				<Button
					type="submit"
					disabled={pending}
					className="h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90"
				>
					{pending ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						"Save and sign in"
					)}
				</Button>
			</form>
		</Form>
	);
}

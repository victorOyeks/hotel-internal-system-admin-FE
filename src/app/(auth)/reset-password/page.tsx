"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { forceResetPassword, logout } from "@/lib/actions";
import { redirect } from "next/navigation";
import { toast } from "sonner";

const formSchema = z
	.object({
		initialPassword: z
			.string()
			.min(8, "Password must be at least 8 characters long"),
		confirmPassword: z
			.string()
			.min(8, "Confirm Password must be at least 8 characters long"),
	})
	.refine((data) => data.initialPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

function ResetPassword() {
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			initialPassword: "",
			confirmPassword: "",
		},
		mode: "onSubmit",
	});
	const [showInitialPassword, setShowInitialPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const { mutateAsync: handleSubmit } = useMutation({
		mutationKey: ["force-reset-password"],
		mutationFn: async (payload: z.infer<typeof formSchema>) => {
			const res = await forceResetPassword({
				newPassword: payload.initialPassword,
				confirmPassword: payload.confirmPassword,
			});

			if (!res.success) {
				throw Error(res.error || "Failed to reset password, try again.");
			}

			return res.data?.data;
		},
		onError: (error) => {
			toast.error("Something went wrong", {
				description: error.message,
			});
		},
		async onSuccess(data) {
			toast.success("Password reset successfully", {
				description: data,
			});
			await logout();
			window.location.href = "/auth";
		},
	});

	return (
		<Card className="w-full h-full md:h-auto md:max-w-[450px]">
			<CardHeader>
				<CardTitle>
					<h1 className="text-2xl font-bold font-inter leading-tight">
						Reset Password
					</h1>
				</CardTitle>
				<CardDescription>
					Enter a safe and secure password you will remember.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				<Form {...form}>
					<form
						id="reset-password-form"
						onSubmit={form.handleSubmit((data) => handleSubmit(data))}
						className="space-y-4"
					>
						<FormField
							name="initialPassword"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>New Password</FormLabel>
									<div className="relative">
										<Input
											type={showInitialPassword ? "text" : "password"}
											{...field}
											className="w-full"
											placeholder="Enter new password"
										/>
										<Button
											type="button"
											variant="link"
											size={"icon"}
											className="absolute right-1 top-1/2 -translate-y-1/2"
											onClick={() =>
												setShowInitialPassword(!showInitialPassword)
											}
										>
											{showInitialPassword ? <EyeOffIcon /> : <EyeIcon />}
										</Button>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="confirmPassword"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirm Password</FormLabel>
									<div className="relative">
										<Input
											type={showConfirmPassword ? "text" : "password"}
											{...field}
											className="w-full"
											placeholder="Confirm new password"
										/>
										<Button
											type="button"
											variant="link"
											size={"icon"}
											className="absolute right-1 top-1/2 -translate-y-1/2"
											onClick={() =>
												setShowConfirmPassword(!showConfirmPassword)
											}
										>
											{showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
										</Button>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>
			</CardContent>

			<CardFooter className="flex-col gap-y-2">
				<Button
					type="submit"
					form="reset-password-form"
					className="w-full font-bold"
					disabled={form.formState.isSubmitting}
				>
					{form.formState.isSubmitting ? (
						<>
							<LoaderCircle className="animate-spin" />
							Resetting, Please wait...
						</>
					) : (
						"Reset password"
					)}
				</Button>
				<Button variant="link" asChild>
					<Link href="/auth">Back to Login</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

export default ResetPassword;

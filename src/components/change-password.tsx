"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
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
import { changePassword } from "@/lib/actions";
import { toast } from "sonner";

const formSchema = z
	.object({
		currentPassword: z.string().nonempty("Can't leave this input blank"),
		newPassword: z
			.string()
			.min(8, "Password must be at least 8 characters long"),
		confirmPassword: z
			.string()
			.min(8, "Confirm Password must be at least 8 characters long"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export function ChangePassword() {
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		mode: "onSubmit",
	});
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const { mutate, isPending } = useMutation({
		mutationKey: ["change-password"],
		mutationFn: async (payload: z.infer<typeof formSchema>) => {
			const res = await changePassword({
				oldPassword: payload.currentPassword,
				newPassword: payload.newPassword,
				confirmPassword: payload.confirmPassword,
			});

			if (!res.success) {
				throw Error(res.error || "Failed to change password, try again.");
			}

			return res.data;
		},
		onError: (error) => {
			toast.error("Something went wrong", {
				description: error.message,
			});
		},
		onSuccess: (data) => {
			toast.success("Password changed successfully!", {
				description: data?.message || "Your password has been updated.",
			});
			form.reset();
		},
	});

	return (
		<Card className="w-full h-full md:h-auto md:max-w-[450px]">
			<CardHeader>
				<CardTitle>
					<h1 className="text-2xl font-bold font-inter leading-tight">
						Change Password
					</h1>
				</CardTitle>
				<CardDescription>
					Enter a safe and secure password you will remember.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				<Form {...form}>
					<form
						id="change-password-form"
						onSubmit={form.handleSubmit((data) => mutate(data))}
						className="space-y-4"
					>
						<FormField
							name="currentPassword"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Current Password</FormLabel>
									<div className="relative">
										<Input
											type={showCurrentPassword ? "text" : "password"}
											{...field}
											className="w-full"
											placeholder="Enter current password"
										/>
										<Button
											type="button"
											variant="link"
											size={"icon"}
											className="absolute right-1 top-1/2 -translate-y-1/2"
											onClick={() =>
												setShowCurrentPassword(!showCurrentPassword)
											}
										>
											{showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
										</Button>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="newPassword"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>New Password</FormLabel>
									<div className="relative">
										<Input
											type={showNewPassword ? "text" : "password"}
											{...field}
											className="w-full"
											placeholder="Enter new password"
										/>
										<Button
											type="button"
											variant="link"
											size={"icon"}
											className="absolute right-1 top-1/2 -translate-y-1/2"
											onClick={() => setShowNewPassword(!showNewPassword)}
										>
											{showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
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

			<CardFooter>
				<Button
					type="submit"
					form="change-password-form"
					className="w-full font-bold"
					disabled={isPending}
				>
					{isPending ? (
						<>
							<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
							<span className="sr-only">Loading...</span>
						</>
					) : (
						"Change Password"
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}

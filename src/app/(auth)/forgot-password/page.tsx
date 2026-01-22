"use client";

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
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/lib/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
	email: z.email("Invalid email address"),
});

function ForgotPassword() {
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
		},
		mode: "onSubmit",
	});

	const router = useRouter();

	const { mutate, isPending } = useMutation({
		mutationKey: ["forgot-password"],
		mutationFn: async (payload: z.infer<typeof formSchema>) => {
			const res = await forgotPassword(payload);

			if (!res.success) {
				throw Error(res.error || "Failed to send OTP, try again.");
			}

			return { ...res.data, email: payload.email };
		},
		onError: (error) => {
			toast.error("Something went wrong", {
				description: error.message,
			});
		},
		onSuccess: (data) => {
			// TODO: Remove OTP from toast when email notification is implemented
			toast.success("OTP Sent!", {
				description: data.otp
					? `Your OTP is: ${data.otp} (Testing only - will be sent via email in production)`
					: "Please check your email for the verification code.",
				duration: 10000, // Show longer for testing
			});
			// Navigate to OTP verification with email in query params
			router.push(
				`/forgot-password/verify-otp?email=${encodeURIComponent(data.email)}`,
			);
		},
	});

	return (
		<Card className="w-full h-full md:h-auto md:max-w-[450px]">
			<CardHeader>
				<CardTitle>
					<h1 className="text-2xl font-bold font-inter leading-tight">
						Forgot Password
					</h1>
				</CardTitle>
				<CardDescription>
					Provide a registered email address, we'll send you an OTP to reset
					your password
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				<Form {...form}>
					<form
						id="forgot-password-form"
						onSubmit={form.handleSubmit((data) => {
							mutate(data);
						})}
						className="space-y-4"
					>
						<FormField
							name="email"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-base font-semibold text-dark-2">
										Email
									</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="Enter your email"
											{...field}
										/>
									</FormControl>
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
					form="forgot-password-form"
					className="w-full font-bold"
					disabled={isPending}
				>
					{isPending ? (
						<>
							<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
							<span className="sr-only">Loading...</span>
						</>
					) : (
						"Send OTP"
					)}
				</Button>
				<Button variant="link" asChild>
					<Link href="/auth">Back to Login</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

export default ForgotPassword;

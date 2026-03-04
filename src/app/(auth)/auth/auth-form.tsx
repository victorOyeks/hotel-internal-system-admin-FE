"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
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
import { login } from "@/lib/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
	CheckCircle2Icon,
	EyeIcon,
	EyeOffIcon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const VERIFICATION_ERRORS: Record<string, string> = {
	missing_token: "No verification token was provided.",
	server_error: "Something went wrong. Please try again.",
};

const formSchema = z.object({
	email: z.email(),
	password: z.string().nonempty("Password is required"),
});

type Props = {
	from?: string;
	verified?: string;
	error?: string;
};

export function AuthForm({ from, verified, error }: Props) {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);

	const loginMutation = useMutation({
		mutationKey: ["login"],
		mutationFn: async (data: z.infer<typeof formSchema>) => {
			const response = await login(data);
			if (!response.success) throw new Error(response.error);
			return response.data;
		},
		onSettled: () => {
			loginMutation.reset();
		},
		onSuccess: () => {
			router.replace(from ?? "/dashboard");
		},
	});

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: { email: "", password: "" },
		mode: "onSubmit",
	});

	const handleSubmit = useCallback(
		async (data: z.infer<typeof formSchema>) => {
			toast.promise(loginMutation.mutateAsync(data), {
				loading: "Logging in, please wait...",
				success: (data) => ({
					message: data.message,
					description: "Redirecting...",
				}),
				error: (error) => {
					const isError = Error.isError(error);

					console.error("Login error:", error);

					if (isError) {
						const isNetworkError = error.message === "fetch failed";
						const cause = error.cause;
						if (Error.isError(cause)) {
							if (isNetworkError) {
								return {
									message: "Network error",
									description:
										"Please check your internet connection and try again.",
								};
							}
							return {
								message: "Login failed",
								description:
									cause.message ||
									"An unexpected error occurred. Please try again.",
							};
						}

						if (isNetworkError) {
							return {
								message: "Network error",
								description:
									"Please check your internet connection and try again.",
							};
						}

						const errorMessage =
							error.message === "400"
								? "Invalid email or password."
								: error.message;

						return {
							message: "Login failed",
							description:
								errorMessage ||
								"An unexpected error occurred. Please try again.",
						};
					}

					if (typeof error === "string") {
						return {
							message: "Login failed",
							description:
								error || "An unexpected error occurred. Please try again.",
						};
					}
					return {
						message: "Login failed",
						description: "An unexpected error occurred. Please try again.",
					};
				},
			});
		},
		[loginMutation],
	);

	return (
		<Card className="w-full h-full md:h-auto md:max-w-[400px]">
			<CardHeader>
				<CardTitle>
					<h1 className="text-2xl font-bold font-inter">Login</h1>
				</CardTitle>
			</CardHeader>

			<CardContent className="space-y-2">
				{verified === "true" && (
					<Alert variant="success">
						<CheckCircle2Icon />
						<AlertTitle>Email verified!</AlertTitle>
						<AlertDescription>
							Your account is active. You can now log in.
						</AlertDescription>
					</Alert>
				)}
				{error && (
					<Alert variant="destructive">
						<XCircleIcon />
						<AlertTitle>Verification failed</AlertTitle>
						<AlertDescription>
							{VERIFICATION_ERRORS[error] ?? decodeURIComponent(error)}
						</AlertDescription>
					</Alert>
				)}

				<Form {...form}>
					<form
						id="auth-form"
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-2"
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
						<FormField
							name="password"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-base font-semibold text-dark-2">
										Password
									</FormLabel>
									<div className="relative">
										<FormControl>
											<Input
												type={showPassword ? "text" : "password"}
												placeholder="Enter your password"
												className="pr-10"
												{...field}
											/>
										</FormControl>
										<Button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											variant="link"
											size="icon"
											className="absolute right-1 top-1/2 -translate-y-1/2"
										>
											{showPassword ? (
												<EyeOffIcon className="h-5 w-5 text-gray-500" />
											) : (
												<EyeIcon className="h-5 w-5 text-gray-500" />
											)}
										</Button>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>

				<div className="flex items-center justify-end">
					<Button variant={"link"} className="text-info px-0" asChild>
						<Link href="/forgot-password">Forgot Password?</Link>
					</Button>
				</div>
			</CardContent>

			<CardFooter className="flex flex-col gap-3">
				<Button
					type="submit"
					form="auth-form"
					className="w-full font-bold"
					disabled={loginMutation.isPending}
				>
					{loginMutation.isPending ? (
						<>
							<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
							<span className="sr-only">Loading...</span>
						</>
					) : (
						"Login"
					)}
				</Button>
				<p className="text-sm text-center text-muted-foreground">
					New to H.M.S?{" "}
					<Button variant="link" className="p-0 h-auto text-info" asChild>
						<Link href="/signup">Register your business</Link>
					</Button>
				</p>
			</CardFooter>
		</Card>
	);
}

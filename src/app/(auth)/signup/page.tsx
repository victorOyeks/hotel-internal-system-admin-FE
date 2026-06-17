"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { hotelSignup } from "@/lib/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	BuildingIcon,
	CheckIcon,
	EyeIcon,
	EyeOffIcon,
	Loader2Icon,
	LockIcon,
	MailCheckIcon,
	MapPinIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const BUSINESS_TYPES = [
	{ value: "HOTEL", label: "Hotel" },
	{ value: "RESORT", label: "Resort" },
	{ value: "MOTEL", label: "Motel" },
	{ value: "BED_AND_BREAKFAST", label: "Bed & Breakfast" },
	{ value: "HOSTEL", label: "Hostel" },
	{ value: "LODGE", label: "Lodge" },
	{ value: "INN", label: "Inn" },
	{ value: "GUEST_HOUSE", label: "Guest House" },
	{ value: "BOUTIQUE_HOTEL", label: "Boutique Hotel" },
	{ value: "APARTMENT_HOTEL", label: "Apartment Hotel" },
];

const TIMEZONES = [
	{ value: "Africa/Abidjan", label: "Africa/Abidjan (GMT+0)" },
	{ value: "Africa/Accra", label: "Africa/Accra (GMT+0)" },
	{ value: "Africa/Cairo", label: "Africa/Cairo (GMT+2)" },
	{ value: "Africa/Lagos", label: "Africa/Lagos (WAT, GMT+1)" },
	{ value: "Africa/Nairobi", label: "Africa/Nairobi (EAT, GMT+3)" },
	{ value: "America/Chicago", label: "America/Chicago (CST, GMT-6)" },
	{ value: "America/Los_Angeles", label: "America/Los_Angeles (PST, GMT-8)" },
	{ value: "America/New_York", label: "America/New_York (EST, GMT-5)" },
	{ value: "America/Sao_Paulo", label: "America/Sao_Paulo (BRT, GMT-3)" },
	{ value: "Asia/Colombo", label: "Asia/Colombo (IST, GMT+5:30)" },
	{ value: "Asia/Dubai", label: "Asia/Dubai (GST, GMT+4)" },
	{ value: "Asia/Karachi", label: "Asia/Karachi (PKT, GMT+5)" },
	{ value: "Asia/Kolkata", label: "Asia/Kolkata (IST, GMT+5:30)" },
	{ value: "Asia/Shanghai", label: "Asia/Shanghai (CST, GMT+8)" },
	{ value: "Asia/Singapore", label: "Asia/Singapore (SGT, GMT+8)" },
	{ value: "Asia/Tokyo", label: "Asia/Tokyo (JST, GMT+9)" },
	{ value: "Australia/Sydney", label: "Australia/Sydney (AEDT, GMT+11)" },
	{ value: "Europe/Amsterdam", label: "Europe/Amsterdam (CET, GMT+1)" },
	{ value: "Europe/Berlin", label: "Europe/Berlin (CET, GMT+1)" },
	{ value: "Europe/London", label: "Europe/London (GMT+0)" },
	{ value: "Europe/Paris", label: "Europe/Paris (CET, GMT+1)" },
	{ value: "Pacific/Auckland", label: "Pacific/Auckland (NZDT, GMT+13)" },
	{ value: "UTC", label: "UTC (GMT+0)" },
];

const CURRENCIES = [
	{ value: "AED", label: "AED - UAE Dirham" },
	{ value: "AUD", label: "AUD - Australian Dollar" },
	{ value: "BRL", label: "BRL - Brazilian Real" },
	{ value: "CAD", label: "CAD - Canadian Dollar" },
	{ value: "CHF", label: "CHF - Swiss Franc" },
	{ value: "CNY", label: "CNY - Chinese Yuan" },
	{ value: "EUR", label: "EUR - Euro" },
	{ value: "GBP", label: "GBP - British Pound" },
	{ value: "GHS", label: "GHS - Ghanaian Cedi" },
	{ value: "INR", label: "INR - Indian Rupee" },
	{ value: "JPY", label: "JPY - Japanese Yen" },
	{ value: "KES", label: "KES - Kenyan Shilling" },
	{ value: "NGN", label: "NGN - Nigerian Naira" },
	{ value: "PKR", label: "PKR - Pakistani Rupee" },
	{ value: "SGD", label: "SGD - Singapore Dollar" },
	{ value: "USD", label: "USD - US Dollar" },
	{ value: "ZAR", label: "ZAR - South African Rand" },
];

const formSchema = z
	.object({
		businessName: z
			.string()
			.min(2, "Must be at least 2 characters")
			.max(200, "Must be at most 200 characters"),
		businessRegistrationNumber: z
			.string()
			.regex(
				/^[A-Z0-9-]{5,50}$/,
				"5-50 uppercase letters, numbers, or hyphens",
			),
		businessType: z.string().min(1, "Business type is required"),
		businessDescription: z.string().max(1000).optional(),
		websiteUrl: z
			.string()
			.regex(
				/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/,
				"Invalid URL format",
			)
			.optional()
			.or(z.literal("")),
		taxId: z.string().max(50).optional(),
		vatNumber: z.string().max(50).optional(),
		ownerFullName: z
			.string()
			.min(2, "Must be at least 2 characters")
			.max(100, "Must be at most 100 characters"),
		ownerPosition: z
			.string()
			.min(1, "Position is required")
			.max(100, "Must be at most 100 characters"),
		email: z.email("Invalid email address"),
		phoneNumber: z
			.string()
			.regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number (e.g. +2348012345678)"),
		alternativePhone: z
			.string()
			.regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
			.optional()
			.or(z.literal("")),
		streetAddress: z.string().max(255).optional().or(z.literal("")),
		city: z.string().max(100).optional().or(z.literal("")),
		stateProvince: z.string().max(100).optional().or(z.literal("")),
		country: z.string().min(1, "Country is required").max(100),
		postalCode: z.string().max(20).optional().or(z.literal("")),
		timezone: z.string().min(1, "Timezone is required"),
		currency: z
			.string()
			.regex(/^[A-Z]{3}$/, "Select a currency"),
		password: z
			.string()
			.min(8, "Must be at least 8 characters")
			.max(128)
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
				"Must include uppercase, lowercase, number, and special character (@$!%*?&#)",
			),
		confirmPassword: z.string().min(1, "Please confirm your password"),
		acceptedTerms: z.boolean().refine((v) => v, {
			message: "You must accept the terms of service",
		}),
		acceptedPrivacyPolicy: z.boolean().refine((v) => v, {
			message: "You must accept the privacy policy",
		}),
		subscribedToMarketing: z.boolean().optional(),
		referralCode: z.string().max(100).optional(),
		referralSource: z.string().max(255).optional(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type FormValues = z.infer<typeof formSchema>;

const STEPS = [
	{
		id: 1,
		title: "Business",
		subtitle: "Tell us about your business",
		icon: BuildingIcon,
		fields: [
			"businessName",
			"businessRegistrationNumber",
			"businessType",
			"businessDescription",
			"websiteUrl",
			"taxId",
			"vatNumber",
		] as const,
	},
	{
		id: 2,
		title: "Owner",
		subtitle: "Your contact information",
		icon: UserIcon,
		fields: [
			"ownerFullName",
			"ownerPosition",
			"email",
			"phoneNumber",
			"alternativePhone",
		] as const,
	},
	{
		id: 3,
		title: "Location",
		subtitle: "Where is your business located?",
		icon: MapPinIcon,
		fields: [
			"streetAddress",
			"city",
			"stateProvince",
			"country",
			"postalCode",
			"timezone",
			"currency",
		] as const,
	},
	{
		id: 4,
		title: "Security",
		subtitle: "Secure your account",
		icon: LockIcon,
		fields: [
			"password",
			"confirmPassword",
			"acceptedTerms",
			"acceptedPrivacyPolicy",
			"subscribedToMarketing",
			"referralCode",
			"referralSource",
		] as const,
	},
] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
	return (
		<div className="flex items-center justify-between w-full">
			{STEPS.map((s, i) => {
				const Icon = s.icon;
				const isComplete = currentStep > s.id;
				const isCurrent = currentStep === s.id;
				const isLast = i === STEPS.length - 1;

				return (
					<div key={s.id} className="flex items-center flex-1 last:flex-none">
						<div className="flex flex-col items-center gap-1">
							<div
								className={`size-9 rounded-full flex items-center justify-center transition-all duration-300 ${
									isComplete
										? "bg-green-500 text-white"
										: isCurrent
											? "bg-primary text-primary-foreground ring-4 ring-primary/20"
											: "bg-gray-100 text-gray-400"
								}`}
							>
								{isComplete ? (
									<CheckIcon className="size-4" />
								) : (
									<Icon className="size-4" />
								)}
							</div>
							<span
								className={`text-[10px] font-medium hidden sm:block ${
									isCurrent
										? "text-primary"
										: isComplete
											? "text-green-600"
											: "text-gray-400"
								}`}
							>
								{s.title}
							</span>
						</div>
						{!isLast && (
							<div
								className={`flex-1 h-0.5 mx-2 mb-4 sm:mb-0 rounded-full transition-colors duration-300 ${
									isComplete ? "bg-green-500" : "bg-gray-200"
								}`}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

function SignupPage() {
	const [step, setStep] = useState(1);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			businessName: "",
			businessRegistrationNumber: "",
			businessType: "",
			businessDescription: "",
			websiteUrl: "",
			taxId: "",
			vatNumber: "",
			ownerFullName: "",
			ownerPosition: "",
			email: "",
			phoneNumber: "",
			alternativePhone: "",
			streetAddress: "",
			city: "",
			stateProvince: "",
			country: "",
			postalCode: "",
			timezone: "",
			currency: "",
			password: "",
			confirmPassword: "",
			acceptedTerms: false,
			acceptedPrivacyPolicy: false,
			subscribedToMarketing: false,
			referralCode: "",
			referralSource: "",
		},
		mode: "onSubmit",
		reValidateMode: "onChange",
	});

	const signupMutation = useMutation({
		mutationKey: ["hotel-signup"],
		mutationFn: async (data: FormValues) => {
			const payload = {
				...data,
				businessDescription: data.businessDescription || undefined,
				websiteUrl: data.websiteUrl || undefined,
				taxId: data.taxId || undefined,
				vatNumber: data.vatNumber || undefined,
				alternativePhone: data.alternativePhone || undefined,
				referralCode: data.referralCode || undefined,
				referralSource: data.referralSource || undefined,
			};
			const response = await hotelSignup(payload);
			if (!response.success) throw new Error(response.error);
			return response.data;
		},
		onSettled: () => {
			signupMutation.reset();
		},
		onSuccess: () => {
			setSubmitted(true);
		},
	});

	const currentStep = STEPS[step - 1];
	const isLastStep = step === STEPS.length;

	const handleNext = useCallback(async () => {
		const fields = STEPS[step - 1].fields as unknown as (keyof FormValues)[];
		const valid = await form.trigger(fields);
		if (valid) setStep((s) => s + 1);
	}, [form, step]);

	const handleSubmit = useCallback(
		(data: FormValues) => {
			toast.promise(signupMutation.mutateAsync(data), {
				loading: "Creating your account...",
				success: () => ({
					message: "Account created!",
					description: "Check your email to verify your account.",
				}),
				error: (error: unknown) => ({
					message: "Signup failed",
					description:
						error instanceof Error
							? error.message
							: "An unexpected error occurred. Please try again.",
				}),
			});
		},
		[signupMutation],
	);

	if (submitted) {
		return (
			<Card className="w-full md:max-w-md overflow-hidden">
				<div className="bg-gradient-to-br from-green-50 to-emerald-50 px-6 pt-10 pb-6 flex flex-col items-center">
					<div className="size-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
						<MailCheckIcon className="size-8 text-green-600" />
					</div>
					<h2 className="text-2xl font-bold text-gray-900">
						You&apos;re almost there!
					</h2>
					<p className="text-sm text-gray-500 mt-1 text-center">
						Your account has been created successfully
					</p>
				</div>
				<CardContent className="pt-6 pb-2 text-center">
					<p className="text-sm text-gray-600 leading-relaxed">
						We&apos;ve sent a verification link to your email address. Please
						check your inbox and click the link to activate your account.
					</p>
					<p className="text-xs text-gray-400 mt-3">
						Didn&apos;t receive the email? Check your spam folder.
					</p>
				</CardContent>
				<CardFooter className="flex flex-col gap-2 pb-6">
					<Button asChild className="w-full font-semibold">
						<Link href="/auth">Go to Login</Link>
					</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card className="w-full md:max-w-2xl overflow-hidden">
			<CardHeader className="pb-4 space-y-4">
				<div>
					<h1 className="text-2xl font-bold font-inter text-primary">
						Create your account
					</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						{currentStep.subtitle}
					</p>
				</div>

				<StepIndicator currentStep={step} />
			</CardHeader>

			<Form {...form}>
				<form
					id="signup-form"
					onSubmit={form.handleSubmit(handleSubmit)}
				>
					<CardContent className="space-y-4">
						{/* Step 1: Business Details */}
						{step === 1 && (
							<>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<FormField
										name="businessName"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Business Name *</FormLabel>
												<FormControl>
													<Input placeholder="Acme Hotels Ltd." {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="businessRegistrationNumber"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Registration Number *</FormLabel>
												<FormControl>
													<Input
														placeholder="RC-12345"
														className="uppercase"
														onChange={(e) =>
															field.onChange(e.target.value.toUpperCase())
														}
														value={field.value}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									name="businessType"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Business Type *</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{BUSINESS_TYPES.map((t) => (
														<SelectItem key={t.value} value={t.value}>
															{t.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="businessDescription"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Brief description of your business..."
													className="resize-none"
													rows={3}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid grid-cols-2 gap-3">
									<FormField
										name="taxId"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Tax ID</FormLabel>
												<FormControl>
													<Input placeholder="Optional" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="vatNumber"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>VAT Number</FormLabel>
												<FormControl>
													<Input placeholder="Optional" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									name="websiteUrl"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Website URL</FormLabel>
											<FormControl>
												<Input
													placeholder="https://yourhotel.com"
													type="url"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</>
						)}

						{/* Step 2: Owner & Contact */}
						{step === 2 && (
							<>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<FormField
										name="ownerFullName"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Full Name *</FormLabel>
												<FormControl>
													<Input placeholder="Jane Doe" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="ownerPosition"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Position *</FormLabel>
												<FormControl>
													<Input placeholder="CEO, Director..." {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									name="email"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Business Email *</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="owner@yourhotel.com"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<FormField
										name="phoneNumber"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Phone Number *</FormLabel>
												<FormControl>
													<Input placeholder="+2348012345678" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="alternativePhone"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Alternative Phone</FormLabel>
												<FormControl>
													<Input placeholder="+2348087654321" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</>
						)}

						{/* Step 3: Business Address */}
						{step === 3 && (
							<>
								<FormField
									name="streetAddress"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Street Address</FormLabel>
											<FormControl>
												<Input placeholder="123 Main Street" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid grid-cols-2 gap-3">
									<FormField
										name="city"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>City</FormLabel>
												<FormControl>
													<Input placeholder="Lagos" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="stateProvince"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>State / Province</FormLabel>
												<FormControl>
													<Input placeholder="Lagos State" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<FormField
										name="country"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Country *</FormLabel>
												<FormControl>
													<Input placeholder="Nigeria" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="postalCode"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Postal Code</FormLabel>
												<FormControl>
													<Input placeholder="100001" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<FormField
										name="timezone"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Timezone *</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select timezone" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{TIMEZONES.map((tz) => (
															<SelectItem key={tz.value} value={tz.value}>
																{tz.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="currency"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Currency *</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select currency" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{CURRENCIES.map((c) => (
															<SelectItem key={c.value} value={c.value}>
																{c.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</>
						)}

						{/* Step 4: Account & Terms */}
						{step === 4 && (
							<>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<FormField
										name="password"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password *</FormLabel>
												<div className="relative">
													<FormControl>
														<Input
															type={showPassword ? "text" : "password"}
															placeholder="Create a password"
															className="pr-10"
															{...field}
														/>
													</FormControl>
													<Button
														type="button"
														variant="link"
														size="icon"
														className="absolute right-1 top-1/2 -translate-y-1/2"
														onClick={() => setShowPassword((v) => !v)}
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
									<FormField
										name="confirmPassword"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Confirm Password *</FormLabel>
												<div className="relative">
													<FormControl>
														<Input
															type={showConfirm ? "text" : "password"}
															placeholder="Repeat your password"
															className="pr-10"
															{...field}
														/>
													</FormControl>
													<Button
														type="button"
														variant="link"
														size="icon"
														className="absolute right-1 top-1/2 -translate-y-1/2"
														onClick={() => setShowConfirm((v) => !v)}
													>
														{showConfirm ? (
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
								</div>
								<p className="text-xs text-muted-foreground -mt-1">
									Min 8 characters with uppercase, lowercase, number, and
									special character
								</p>

								<div className="grid grid-cols-2 gap-3">
									<FormField
										name="referralCode"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Referral Code</FormLabel>
												<FormControl>
													<Input placeholder="Optional" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										name="referralSource"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>How did you find us?</FormLabel>
												<FormControl>
													<Input placeholder="Google, friend..." {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="space-y-3 pt-2 border-t">
									<FormField
										name="acceptedTerms"
										control={form.control}
										render={({ field }) => (
											<FormItem className="flex items-start gap-3">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-0.5 leading-none">
													<FormLabel className="font-normal">
														I accept the{" "}
														<span className="text-primary font-medium underline">
															Terms of Service
														</span>{" "}
														*
													</FormLabel>
													<FormMessage />
												</div>
											</FormItem>
										)}
									/>
									<FormField
										name="acceptedPrivacyPolicy"
										control={form.control}
										render={({ field }) => (
											<FormItem className="flex items-start gap-3">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-0.5 leading-none">
													<FormLabel className="font-normal">
														I accept the{" "}
														<span className="text-primary font-medium underline">
															Privacy Policy
														</span>{" "}
														*
													</FormLabel>
													<FormMessage />
												</div>
											</FormItem>
										)}
									/>
									<FormField
										name="subscribedToMarketing"
										control={form.control}
										render={({ field }) => (
											<FormItem className="flex items-start gap-3">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="leading-none">
													<FormLabel className="font-normal">
														Send me product updates and tips
													</FormLabel>
												</div>
											</FormItem>
										)}
									/>
								</div>
							</>
						)}
					</CardContent>

					<CardFooter className="flex flex-col gap-3 pt-2">
						<div className="flex w-full gap-2">
							{step > 1 && (
								<Button
									type="button"
									variant="outline"
									onClick={() => setStep((s) => s - 1)}
									disabled={signupMutation.isPending}
								>
									<ArrowLeftIcon className="mr-1 size-4" />
									Back
								</Button>
							)}
							{isLastStep ? (
								<Button
									type="submit"
									form="signup-form"
									className="flex-1 font-semibold"
									disabled={signupMutation.isPending}
								>
									{signupMutation.isPending ? (
										<Loader2Icon className="size-4 animate-spin" />
									) : (
										"Create Account"
									)}
								</Button>
							) : (
								<Button
									type="button"
									className="flex-1 font-semibold"
									onClick={handleNext}
								>
									Continue
									<ArrowRightIcon className="ml-1 size-4" />
								</Button>
							)}
						</div>

						<p className="text-sm text-center text-muted-foreground">
							Already have an account?{" "}
							<Button variant="link" className="p-0 h-auto text-info" asChild>
								<Link href="/auth">Sign in</Link>
							</Button>
						</p>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}

export default SignupPage;

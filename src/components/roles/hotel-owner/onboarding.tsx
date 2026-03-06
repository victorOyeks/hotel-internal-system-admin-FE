"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	createHotelBranch,
	onboardManagerToHotel,
} from "@/lib/actions";
import type { HotelManager } from "@/lib/fetch";
import { switchOwnerCurrentHotel } from "@/lib/hotel-owner-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	BuildingIcon,
	CheckCircle2Icon,
	Loader2Icon,
	UserPlusIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const managerSchema = z.object({
	fullName: z.string().min(2, "Full name is required"),
	email: z.string().email("Enter a valid email address"),
	phoneNumber: z.string().min(7, "Enter a valid phone number"),
});

const hotelSchema = z.object({
	name: z.string().min(2, "Branch name is required"),
	hotelAddress: z.string().min(5, "Branch address is required"),
	location: z.string().min(2, "City/area is required"),
	managerId: z.string().min(1, "Please select a manager"),
});

type ManagerFormValues = z.infer<typeof managerSchema>;
type HotelFormValues = z.infer<typeof hotelSchema>;

type Props = {
	existingManagers: HotelManager[];
};

// Steps: 1 = Manager, 2 = Branch, 3 = Done
type Step = 1 | 2 | 3;

export function HotelOwnerOnboarding({ existingManagers }: Props) {
	const router = useRouter();
	const hasManagers = existingManagers.length > 0;
	// Skip to step 2 (branch) if managers exist, otherwise step 1 (manager)
	const initialStep: Step = hasManagers ? 2 : 1;
	const [step, setStep] = useState<Step>(initialStep);
	const [managers, setManagers] = useState<HotelManager[]>(existingManagers);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const managerForm = useForm<ManagerFormValues>({
		resolver: zodResolver(managerSchema),
		defaultValues: { fullName: "", email: "", phoneNumber: "" },
	});

	const hotelForm = useForm<HotelFormValues>({
		resolver: zodResolver(hotelSchema),
		defaultValues: {
			name: "",
			hotelAddress: "",
			location: "",
			managerId: managers.length === 1 ? managers[0].id : "",
		},
	});

	async function handleManagerSubmit(values: ManagerFormValues) {
		setIsSubmitting(true);
		try {
			const result = await onboardManagerToHotel(values);
			if (!result.success) {
				toast.error(result.error ?? "Failed to create manager");
				return;
			}
			const newManager: HotelManager = {
				id: result.data?.data?.id ?? "",
				customId: result.data?.data?.customId ?? null,
				fullName: values.fullName,
				email: values.email,
				phoneNumber: values.phoneNumber,
			};
			setManagers((prev) => [...prev, newManager]);
			hotelForm.setValue("managerId", newManager.id);
			toast.success("Manager account created successfully!");
			setStep(2);
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleHotelSubmit(values: HotelFormValues) {
		setIsSubmitting(true);
		try {
			const result = await createHotelBranch(values);
			if (!result.success) {
				toast.error(result.error ?? "Failed to create branch");
				return;
			}
			const hotelId = result.data?.id;
			if (hotelId) {
				await switchOwnerCurrentHotel(hotelId);
			}
			toast.success("Branch created successfully!");
			setStep(3);
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (step === 3) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Card className="w-full max-w-lg text-center">
					<CardHeader className="pb-4">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
							<CheckCircle2Icon className="h-8 w-8 text-green-600" />
						</div>
						<CardTitle className="text-2xl">You're All Set!</CardTitle>
						<CardDescription className="text-base">
							Your manager and first branch have been set up. You can now
							start managing your property.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							className="w-full"
							size="lg"
							onClick={() => router.refresh()}
						>
							Go to Dashboard
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<div className="w-full max-w-lg space-y-6">
				<div className="text-center space-y-2">
					<h1 className="text-2xl font-bold tracking-tight">
						Welcome to Hospio360
					</h1>
					<p className="text-muted-foreground">
						Let's set up your hotel in a few quick steps.
					</p>
				</div>

				{/* Step indicators */}
				<div className="flex items-center justify-center gap-3">
					<StepIndicator
						step={1}
						currentStep={step}
						icon={<UserPlusIcon className="h-4 w-4" />}
						label="Manager"
					/>
					<div className="h-px w-6 bg-border" />
					<StepIndicator
						step={2}
						currentStep={step}
						icon={<BuildingIcon className="h-4 w-4" />}
						label="Branch"
					/>
				</div>

				{/* Step 1: Manager */}
				{step === 1 && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<UserPlusIcon className="h-5 w-5" />
								Create Your First Manager
							</CardTitle>
							<CardDescription>
								A manager will handle the day-to-day operations of your branch.
								They'll be assigned to your branch in the next step.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Form {...managerForm}>
								<form
									onSubmit={managerForm.handleSubmit(handleManagerSubmit)}
									className="space-y-4"
								>
									<FormField
										control={managerForm.control}
										name="fullName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Full Name</FormLabel>
												<FormControl>
													<Input placeholder="John Doe" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={managerForm.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email Address</FormLabel>
												<FormControl>
													<Input
														type="email"
														placeholder="manager@example.com"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={managerForm.control}
										name="phoneNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Phone Number</FormLabel>
												<FormControl>
													<Input placeholder="+234 800 000 0000" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										type="submit"
										className="w-full"
										size="lg"
										disabled={isSubmitting}
									>
										{isSubmitting && (
											<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
										)}
										Create Manager & Continue
									</Button>
								</form>
							</Form>
						</CardContent>
					</Card>
				)}

				{/* Step 2: Branch */}
				{step === 2 && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BuildingIcon className="h-5 w-5" />
								Add Your First Branch
							</CardTitle>
							<CardDescription>
								Set up your branch location and assign a manager to it.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Form {...hotelForm}>
								<form
									onSubmit={hotelForm.handleSubmit(handleHotelSubmit)}
									className="space-y-4"
								>
									<FormField
										control={hotelForm.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Branch Name</FormLabel>
												<FormControl>
													<Input
														placeholder="e.g Main Branch, Lagos Island"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={hotelForm.control}
										name="hotelAddress"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Branch Address</FormLabel>
												<FormControl>
													<Input
														placeholder="e.g 123 Main Street, Lagos"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={hotelForm.control}
										name="location"
										render={({ field }) => (
											<FormItem>
												<FormLabel>City / Area</FormLabel>
												<FormControl>
													<Input placeholder="Lagos" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={hotelForm.control}
										name="managerId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Assign Manager</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select a manager" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{managers.map((m) => (
															<SelectItem key={m.id} value={m.id}>
																{m.fullName}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										type="submit"
										className="w-full"
										size="lg"
										disabled={isSubmitting}
									>
										{isSubmitting && (
											<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
										)}
										Add Branch
									</Button>
								</form>
							</Form>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}

function StepIndicator({
	step,
	currentStep,
	icon,
	label,
}: {
	step: number;
	currentStep: number;
	icon: React.ReactNode;
	label: string;
}) {
	const isActive = step === currentStep;
	const isComplete = step < currentStep;

	return (
		<div className="flex items-center gap-2">
			<div
				className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
					isComplete
						? "border-green-600 bg-green-600 text-white"
						: isActive
							? "border-primary bg-primary text-primary-foreground"
							: "border-muted-foreground/30 text-muted-foreground/50"
				}`}
			>
				{isComplete ? <CheckCircle2Icon className="h-4 w-4" /> : icon}
			</div>
			<span
				className={`text-sm font-medium ${
					isActive
						? "text-foreground"
						: isComplete
							? "text-green-600"
							: "text-muted-foreground/50"
				}`}
			>
				{label}
			</span>
		</div>
	);
}

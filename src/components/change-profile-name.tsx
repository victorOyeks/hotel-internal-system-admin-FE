"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "@/lib/actions";
import { toast } from "sonner";

const formSchema = z.object({
	fullName: z.string().nonempty("Full name is required"),
	phoneNumber: z.string().optional(),
});

type Props = {
	defaultValues: {
		fullName: string;
		phoneNumber?: string | null;
	};
	onClose?: () => void;
};

export function ChangeProfileName({ defaultValues, onClose }: Props) {
	const router = useRouter();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			fullName: defaultValues.fullName ?? "",
			phoneNumber: defaultValues.phoneNumber ?? "",
		},
		mode: "onSubmit",
	});

	const { mutate, isPending } = useMutation({
		mutationKey: ["update-profile"],
		mutationFn: async (payload: z.infer<typeof formSchema>) => {
			const res = await updateProfile(payload);
			if (!res.success) {
				throw new Error(res.error || "Failed to update profile, try again.");
			}
			return res.data;
		},
		onError: (error) => {
			toast.error("Something went wrong", {
				description: error.message,
			});
		},
		onSuccess: (data) => {
			toast.success("Profile updated!", {
				description: data?.message || "Your profile has been updated.",
			});
			router.refresh();
			onClose?.();
		},
	});

	return (
		<Form {...form}>
			<form
				id="change-profile-form"
				onSubmit={form.handleSubmit((data) => mutate(data))}
				className="space-y-4"
			>
				<FormField
					name="fullName"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Full Name</FormLabel>
							<FormControl>
								<Input placeholder="Enter your full name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="phoneNumber"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Phone Number</FormLabel>
							<FormControl>
								<Input
									type="tel"
									placeholder="Enter your phone number"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					type="submit"
					className="w-full font-bold"
					disabled={isPending}
				>
					{isPending ? (
						<>
							<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
							<span className="sr-only">Loading...</span>
						</>
					) : (
						"Save Changes"
					)}
				</Button>
			</form>
		</Form>
	);
}

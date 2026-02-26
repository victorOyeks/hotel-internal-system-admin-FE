"use client";

import { cn, formatCurrency } from "@/lib/utils";
import type { RoomDetails } from "@/lib/fetch";
import {
	DialogTitle,
	DialogDescription,
	Dialog,
	DialogTrigger,
	DialogContent,
} from "@/components/ui/dialog";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Combobox } from "@/components/ui/combobox";
import {
	BedIcon,
	ChevronRightIcon,
	Loader2Icon,
	PlusIcon,
	CheckIcon,
	ChevronsUpDownIcon,
} from "lucide-react";
import {
	useEffect,
	useState,
	type PropsWithChildren,
	type ReactNode,
} from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { parseAsString, useQueryState, useQueryStates } from "nuqs";
import type * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	checkInGuest,
	makeReservation,
	reportLostItem,
} from "@/lib/front-desk-actions";
import { toast } from "sonner";
import { revalidateRoute, uploadImage } from "@/lib/actions";
import {
	assignBookingToOrganization,
	getOrganizationsForCurrentUser,
} from "@/lib/corporate-actions";
import type { APIOutput } from "@/lib/action-utils";
import { SuccessDialog } from "@/components/shared/shared-dialogs";
import { atom, useAtom, useSetAtom } from "jotai";
import { DatePicker } from "@/components/shared/date-picker";
import { formatDate } from "date-fns";

/** Format a Date to yyyy-mm-dd using local timezone (avoids UTC shift). */
function toLocalDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

const successDialogAtom = atom({
	show: false,
	message: "",
});

export function FrontDeskStats({
	stats,
}: {
	stats: APIOutput<"@get/api/front-desks/dashboard-cards">["data"];
}) {
	const data = [
		{
			label: "Total Check-Ins",
			value: stats.totalCheckIns,
			color: "text-green-500 bg-green-500/10",
		},
		{
			label: "Total Check-Outs",
			value: stats.totalCheckOuts,
			color: "text-red-500 bg-red-500/10",
		},
		{
			label: "Total Available Rooms",
			value: stats.totalAvailableRooms,
			color: "text-blue-500 bg-blue-500/10",
		},
		{
			label: "Total Reservations",
			value: stats.totalReservedRooms,
			color: "text-yellow-500 bg-yellow-500/10",
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
			{data.map((stat) => (
				<div
					key={stat.label}
					className="bg-card border border-primary-5/10 rounded-xl md:rounded-2xl p-3 flex flex-col gap-y-4"
				>
					<div
						className={cn(
							"size-10 rounded-full flex items-center justify-center mb-2",
							stat.color,
						)}
					>
						<BedIcon />
					</div>
					<div className="space-y-2">
						<div className="text-sm text-muted-foreground">{stat.label}</div>
						<div className="text-2xl font-medium">{stat.value}</div>
					</div>
				</div>
			))}
		</div>
	);
}

function ReportLostItem({ setOpen }: { setOpen?: (open: boolean) => void }) {
	const [showSummary, setShowSummary] = useState(false);
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const form = useForm({
		resolver: zodResolver(lostItemFormSchema),
		defaultValues: {
			itemName: "",
			description: "",
			imageUrl: "",
			location: "",
			dateFound: new Date().toISOString().split("T")[0],
		},
	});

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedImage(file);

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setImagePreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const uploadImageToUrl = async (file: File) => {
		const data = await uploadImage({ file });
		if (data.error) {
			throw new Error(data.error);
		}
		return data.data?.url!;
	};

	const { isPending, mutate } = useMutation({
		mutationFn: async (data: z.infer<typeof lostItemFormSchema>) => {
			const finalData = { ...data };

			// Upload image if selected
			if (selectedImage) {
				const imageUrl = await uploadImageToUrl(selectedImage);
				finalData.imageUrl = imageUrl;
			}

			const response = await reportLostItem(finalData);
			if (!response.success) {
				throw new Error(response.error || "Failed to report lost item");
			}

			return { message: "Lost item reported successfully" };
		},
		onError: (e) => {
			toast.error("Something went wrong while reporting the lost item.", {
				description: e.message,
			});
		},
		onSuccess: async (data) => {
			toast.success(data.message || "Lost item reported successfully.");
			await revalidateRoute("/front-desk/lost-and-found");
			form.reset();
			setSelectedImage(null);
			setImagePreview(null);
			setShowSummary(false);
			setOpen?.(false);
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={(e) => e.preventDefault()} className="space-y-4">
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="itemName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Item Name</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g. Wallet, Keys, Phone..."
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="location"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Location Found</FormLabel>
									<FormControl>
										<Input placeholder="e.g. 101, Lobby..." {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="dateFound"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Date Found</FormLabel>
								<FormControl>
									<DatePicker
										initialDate={field.value}
										onChange={field.onChange}
										placeholder="Select date found"
										minDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					{/* Image Upload */}
					<div className="space-y-2">
						<Label>Image (Optional)</Label>
						{!imagePreview ? (
							<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
								<Input
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									className="hidden"
									id="image-upload"
								/>
								<label
									htmlFor="image-upload"
									className="cursor-pointer flex flex-col items-center gap-2"
								>
									<div className="text-gray-500">
										<svg
											className="w-8 h-8 mx-auto"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-label="Upload image"
										>
											<title>Upload image</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
									</div>
									<div className="text-sm">
										<span className="text-primary font-medium">
											Click to upload
										</span>
										<span className="text-gray-500"> or drag and drop</span>
									</div>
									<div className="text-xs text-gray-400">
										PNG, JPG, GIF up to 10MB
									</div>
								</label>
							</div>
						) : (
							<div className="relative w-full h-40 rounded-lg border overflow-hidden">
								<div
									className="w-full h-full bg-cover bg-center"
									style={{ backgroundImage: `url(${imagePreview})` }}
								/>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									className="absolute top-2 right-2 h-8 w-8 p-0"
									onClick={() => {
										setSelectedImage(null);
										setImagePreview(null);
									}}
								>
									<svg
										className="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-label="Delete image"
									>
										<title>Delete image</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</Button>
							</div>
						)}
					</div>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem className="flex flex-col">
								<FormLabel className="leading-none">Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Provide detailed description of the item, including color, size, brand, condition, and where exactly it was found..."
										className="resize-none h-full"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<div className="pt-2">
					<Button
						type="button"
						className="w-full font-semibold"
						onClick={() => {
							form.trigger().then((isValid) => {
								if (isValid) {
									setShowSummary(true);
								}
							});
						}}
						disabled={isPending}
					>
						Review & Submit
					</Button>
				</div>

				{/* Summary Confirmation Dialog */}
				<Dialog open={showSummary} onOpenChange={setShowSummary}>
					<DialogContent className="max-w-lg">
						<DialogTitle>Confirm Lost Item Report</DialogTitle>
						<DialogDescription>
							Please review the details before submitting the report.
						</DialogDescription>

						<div className="space-y-4">
							<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
								<h3 className="text-sm font-medium text-orange-900 mb-3">
									Lost Item Summary
								</h3>
								<div className="space-y-3 text-sm">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<span className="text-orange-700 font-medium block">
												Item:
											</span>
											<span className="text-orange-800">
												{form.watch("itemName")}
											</span>
										</div>
										{/* <div>
                      <span className="text-orange-700 font-medium block">
                        Location:
                      </span>
                      <span className="text-orange-800">
                        {form.watch("roomIdentifier")}
                      </span>
                    </div> */}
									</div>

									<div>
										<span className="text-orange-700 font-medium block">
											Date Found:
										</span>
										<span className="text-orange-800">
											{formatDate(
												new Date(form.watch("dateFound")),
												"MMMM d, yyyy",
											)}
										</span>
									</div>

									{form.watch("description") && (
										<div className="pt-2 border-t border-orange-200">
											<span className="text-orange-700 font-medium block mb-2">
												Description:
											</span>
											<p className="text-orange-800 text-sm leading-relaxed bg-white rounded p-2 border border-orange-100">
												{form.watch("description")}
											</p>
										</div>
									)}

									{selectedImage && (
										<div className="pt-2 border-t border-orange-200">
											<span className="text-orange-700 font-medium block mb-2">
												Image:
											</span>
											<div className="w-20 h-20 rounded-lg border overflow-hidden">
												<div
													className="w-full h-full bg-cover bg-center"
													style={{ backgroundImage: `url(${imagePreview})` }}
												/>
											</div>
										</div>
									)}
								</div>
							</div>

							<div className="flex gap-3 pt-2">
								<Button
									variant="outline"
									onClick={() => setShowSummary(false)}
									className="flex-1"
								>
									Edit Details
								</Button>
								<Button
									onClick={() => {
										const formData = form.getValues();
										mutate(formData);
									}}
									disabled={isPending}
									className="flex-1"
								>
									{isPending ? (
										<>
											<Loader2Icon className="animate-spin mr-2 h-4 w-4" />
											Submitting...
										</>
									) : (
										"Confirm & Submit"
									)}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</form>
		</Form>
	);
}

function CreateNewBookingForm({
	data,
	setOpen,
}: {
	setOpen: (open: boolean) => void;
	open: boolean;
	data: {
		rooms: Array<RoomType>;
		roomTypes: Array<string>;
	};
}) {
	const [mode, setMode] = useState<"check-in" | "reservation">("check-in");
	return (
		<div className="space-y-4">
			<div className="border-b border-primary-5/20 max-w-[content]">
				<Button
					variant={mode === "check-in" ? "secondary" : "ghost"}
					className="rounded-none"
					onClick={() => setMode("check-in")}
				>
					Check-In
				</Button>
				<Button
					variant={mode === "reservation" ? "secondary" : "ghost"}
					className="rounded-none"
					onClick={() => setMode("reservation")}
				>
					Reservation
				</Button>
			</div>

			<UnifiedBookingForm key={mode} data={data} setOpen={setOpen} mode={mode} />
		</div>
	);
}

const bookingFormSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		guestName: z.string().min(1, "Guest name is required"),
		guestEmail: z.string().email("Invalid email address").or(z.literal("")),
		phoneNumber: z.string().min(1, "Phone number is required"),
		noOfAdults: z.number().int().positive("Number of adults must be at least 1"),
		noOfChildren: z
			.number()
			.int()
			.nonnegative("Number of children cannot be negative")
			.default(0),
		nightlyRate: z.number().positive("Nightly rate must be greater than 0"),
		dailySpendingCap: z.preprocess(
			(val) => (val === "" || val === undefined || Number.isNaN(val) ? 0 : Number(val)),
			z.number().nonnegative("Daily spending cap must be 0 or greater"),
		),
		discountValue: z.number().nonnegative().default(0),
		discountType: z.enum(["PERCENTAGE", "FIXED"]).default("FIXED"),
		initialPayment: z.object({
			amount: z.number().nonnegative(),
			currency: z.string().default("NGN"),
			method: z.enum([
				"CASH",
				"CARD",
				"CREDIT_CARD",
				"DEBIT_CARD",
				"BANK_TRANSFER",
				"MOBILE_MONEY",
				"CHEQUE",
				"ONLINE_PAYMENT",
				"PAYPAL",
				"CRYPTOCURRENCY",
				"DIRECT_DEBIT",
				"PETTY_CASH",
				"OTHERS",
			]),
			reference: z.string().min(1, "Payment reference is required"),
			status: z.enum([
				"SUCCESS",
				"FAILED",
				"PENDING",
				"CANCELLED",
				"REFUNDED",
				"PARTLY_PAID",
				"FULLY_PAID",
			]),
			type: z.enum([
				"DEPOSIT",
				"INSTALLMENT",
				"FINAL",
				"REFUND",
				"OTHER",
			]),
			paymentDate: z.string(),
		}),
		checkInDate: z.string().min(1, "Check-in date is required"),
		checkOutDate: z.string().min(1, "Check-out date is required"),
		roomId: z.string().min(1, "Room is required"),
		notes: z.string().optional(),
	})
	.refine(
		(data) => {
			const checkIn = new Date(data.checkInDate);
			const checkOut = new Date(data.checkOutDate);
			return checkOut > checkIn;
		},
		{
			message: "Check-out date must be after check-in date",
			path: ["checkOutDate"],
		},
	);

const lostItemFormSchema = z.object({
	itemName: z.string().nonempty("Item name is required"),
	description: z.string().nonempty("Description is required"),
	imageUrl: z.url("Please enter a valid URL").optional().or(z.literal("")),
	location: z.string().nonempty("Location is required for the lost item"),
	dateFound: z.string().nonempty("Date found is required"),
});

function RoomListCombobox({
	value,
	onSelect,
	rooms,
}: {
	value: string;
	onSelect: (value: string) => void;
	rooms: Array<RoomType>;
}) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useQueryState(
		"room:search",
		parseAsString.withDefault(""),
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					{value
						? rooms.find((room) => room.id === value)?.roomIdentifier
						: "Select a room"}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search rooms..."
						value={searchQuery}
						onValueChange={setSearchQuery}
					/>
					<CommandList>
						<CommandEmpty>No room found.</CommandEmpty>
						<CommandGroup>
							{rooms.map((room) => (
								<CommandItem
									key={room.id}
									value={room.id}
									onSelect={(currentValue) => {
										onSelect(currentValue === value ? "" : currentValue);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === room.id ? "opacity-100" : "opacity-0",
										)}
									/>
									{room.roomIdentifier}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}



export function UnifiedBookingForm({
	data,
	setOpen,
	mode,
}: {
	data: {
		rooms: Array<RoomType>;
		roomTypes: Array<string>;
	};
	setOpen: (open: boolean) => void;
	mode: "check-in" | "reservation";
}) {
	const setShowSuccessDialog = useSetAtom(successDialogAtom);
	const isCheckIn = mode === "check-in";

	const [roomQuery, setRoomQuery] = useQueryStates({
		"room:type": parseAsString.withDefault(""),
	});

	const [selectedOrgId, setSelectedOrgId] = useState("");
	const [showPayment, setShowPayment] = useState(false);

	const { data: orgData } = useQuery({
		queryKey: ["front-desk", "organizations"],
		queryFn: () => getOrganizationsForCurrentUser(),
	});
	const organizations = orgData?.organizations ?? [];
	const orgHotelId = orgData?.hotelId ?? "";

	const form = useForm({
		resolver: zodResolver(bookingFormSchema),
		defaultValues: {
			title: "Mr",
			guestName: "",
			guestEmail: "",
			phoneNumber: "",
			noOfAdults: 1,
			noOfChildren: 0,
			nightlyRate: 0,
			dailySpendingCap: 0,
			checkInDate: isCheckIn ? toLocalDateString(new Date()) : "",
			checkOutDate: isCheckIn ? toLocalDateString(new Date(Date.now() + 86400000)) : "",
			discountValue: 0,
			discountType: "FIXED" as "FIXED" | "PERCENTAGE",
			initialPayment: {
				amount: 0,
				currency: "NGN",
				method: "CASH" as const,
				reference: `REF-${Date.now()}`,
				status: "SUCCESS" as const,
				type: "DEPOSIT" as const,
				paymentDate: new Date().toISOString(),
			},
			roomId: "",
			notes: "",
		},
		mode: "onSubmit",
		reValidateMode: "onChange",
	});

	const { isPending, mutate } = useMutation({
		mutationFn: async (formData: z.infer<typeof bookingFormSchema>) => {
			const { roomId, initialPayment, ...restData } = formData;
			const includePayment = showPayment && initialPayment.amount > 0;
			const payload = {
				roomId,
				...restData,
				initialPayment: includePayment
					? { ...initialPayment, paymentDate: new Date(initialPayment.paymentDate) }
					: undefined,
			};

			if (isCheckIn) {
				const response = await checkInGuest(payload);
				if (!response.success) {
					throw new Error(response.error || "An error occurred");
				}
				return { data: response.data, bookingId: response.data?.data?.id };
			}

			const response = await makeReservation(payload);
			if (!response.success) {
				throw new Error(response.error || "An error occurred");
			}
			return { data: response.data, bookingId: response.data?.data?.bookingId };
		},
		onError: (error) => {
			toast.error(error.message || `An error occurred during ${isCheckIn ? "check-in" : "reservation"}.`);
		},
		onSuccess: async ({ data, bookingId }) => {
			if (selectedOrgId && orgHotelId && bookingId) {
				try {
					const assignResult = await assignBookingToOrganization({
						hotelId: orgHotelId,
						bookingId,
						organizationId: selectedOrgId,
						dailySpendingCap: form.getValues("dailySpendingCap") || 0,
					});
					if (!assignResult.success) {
						toast.error(
							`${isCheckIn ? "Guest checked in" : "Reservation created"} but organization assignment failed`,
							{ description: assignResult.error },
						);
					}
				} catch {
					toast.error(
						`${isCheckIn ? "Guest checked in" : "Reservation created"} but organization assignment failed`,
					);
				}
			}

			toast.success(data?.message || (isCheckIn ? "Guest checked in successfully." : "Reservation created successfully."));
			setShowSuccessDialog({
				show: true,
				message: selectedOrgId
					? isCheckIn
						? "Guest checked in and assigned to organization."
						: "Reservation created and assigned to organization."
					: isCheckIn
						? "Guest checked in successfully."
						: "Reservation created successfully.",
			});
			form.reset();
			setSelectedOrgId("");
			setOpen(false);
			await revalidateRoute("/front-desk");
		},
	});

	// Clean queries on unmount
	// biome-ignore lint/correctness/useExhaustiveDependencies: cleanup only
	useEffect(() => {
		return () => {
			setRoomQuery({ "room:type": "" });
		};
	}, []);

	return (
		<Form {...form}>
			<form
				className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-hidden"
				onSubmit={form.handleSubmit((formData) => {
					mutate(formData);
				})}
			>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-2">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select title" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{["Mr", "Mrs", "Ms", "Dr", "Prof", "Chief", "Alhaji", "Hajia"].map((title) => (
											<SelectItem key={title} value={title}>
												{title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="guestName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Guest Name</FormLabel>
								<FormControl>
									<Input placeholder="e.g John Doe" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="guestEmail"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input placeholder="e.g guest@example.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="phoneNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Phone Number</FormLabel>
								<FormControl>
									<Input placeholder="e.g +234 801 234 5678" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid gap-2">
						<Label>Room Type</Label>
						<Combobox
							options={data.roomTypes.map((type) => ({
								label: type,
								value: type,
							}))}
							value={roomQuery["room:type"]}
							onSelect={(value) => setRoomQuery({ "room:type": value })}
							placeholder="Select room type..."
							emptyText="No room types found"
						/>
					</div>

					<FormField
						control={form.control}
						name="roomId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Room</FormLabel>
								<FormControl>
									<RoomListCombobox
										rooms={data.rooms}
										value={field.value}
										onSelect={(value) => {
											field.onChange(value);
											const room = data.rooms.find((r) => r.id === value);
											if (room) {
												form.setValue("nightlyRate", room.roomPrice);
											}
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="noOfAdults"
						render={() => (
							<FormItem>
								<FormLabel>Number of Adults</FormLabel>
								<FormControl>
									<Input
										type="number"
										placeholder="e.g 2"
										min="1"
										{...form.register("noOfAdults", { valueAsNumber: true })}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="noOfChildren"
						render={() => (
							<FormItem>
								<FormLabel>Number of Children</FormLabel>
								<FormControl>
									<Input
										type="number"
										placeholder="e.g 0"
										min="0"
										{...form.register("noOfChildren", { valueAsNumber: true })}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="nightlyRate"
						render={() => (
							<FormItem>
								<FormLabel>Nightly Rate</FormLabel>
								<FormControl>
									<Input
										type="number"
										placeholder=""
										min="0"
										step="0.01"
										value={form.watch("nightlyRate") || ""}
										onChange={(e) =>
											form.setValue("nightlyRate", Number(e.target.value))
										}
										readOnly
										className="bg-muted/50"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="dailySpendingCap"
						render={() => (
							<FormItem>
								<FormLabel>Daily Spending Cap</FormLabel>
								<FormControl>
									<Input
										type="number"
										min="0"
										step="0.01"
										placeholder="e.g 10000"
										{...form.register("dailySpendingCap", {
											valueAsNumber: true,
										})}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="col-span-full">
						<div className="space-y-2">
							<Label>Organization (Optional)</Label>
							<Combobox
								options={organizations.map((org: { id: string; name: string }) => ({
									label: org.name,
									value: org.id,
								}))}
								value={selectedOrgId}
								onSelect={setSelectedOrgId}
								placeholder="Select organization..."
								emptyText="No organizations found"
							/>
						</div>
					</div>

					<div className="grid gap-4 p-2 border rounded-lg bg-muted/20 col-span-full">
						<h4 className="font-medium text-sm text-muted-foreground mb-2">
							Payment & Discount
						</h4>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="discountType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Discount Type</FormLabel>
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
												<SelectItem value="FIXED">Fixed Amount</SelectItem>
												<SelectItem value="PERCENTAGE">Percentage</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="discountValue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Discount Value</FormLabel>
										<FormControl>
											<Input
												type="number"
												min="0"
												{...field}
												onChange={(e) =>
													field.onChange(Number.parseFloat(e.target.value))
												}
												className="w-full"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="includePayment"
								checked={showPayment}
								onCheckedChange={(checked) => setShowPayment(checked === true)}
							/>
							<Label htmlFor="includePayment" className="cursor-pointer">Include initial payment</Label>
						</div>

						{showPayment && (
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="initialPayment.amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Payment Amount</FormLabel>
											<FormControl>
												<Input
													type="number"
													min="0"
													{...field}
													onChange={(e) =>
														field.onChange(Number.parseFloat(e.target.value))
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="initialPayment.method"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Payment Method</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select method" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{[
														"CASH",
														"CARD",
														"CREDIT_CARD",
														"DEBIT_CARD",
														"BANK_TRANSFER",
														"MOBILE_MONEY",
														"CHEQUE",
														"ONLINE_PAYMENT",
														"PAYPAL",
														"CRYPTOCURRENCY",
														"DIRECT_DEBIT",
														"PETTY_CASH",
														"OTHERS",
													].map((method) => (
														<SelectItem key={method} value={method}>
															{method.replace(/_/g, " ")}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}
					</div>

					<FormField
						control={form.control}
						name="checkInDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Check-in Date</FormLabel>
								<FormControl>
									<DatePicker
										initialDate={field.value}
										onChange={field.onChange}
										placeholder="Select check-in date"
										minDate={new Date()}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="checkOutDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Check-out Date</FormLabel>
								<FormControl>
									<DatePicker
										initialDate={field.value}
										onChange={field.onChange}
										placeholder="Select check-out date"
										minDate={
											form.watch("checkInDate")
												? new Date(
													new Date(form.watch("checkInDate")).getTime() +
													24 * 60 * 60 * 1000,
												)
												: new Date()
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Booking Summary */}
				{form.watch("checkInDate") &&
					form.watch("checkOutDate") &&
					form.watch("nightlyRate") > 0 &&
					(() => {
						const nights = Math.ceil(
							(new Date(form.watch("checkOutDate")).getTime() -
								new Date(form.watch("checkInDate")).getTime()) /
							(1000 * 60 * 60 * 24),
						);
						const rate = form.watch("nightlyRate");
						const discountVal = form.watch("discountValue") || 0;
						const discountType = form.watch("discountType");
						const effectiveRate =
							discountVal > 0
								? discountType === "PERCENTAGE"
									? rate * (1 - discountVal / 100)
									: Math.max(0, rate - discountVal)
								: rate;
						const total = nights * effectiveRate;
						return (
							<div className="bg-primary-5/10 border border-primary-5/20 rounded-lg p-4 space-y-2">
								<h3 className="font-medium text-sm">
									{isCheckIn ? "Check-in Summary" : "Reservation Summary"}
								</h3>
								<div className="grid grid-cols-2 gap-2 text-sm">
									<div>
										<span className="text-muted-foreground">Duration:</span>
										<span className="ml-2 font-medium">
											{nights} night(s)
										</span>
									</div>
									<div>
										<span className="text-muted-foreground">Nightly Rate:</span>
										<span className="ml-2 font-medium">
											{formatCurrency(rate)}
										</span>
									</div>
									{discountVal > 0 && (
										<>
											<div>
												<span className="text-muted-foreground">Discount:</span>
												<span className="ml-2 font-medium text-green-600">
													{discountType === "PERCENTAGE"
														? `${discountVal}%`
														: formatCurrency(discountVal)}
												</span>
											</div>
											<div>
												<span className="text-muted-foreground">Effective Rate:</span>
												<span className="ml-2 font-medium">
													{formatCurrency(effectiveRate)}
												</span>
											</div>
										</>
									)}
									<div className="col-span-2">
										<span className="text-muted-foreground">Total Cost:</span>
										<span className="ml-2 font-medium text-lg">
											{formatCurrency(total)}
										</span>
									</div>
								</div>
							</div>
						);
					})()}

				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Notes (Optional)</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Add any special requests or notes..."
									className="resize-none"
									rows={3}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button
					type="submit"
					className="mt-4 w-full font-semibold"
					disabled={isPending}
				>
					{isPending ? (
						<>
							<Loader2Icon className="animate-spin" />
							<span>{isCheckIn ? "Processing check-in..." : "Creating reservation..."}</span>
						</>
					) : (
						isCheckIn ? "Check In Guest" : "Create Reservation"
					)}
				</Button>
			</form>
		</Form>
	);
}

const actions = [
	{
		title: "Create New Booking",
		heading: "New Booking",
		Component: CreateNewBookingForm,
		icon: PlusIcon,
		key: "create-new-booking",
		maxWidth: "max-w-2xl",
	},
	{
		title: "Report Maintenance",
		icon: PlusIcon,
		key: "report-maintenance",
	},
	{
		title: "Report Lost Items",
		icon: PlusIcon,
		Component: ReportLostItem,
		key: "report-lost-items",
		maxWidth: "max-w-lg",
	},
];



export type RoomType = RoomDetails;

export function QuickActions({
	rooms,
	roomTypes,
}: {
	rooms: Array<RoomType>;
	roomTypes: string[];
}) {
	const [open, setOpen] = useState<false | string>(false);
	const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);

	return (
		<>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
				{actions.map(
					({ icon: Icon, title, key, heading, Component, maxWidth }) => {
						return (
							<BaseModal
								key={key}
								open={open === key}
								setOpen={(open) => setOpen(open ? key : false)}
								maxWidth={maxWidth}
								trigger={
									<div className="flex flex-row items-center gap-x-2 bg-white p-2 rounded-4xl border border-primary-5/50">
										<div className="flex items-center gap-x-2 flex-1">
											<div className="size-8 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
												<Icon className="size-5 text-green-600" />
											</div>

											<p className="text-sm font-medium">{title}</p>
										</div>

										<ChevronRightIcon className="size-4 text-muted-foreground" />
									</div>
								}
							>
								<DialogTitle>{heading || title}</DialogTitle>
								<DialogDescription className="sr-only">
									{title}
								</DialogDescription>
								{Component && (
									<Component
										setOpen={(open) => setOpen(open ? key : false)}
										open={open === key}
										data={{
											rooms,
											roomTypes,
										}}
									/>
								)}
							</BaseModal>
						);
					},
				)}
			</div>
			<SuccessDialog
				open={successDialogOpen.show}
				setOpenAction={(show) =>
					setSuccessDialogOpen({ ...successDialogOpen, show })
				}
				message={successDialogOpen.message}
			/>
		</>
	);
}

function BaseModal({
	children,
	open,
	setOpen,
	trigger,
	maxWidth = "max-w-2xl",
}: PropsWithChildren<{
	trigger: ReactNode;
	open: boolean;
	setOpen: (open: boolean) => void;
	maxWidth?: string;
}>) {
	return (
		<Dialog modal open={open} onOpenChange={setOpen}>
			<DialogTrigger>{trigger}</DialogTrigger>

			<DialogContent className={`rounded-4xl ${maxWidth}`}>
				{children}
			</DialogContent>
		</Dialog>
	);
}

export function PendingMaintenanceNotifications() {
	const notifications = [
		{
			title: "Leaking Faucet in Room 101",
			description:
				"A guest reported a leaking faucet in room 101. Please send maintenance to fix it.",
			time: "2 hours ago",
		},
		{
			title: "Broken Window in Lobby",
			description:
				"The window near the reception desk is broken. It needs immediate attention.",
			time: "1 day ago",
		},
		{
			title: "Air Conditioning Issue in Room 202",
			description:
				"Guest in room 202 reported that the air conditioning is not working properly.",
			time: "3 days ago",
		},
	];

	return (
		<div className="bg-yellow-50/50 border border-yellow-500/30 rounded-2xl h-full overflow-clip">
			<div className="flex items-center justify-between p-3">
				<h2 className="text-lg font-medium">Pending Maintenance</h2>
				<span className="text-sm size-5 bg-red-500 text-white rounded-full text-center flex items-center justify-center px-2 leading-0">
					{notifications.length}
				</span>
			</div>

			<ScrollArea className="h-full max-h-[180px] px-1.5">
				<div className="space-y-1">
					{notifications.map((notification, index) => (
						<div
							key={index}
							className="bg-white p-3 rounded-xl border border-yellow-500/20"
						>
							<h3 className="font-medium">{notification.title}</h3>
							<p className="text-sm text-muted-foreground">
								{notification.description}
							</p>
							<span className="text-xs text-muted-foreground">
								{notification.time}
							</span>
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}

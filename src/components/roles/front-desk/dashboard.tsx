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
	LogInIcon,
	LogOutIcon,
	DoorOpenIcon,
	CalendarClockIcon,
	HotelIcon,
	PercentIcon,
	SearchIcon,
	CalendarIcon,
	UsersIcon,
	CreditCardIcon,
	AlertTriangleIcon,
	type LucideIcon,
} from "lucide-react";
import { STATUS_CARD_STYLES, STATUS_BADGE_STYLES } from "./room-status-styles";
import {
	useEffect,
	useState,
	type PropsWithChildren,
	type ReactNode,
} from "react";
import Link from "next/link";
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
	const totalRooms =
		stats.totalCheckIns + stats.totalAvailableRooms + stats.totalReservedRooms;
	const occupancyRate =
		totalRooms > 0
			? Math.round((stats.totalCheckIns / totalRooms) * 100)
			: 0;

	const data = [
		{
			label: "Total Check-Ins",
			value: stats.totalCheckIns,
			color: "text-green-500 bg-green-500/10",
			icon: LogInIcon,
		},
{
			label: "Available Rooms",
			value: stats.totalAvailableRooms,
			color: "text-blue-500 bg-blue-500/10",
			icon: DoorOpenIcon,
		},
		{
			label: "Reservations",
			value: stats.totalReservedRooms,
			color: "text-yellow-500 bg-yellow-500/10",
			icon: CalendarClockIcon,
		},
		{
			label: "Total Rooms",
			value: totalRooms,
			color: "text-purple-500 bg-purple-500/10",
			icon: HotelIcon,
		},
		{
			label: "Occupancy Rate",
			value: `${occupancyRate}%`,
			color: "text-teal-500 bg-teal-500/10",
			icon: PercentIcon,
		},
	];

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
			{data.map((stat) => (
				<div
					key={stat.label}
					className="bg-card border border-primary-5/10 rounded-xl px-3 py-4 flex items-center gap-x-3"
				>
					<div
						className={cn(
							"size-9 rounded-full flex items-center justify-center shrink-0",
							stat.color,
						)}
					>
						<stat.icon className="size-4" />
					</div>
					<div>
						<div className="text-xs text-muted-foreground">{stat.label}</div>
						<div className="text-lg font-semibold">{stat.value}</div>
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

			return { message: "Forgotten item reported successfully" };
		},
		onError: (e) => {
			toast.error("Something went wrong while reporting the forgotten item.", {
				description: e.message,
			});
		},
		onSuccess: async (data) => {
			toast.success(data.message || "Forgotten item reported successfully.");
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
	return <UnifiedBookingForm data={data} setOpen={setOpen} />;
}

const bookingFormSchema = z
	.object({
		bookingType: z.enum(["check-in", "reservation"], { message: "Booking type is required" }),
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
		complimentary: z.boolean().default(false),
		complimentaryReason: z.string().optional(),
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
	mode: initialMode,
	preselectedRoomId,
}: {
	data: {
		rooms: Array<RoomType>;
		roomTypes: Array<string>;
	};
	setOpen: (open: boolean) => void;
	mode?: "check-in" | "reservation" | undefined;
	preselectedRoomId?: string;
}) {
	const setShowSuccessDialog = useSetAtom(successDialogAtom);

	const [roomQuery, setRoomQuery] = useQueryStates({
		"room:type": parseAsString.withDefault(""),
	});

	const [selectedOrgId, setSelectedOrgId] = useState("");
	const [showOrganization, setShowOrganization] = useState(false);
	const [showPayment, setShowPayment] = useState(false);
	const [showDiscount, setShowDiscount] = useState(false);

	const { data: orgData } = useQuery({
		queryKey: ["front-desk", "organizations"],
		queryFn: () => getOrganizationsForCurrentUser(),
	});
	const organizations = orgData?.organizations ?? [];
	const orgHotelId = orgData?.hotelId ?? "";

	const form = useForm({
		resolver: zodResolver(bookingFormSchema),
		defaultValues: {
			bookingType: initialMode,
			title: "Mr",
			guestName: "",
			guestEmail: "",
			phoneNumber: "",
			noOfAdults: 1,
			noOfChildren: 0,
			nightlyRate: 0,
			dailySpendingCap: undefined,
			checkInDate: initialMode === "check-in" ? toLocalDateString(new Date()) : "",
			checkOutDate: initialMode === "check-in" ? toLocalDateString(new Date(Date.now() + 86400000)) : "",
			complimentary: false,
			complimentaryReason: "",
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

	const bookingType = form.watch("bookingType");
	const isCheckIn = bookingType === "check-in";
	const isComplimentary = form.watch("complimentary");

	const { isPending, mutate } = useMutation({
		mutationFn: async (formData: z.infer<typeof bookingFormSchema>) => {
			const includePayment = showPayment && formData.initialPayment.amount > 0 && !formData.complimentary;
			const payload = {
				roomId: formData.roomId,
				title: formData.title,
				guestName: formData.guestName,
				guestEmail: formData.guestEmail,
				phoneNumber: formData.phoneNumber,
				noOfAdults: formData.noOfAdults,
				noOfChildren: formData.noOfChildren,
				nightlyRate: formData.nightlyRate,
				dailySpendingCap: formData.dailySpendingCap,
				checkInDate: formData.checkInDate,
				checkOutDate: formData.checkOutDate,
				complimentary: formData.complimentary,
				complimentaryReason: formData.complimentaryReason,
				discountValue: formData.discountValue,
				discountType: formData.discountType,
				notes: formData.notes,
				initialPayment: includePayment
					? { ...formData.initialPayment, paymentDate: new Date(formData.initialPayment.paymentDate) }
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
						dailySpendingCap: Number(form.getValues("dailySpendingCap")) || 0,
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

	// Auto-select room when opened from a room card
	useEffect(() => {
		if (!preselectedRoomId) return;
		const room = data.rooms.find((r) => r.id === preselectedRoomId);
		if (room) {
			form.setValue("roomId", room.id);
			form.setValue("nightlyRate", room.roomPrice);
			setRoomQuery({ "room:type": room.roomType });
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [preselectedRoomId]);

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
				className="space-y-0 max-h-[calc(100vh-200px)] overflow-y-auto -mr-6 pr-6"
				onSubmit={form.handleSubmit((formData) => {
					mutate(formData);
				})}
			>
				<div className="space-y-6">
					{/* ── Booking Setup ── */}
					<div className="space-y-3">
						<div className="flex items-center gap-2.5">
							<span className="h-3.5 w-0.5 rounded-full bg-primary/70 shrink-0" />
							<span className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground whitespace-nowrap">Booking Setup</span>
							<div className="flex-1 h-px bg-border" />
						</div>
						<div className="grid grid-cols-2 gap-x-3 gap-y-4">
							<FormField
								control={form.control}
								name="bookingType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Booking Type <span className="text-red-500">*</span></FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												if (value === "check-in") {
													form.setValue("checkInDate", toLocalDateString(new Date()));
													form.setValue("checkOutDate", toLocalDateString(new Date(Date.now() + 86400000)));
												} else {
													form.setValue("checkInDate", "");
													form.setValue("checkOutDate", "");
												}
											}}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select booking type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="check-in">Check-In</SelectItem>
												<SelectItem value="reservation">Reservation</SelectItem>
											</SelectContent>
										</Select>
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
							<FormField
								control={form.control}
								name="roomId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Room <span className="text-red-500">*</span></FormLabel>
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
						</div>
					</div>

					{/* ── Guest Information ── */}
					<div className="space-y-3">
						<div className="flex items-center gap-2.5">
							<span className="h-3.5 w-0.5 rounded-full bg-primary/70 shrink-0" />
							<span className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground whitespace-nowrap">Guest Information</span>
							<div className="flex-1 h-px bg-border" />
						</div>
						<div className="grid grid-cols-4 gap-x-3 gap-y-4">
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Title</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Title" />
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
									<FormItem className="col-span-3">
										<FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
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
									<FormItem className="col-span-2">
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
									<FormItem className="col-span-2">
										<FormLabel>Phone Number</FormLabel>
										<FormControl>
											<Input placeholder="e.g +234 801 234 5678" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="noOfAdults"
								render={() => (
									<FormItem className="col-span-2">
										<FormLabel>Adults</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="1"
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
									<FormItem className="col-span-2">
										<FormLabel>Children</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="0"
												min="0"
												{...form.register("noOfChildren", { valueAsNumber: true })}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					{/* ── Rate & Financials ── */}
					<div className="space-y-3">
						<div className="flex items-center gap-2.5">
							<span className="h-3.5 w-0.5 rounded-full bg-primary/70 shrink-0" />
							<span className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground whitespace-nowrap">Rate & Financials</span>
							<div className="flex-1 h-px bg-border" />
						</div>
						<div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40 border border-border/60">
							<div>
								<p className="text-xs text-muted-foreground mb-0.5">Nightly Rate</p>
								<p className="text-lg font-semibold">
									{form.watch("nightlyRate")
										? formatCurrency(form.watch("nightlyRate"))
										: <span className="text-muted-foreground text-sm font-normal">Select a room above</span>}
								</p>
							</div>
							<span className="text-[10px] text-muted-foreground bg-muted/60 border border-border/50 px-2 py-1 rounded-md">Auto-set</span>
						</div>
						<div className="rounded-xl border border-border/60 overflow-hidden">
							<div className="flex items-center gap-3 px-4 py-3">
								<Checkbox
									id="isComplimentary"
										checked={isComplimentary}
										onCheckedChange={(checked) => {
											form.setValue("complimentary", checked === true);
											if (!checked) form.setValue("complimentaryReason", "");
											if (checked) {
												setShowDiscount(false);
												setShowPayment(false);
											}
										}}
									/>
									<div>
										<Label htmlFor="isComplimentary" className="cursor-pointer text-sm font-medium">Complimentary Stay</Label>
										<p className="text-xs text-muted-foreground">No accommodation charges will be posted</p>
									</div>
								</div>
								{isComplimentary && (
									<div className="px-4 pb-4 pt-3 border-t border-border/50">
										<FormField
											control={form.control}
											name="complimentaryReason"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Reason <span className="text-muted-foreground font-normal text-xs">(Optional)</span></FormLabel>
													<FormControl>
														<Textarea
															placeholder="e.g. VIP guest, management request, staff accommodation..."
															className="resize-none"
															rows={2}
															{...field}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
									</div>
								)}
							</div>
						{!isComplimentary && (<>
						<div className="rounded-xl border border-border/60 overflow-hidden">
							<div className="flex items-center gap-3 px-4 py-3">
								<Checkbox
									id="showDiscount"
									checked={showDiscount}
									onCheckedChange={(checked) => {
										setShowDiscount(checked === true);
										if (!checked) form.setValue("discountValue", 0);
									}}
								/>
								<Label htmlFor="showDiscount" className="cursor-pointer text-sm font-medium">Apply Discount</Label>
							</div>
							{showDiscount && (
								<div className="px-4 pb-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="discountType"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Discount Type</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
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
														onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
														className="w-full"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}
						</div>
						<div className="rounded-xl border border-border/60 overflow-hidden">
							<div className="flex items-center gap-3 px-4 py-3">
								<Checkbox
									id="includePayment"
									checked={showPayment}
									onCheckedChange={(checked) => setShowPayment(checked === true)}
								/>
								<Label htmlFor="includePayment" className="cursor-pointer text-sm font-medium">Include Initial Payment</Label>
							</div>
							{showPayment && (
								<div className="px-4 pb-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="initialPayment.amount"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Amount</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														{...field}
														onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
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
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select method" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{[
															"CASH", "CARD", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER",
															"MOBILE_MONEY", "CHEQUE", "ONLINE_PAYMENT", "PAYPAL",
															"CRYPTOCURRENCY", "DIRECT_DEBIT", "PETTY_CASH", "OTHERS",
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
					</>)}
					</div>

					{/* ── Booking Summary ── */}
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
								<div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
									<div className="flex items-center justify-between">
										<h3 className="text-sm font-semibold">
											{isCheckIn ? "Check-in Summary" : "Reservation Summary"}
										</h3>
										<div className="flex items-center gap-2">
											{isComplimentary && (
												<span className="text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2.5 py-1 rounded-full">
													COMP
												</span>
											)}
											<span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
												{nights} {nights === 1 ? "night" : "nights"}
											</span>
										</div>
									</div>
									<div className="space-y-1.5 text-sm">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Rate / night</span>
											<span className="font-medium">{formatCurrency(rate)}</span>
										</div>
										{!isComplimentary && discountVal > 0 && (
											<div className="flex items-center justify-between text-green-600 dark:text-green-500">
												<span>
													Discount{" "}
													{discountType === "PERCENTAGE"
														? `(${discountVal}%)`
														: "(fixed)"}
												</span>
												<span>
													− {discountType === "PERCENTAGE"
														? formatCurrency(rate * discountVal / 100)
														: formatCurrency(discountVal)}
												</span>
											</div>
										)}
										<div className="h-px bg-border/60 my-1" />
										<div className="flex items-center justify-between font-semibold text-base">
											<span>Total</span>
											{isComplimentary
												? <span className="text-purple-600 dark:text-purple-400">No Charge</span>
												: <span>{formatCurrency(total)}</span>
											}
										</div>
									</div>
								</div>
							);
						})()
					}

					{/* ── Additional ── */}
					<div className="space-y-3">
						<div className="flex items-center gap-2.5">
							<span className="h-3.5 w-0.5 rounded-full bg-primary/70 shrink-0" />
							<span className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground whitespace-nowrap">Additional</span>
							<div className="flex-1 h-px bg-border" />
						</div>
						<div className="space-y-3">
							<div className="rounded-xl border border-border/60 overflow-hidden">
								<div className="flex items-center gap-3 px-4 py-3">
									<Checkbox
										id="linkOrganization"
										checked={showOrganization}
										onCheckedChange={(checked) => {
											setShowOrganization(checked === true);
											if (!checked) {
												setSelectedOrgId("");
												form.setValue("dailySpendingCap", 0);
											}
										}}
									/>
									<Label htmlFor="linkOrganization" className="cursor-pointer text-sm font-medium">Link to Organization</Label>
								</div>
								{showOrganization && (
									<div className="px-4 pb-4 pt-3 border-t border-border/50 space-y-3">
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
										<FormField
											control={form.control}
											name="dailySpendingCap"
											render={() => (
												<FormItem>
													<FormLabel>Daily Spending Cap <span className="text-muted-foreground font-normal text-xs">(Optional)</span></FormLabel>
													<FormControl>
														<Input
															type="number"
															min="0"
															step="0.01"
															placeholder="e.g 10000"
															{...form.register("dailySpendingCap", { valueAsNumber: true })}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								)}
							</div>
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes <span className="text-muted-foreground font-normal text-xs">(Optional)</span></FormLabel>
										<FormControl>
											<Textarea
												placeholder="Special requests, preferences, or notes..."
												className="resize-none"
												rows={3}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				</div>
				<Button
					type="submit"
					className="mt-4 w-full h-11 font-semibold text-sm"
					disabled={isPending}
				>
					{isPending ? (
						<>
							<Loader2Icon className="size-4 animate-spin" />
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

type ModalAction = {
	type: "modal";
	title: string;
	heading?: string;
	Component: React.ComponentType<{
		setOpen: (open: boolean) => void;
		open: boolean;
		data: { rooms: Array<RoomType>; roomTypes: string[] };
	}>;
	icon: LucideIcon;
	style: string;
	key: string;
	maxWidth?: string;
};

type LinkAction = {
	type: "link";
	title: string;
	href: string;
	icon: LucideIcon;
	style: string;
	key: string;
};

type QuickAction = ModalAction | LinkAction;

const actions: QuickAction[] = [
	{
		type: "modal",
		title: "New Booking",
		heading: "New Booking",
		Component: CreateNewBookingForm,
		icon: PlusIcon,
		style: "border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100/80",
		key: "create-new-booking",
		maxWidth: "max-w-2xl",
	},
	{
		type: "link",
		title: "Reservations",
		href: "/dashboard/bookings",
		icon: CalendarIcon,
		style: "border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100/80",
		key: "view-bookings",
	},
	{
		type: "link",
		title: "Rooms",
		href: "/dashboard/rooms",
		icon: BedIcon,
		style: "border-violet-200 bg-violet-50/60 text-violet-700 hover:bg-violet-100/80",
		key: "manage-rooms",
	},
	{
		type: "link",
		title: "Guests",
		href: "/dashboard/guests",
		icon: UsersIcon,
		style: "border-amber-200 bg-amber-50/60 text-amber-700 hover:bg-amber-100/80",
		key: "view-guests",
	},
	{
		type: "link",
		title: "Payments",
		href: "/dashboard/payments",
		icon: CreditCardIcon,
		style: "border-teal-200 bg-teal-50/60 text-teal-700 hover:bg-teal-100/80",
		key: "payments",
	},
	{
		type: "modal",
		title: "Forgotten Item",
		Component: ReportLostItem,
		icon: SearchIcon,
		style: "border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100/80",
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
			<div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
				{actions.map((action) => {
					const Icon = action.icon;
					const button = (
						<div className={cn(
							"flex items-center justify-center gap-x-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer",
							action.style,
						)}>
							<Icon className="size-3.5 shrink-0" />
							<span>{action.title}</span>
						</div>
					);

					if (action.type === "link") {
						return (
							<Link key={action.key} href={action.href}>
								{button}
							</Link>
						);
					}

					return (
						<BaseModal
							key={action.key}
							open={open === action.key}
							setOpen={(o) => setOpen(o ? action.key : false)}
							maxWidth={action.maxWidth}
							trigger={button}
						>
							<DialogTitle>{action.heading || action.title}</DialogTitle>
							<DialogDescription className="sr-only">
								{action.title}
							</DialogDescription>
							<action.Component
								setOpen={(o) => setOpen(o ? action.key : false)}
								open={open === action.key}
								data={{ rooms, roomTypes }}
							/>
						</BaseModal>
					);
				})}
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

			<DialogContent className={`rounded-2xl ${maxWidth}`}>
				{children}
			</DialogContent>
		</Dialog>
	);
}

const DASHBOARD_STATUS_TABS = [
	{ label: "All", value: "ALL" },
	{ label: "Occupied", value: "CHECKED_IN" },
	{ label: "Reserved", value: "RESERVED" },
	{ label: "Available", value: "AVAILABLE" },
	{ label: "Attention", value: "ATTENTION" },
];

const STATUS_SORT_ORDER: Record<string, number> = {
	CHECKED_IN: 0, BOOKED: 0, RESERVED: 1, DIRTY: 2, BLOCKED: 3, AVAILABLE: 4, CHECKED_OUT: 5,
};

function MiniRoomCard({ room, dimmed }: { room: RoomDetails; dimmed?: boolean }) {
	const style = STATUS_CARD_STYLES[room.checkInStatus] ?? STATUS_CARD_STYLES.AVAILABLE;
	const badgeStyle = STATUS_BADGE_STYLES[room.checkInStatus] ?? STATUS_BADGE_STYLES.AVAILABLE;
	const guest = room.guestDetails;
	const hasGuest = !!guest?.guestName && room.checkInStatus !== "AVAILABLE";

	return (
		<div className={cn(
			"rounded-lg border bg-card overflow-hidden transition-all duration-200",
			style.border,
			dimmed ? "opacity-25 scale-[0.98]" : "hover:shadow-sm",
		)}>
			<div className={`${style.headerBg} px-3 py-2 flex items-center justify-between`}>
				<div className="flex items-center gap-1.5">
					<span className={`h-1.5 w-1.5 rounded-full ${style.dot} shrink-0`} />
					<span className="font-bold text-sm text-foreground">{room.roomIdentifier}</span>
				</div>
				<span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${badgeStyle}`}>
					{room.checkInStatus.replace(/_/g, " ").toLowerCase()}
				</span>
			</div>
			<div className="px-3 py-2 space-y-1.5">
				<div className="text-[11px] text-muted-foreground font-medium">{room.roomType}</div>
				{hasGuest ? (
					<div>
						<div className="text-xs font-semibold text-foreground truncate">{guest!.guestName}</div>
						{guest!.organizationName && (
							<div className="text-[10px] text-muted-foreground truncate">{guest!.organizationName}</div>
						)}
					</div>
				) : (
					<div className="text-[11px] text-muted-foreground/50 italic">No guest</div>
				)}
			</div>
		</div>
	);
}

export function DashboardRoomsSection({
	rooms,
	totalElements,
}: {
	rooms: RoomDetails[];
	totalElements: number;
}) {
	const [statusFilter, setStatusFilter] = useState("ALL");

	const sorted = [...rooms].sort(
		(a, b) => (STATUS_SORT_ORDER[a.checkInStatus] ?? 5) - (STATUS_SORT_ORDER[b.checkInStatus] ?? 5),
	);

	const needsAttention = rooms.filter((r) => ["DIRTY", "BLOCKED"].includes(r.checkInStatus));
	const checkedIn = rooms.filter((r) => r.checkInStatus === "CHECKED_IN" || r.checkInStatus === "BOOKED");
	const reserved = rooms.filter((r) => r.checkInStatus === "RESERVED");

	const isMatch = (room: RoomDetails) => {
		if (statusFilter === "ALL") return true;
		if (statusFilter === "ATTENTION") return ["DIRTY", "BLOCKED"].includes(room.checkInStatus);
		return room.checkInStatus === statusFilter;
	};

	return (
		<div className="grid grid-cols-12 gap-4">
			{/* Left: mini rooms grid — always full, tabs dim non-matching */}
			<div className="col-span-12 lg:col-span-8 space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rooms Overview</h2>
					<Link href="/dashboard/rooms" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
						View all {totalElements} rooms <ChevronRightIcon className="h-3 w-3" />
					</Link>
				</div>

				{/* Status highlight tabs */}
				<div className="flex items-center gap-1.5 flex-wrap">
					{DASHBOARD_STATUS_TABS.map((tab) => {
						const count =
							tab.value === "CHECKED_IN" ? checkedIn.length
							: tab.value === "RESERVED" ? reserved.length
							: tab.value === "ATTENTION" ? needsAttention.length
							: null;
						return (
							<button
								key={tab.value}
								type="button"
								onClick={() => setStatusFilter(tab.value)}
								className={cn(
									"text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
									statusFilter === tab.value
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/70",
								)}
							>
								{tab.label}
								{count != null && count > 0 && (
									<span className="ml-1 opacity-75">({count})</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Mini grid — always renders all rooms, tabs just dim non-matches */}
				<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
					{sorted.map((room) => (
						<MiniRoomCard key={room.id} room={room} dimmed={!isMatch(room)} />
					))}
				</div>

				{totalElements > rooms.length && (
					<Link
						href="/dashboard/rooms"
						className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1 py-1"
					>
						+{totalElements - rooms.length} more rooms · View all <ChevronRightIcon className="h-3 w-3" />
					</Link>
				)}
			</div>

			{/* Right: activity panel — sticky so it stays visible while rooms grid scrolls */}
			<div className="col-span-12 lg:col-span-4 space-y-3 lg:sticky lg:top-4 lg:self-start">
				{/* Checked-in guests */}
				<div className="rounded-lg border bg-card p-3 space-y-2">
					<div className="flex items-center justify-between">
						<h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
							<LogInIcon className="h-3 w-3" /> Checked In
						</h3>
						<span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{checkedIn.length}</span>
					</div>
					{checkedIn.length === 0 ? (
						<p className="text-[11px] text-muted-foreground/50 italic py-2 text-center">No guests checked in</p>
					) : (
						<div className="space-y-2 max-h-44 overflow-y-auto">
							{checkedIn.map((room) => (
								<div key={room.id} className="flex items-center justify-between gap-2">
									<div className="min-w-0">
										<div className="text-xs font-semibold truncate">{room.guestDetails?.guestName ?? "—"}</div>
										{room.guestDetails?.organizationName && (
											<div className="text-[10px] text-muted-foreground truncate">{room.guestDetails.organizationName}</div>
										)}
									</div>
									<span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded shrink-0">
										{room.roomIdentifier}
									</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Reservations */}
				<div className="rounded-lg border bg-card p-3 space-y-2">
					<div className="flex items-center justify-between">
						<h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
							<CalendarClockIcon className="h-3 w-3" /> Reservations
						</h3>
						<span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">{reserved.length}</span>
					</div>
					{reserved.length === 0 ? (
						<p className="text-[11px] text-muted-foreground/50 italic py-2 text-center">No reservations</p>
					) : (
						<div className="space-y-2 max-h-32 overflow-y-auto">
							{reserved.map((room) => (
								<div key={room.id} className="flex items-center justify-between gap-2">
									<div className="text-xs font-semibold truncate">{room.guestDetails?.guestName ?? "—"}</div>
									<span className="text-[10px] font-mono bg-yellow-50 text-yellow-700 border border-yellow-100 px-1.5 py-0.5 rounded shrink-0">
										{room.roomIdentifier}
									</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Needs attention */}
				{needsAttention.length > 0 && (
					<div className="rounded-lg border border-orange-200 bg-orange-50/60 p-3 space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
								<AlertTriangleIcon className="h-3 w-3" /> Needs Attention
							</h3>
							<span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">{needsAttention.length}</span>
						</div>
						<div className="space-y-1.5">
							{needsAttention.map((room) => (
								<div key={room.id} className="flex items-center justify-between gap-2">
									<span className="text-[11px] text-orange-800 capitalize">{room.checkInStatus.replace(/_/g, " ").toLowerCase()}</span>
									<span className="text-[10px] font-mono bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded shrink-0">
										{room.roomIdentifier}
									</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

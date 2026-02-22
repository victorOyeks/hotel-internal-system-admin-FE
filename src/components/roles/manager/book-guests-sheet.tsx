"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/shared/date-picker";
import { Badge } from "@/components/ui/badge";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import {
	PlusIcon,
	TrashIcon,
	Loader2Icon,
	CheckCircle2Icon,
	XCircleIcon,
	UsersIcon,
} from "lucide-react";
import { makeReservation } from "@/lib/front-desk-actions";
import { getAvailableRooms } from "@/lib/front-desk-actions";
import { assignBookingToOrganization } from "@/lib/corporate-actions";
import { formatCurrency } from "@/lib/utils";
import { revalidateRoute } from "@/lib/actions";
import { ScrollArea } from "@/components/ui/scroll-area";

const guestRowSchema = z.object({
	guestName: z.string().min(1, "Required"),
	phoneNumber: z.string().optional(),
	guestEmail: z.string().email("Invalid email").optional().or(z.literal("")),
	roomId: z.string().min(1, "Select a room"),
	nightlyRate: z.number().min(0),
	dailySpendingCap: z.number().min(0),
	checkInDate: z.string().min(1, "Required"),
	checkOutDate: z.string().optional(),
});

const bulkBookingSchema = z.object({
	guests: z.array(guestRowSchema).min(1, "Add at least one guest"),
});

type BulkBookingForm = z.infer<typeof bulkBookingSchema>;

type BookingResult = {
	guestName: string;
	roomIdentifier: string;
	success: boolean;
	error?: string;
};

type SubmissionState = "idle" | "submitting" | "complete";

interface BookGuestsSheetProps {
	organizationId: string;
	organizationName: string;
	hotelId: string;
}

export function BookGuestsSheet({
	organizationId,
	organizationName,
	hotelId,
}: BookGuestsSheetProps) {
	const [open, setOpen] = useState(false);
	const [submissionState, setSubmissionState] =
		useState<SubmissionState>("idle");
	const [progress, setProgress] = useState({ current: 0, total: 0 });
	const [results, setResults] = useState<BookingResult[]>([]);
	const queryClient = useQueryClient();

	const { data: availableRooms = [] } = useQuery({
		queryKey: ["front-desks", "available-rooms"],
		queryFn: () => getAvailableRooms(),
		enabled: open,
	});

	const form = useForm<BulkBookingForm>({
		resolver: zodResolver(bulkBookingSchema),
		defaultValues: {
			guests: [
				{
					guestName: "",
					phoneNumber: "",
					guestEmail: "",
					roomId: "",
					nightlyRate: 0,
					dailySpendingCap: "" as unknown as number,
					checkInDate: "",
					checkOutDate: "",
				},
			],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "guests",
	});

	const watchedGuests = form.watch("guests");

	function getAvailableRoomOptions(currentIndex: number) {
		const selectedRoomIds = watchedGuests
			.filter((_, i) => i !== currentIndex)
			.map((g) => g.roomId)
			.filter(Boolean);

		return availableRooms
			.filter((room) => !selectedRoomIds.includes(room.roomIdentifier))
			.map((room) => ({
				label: `${room.roomIdentifier} — ${room.roomType} (${formatCurrency(room.roomPrice ?? 0)})`,
				value: room.roomIdentifier,
			}));
	}

	async function onSubmit(data: BulkBookingForm) {
		setSubmissionState("submitting");
		setProgress({ current: 0, total: data.guests.length });
		const bookingResults: BookingResult[] = [];

		for (let i = 0; i < data.guests.length; i++) {
			const guest = data.guests[i];
			setProgress({ current: i + 1, total: data.guests.length });

			const room = availableRooms.find((r) => r.roomIdentifier === guest.roomId);
			const roomLabel = guest.roomId ?? "Unknown";

			try {
				const reservationResult = await makeReservation({
					roomId: guest.roomId,
					guestName: guest.guestName,
					phoneNumber: guest.phoneNumber || undefined,
					guestEmail: guest.guestEmail || undefined,
					nightlyRate: guest.nightlyRate,
					dailySpendingCap: guest.dailySpendingCap,
					checkInDate: guest.checkInDate,
					checkOutDate: guest.checkOutDate || undefined,
					notes: `Corporate booking for ${organizationName}`,
				});

				if (!reservationResult.success) {
					bookingResults.push({
						guestName: guest.guestName,
						roomIdentifier: roomLabel,
						success: false,
						error: reservationResult.error,
					});
					continue;
				}

				const bookingId = reservationResult.data.data?.bookingId;
				if (bookingId) {
					const assignResult = await assignBookingToOrganization({
						hotelId,
						bookingId,
						organizationId,
						dailySpendingCap: guest.dailySpendingCap,
					});

					if (!assignResult.success) {
						bookingResults.push({
							guestName: guest.guestName,
							roomIdentifier: roomLabel,
							success: false,
							error: "Reserved but org assignment failed",
						});
						continue;
					}
				}

				bookingResults.push({
					guestName: guest.guestName,
					roomIdentifier: roomLabel,
					success: true,
				});
			} catch {
				bookingResults.push({
					guestName: guest.guestName,
					roomIdentifier: roomLabel,
					success: false,
					error: "Unexpected error occurred",
				});
			}
		}

		setResults(bookingResults);
		setSubmissionState("complete");

		queryClient.invalidateQueries({
			queryKey: ["organization-guests"],
		});
		revalidateRoute("/front-desk");
	}

	function handleClose() {
		setOpen(false);
		setTimeout(() => {
			setSubmissionState("idle");
			setResults([]);
			setProgress({ current: 0, total: 0 });
			form.reset();
		}, 300);
	}

	const successCount = results.filter((r) => r.success).length;
	const failCount = results.filter((r) => !r.success).length;

	return (
		<Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
			<Button
				variant="default"
				size="sm"
				className="gap-2"
				onClick={() => setOpen(true)}
			>
				<UsersIcon className="size-4" />
				Book Guests
			</Button>

			<DialogContent className="min-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
				<DialogHeader className="px-6 pt-6 pb-0">
					<DialogTitle className="text-lg">
						Book Guests for {organizationName}
					</DialogTitle>
					<DialogDescription>
						Add multiple guests and create reservations assigned to this
						organization.
					</DialogDescription>
				</DialogHeader>

				{submissionState === "idle" && (
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex flex-col flex-1 min-h-0 overflow-hidden"
						>
							<div className="px-6 py-3 flex items-center justify-between border-b">
								<span className="text-sm text-muted-foreground">
									{fields.length} guest{fields.length !== 1 && "s"} added
								</span>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="gap-1.5"
									onClick={() =>
										append({
											guestName: "",
											phoneNumber: "",
											guestEmail: "",
											roomId: "",
											nightlyRate: 0,
											dailySpendingCap: "" as unknown as number,
											checkInDate: "",
											checkOutDate: "",
										})
									}
								>
									<PlusIcon className="size-3.5" />
									Add Guest
								</Button>
							</div>

							<div className="flex-1 overflow-y-auto min-h-0">
								<div className="px-6 py-4 space-y-4">
									{fields.map((field, index) => (
										<div
											key={field.id}
											className="border rounded-xl p-4 space-y-3 bg-muted/30 relative"
										>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium text-muted-foreground">
													Guest {index + 1}
												</span>
												{fields.length > 1 && (
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="h-8 px-2 text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50"
														onClick={() => remove(index)}
													>
														<TrashIcon className="size-4 mr-1" />
														Remove
													</Button>
												)}
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
												<FormField
													control={form.control}
													name={`guests.${index}.guestName`}
													render={({ field }) => (
														<FormItem>
															<FormControl>
																<Input
																	placeholder="Guest name"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`guests.${index}.phoneNumber`}
													render={({ field }) => (
														<FormItem>
															<FormControl>
																<Input
																	placeholder="Phone number (optional)"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`guests.${index}.guestEmail`}
													render={({ field }) => (
														<FormItem>
															<FormControl>
																<Input
																	type="email"
																	placeholder="Email (optional)"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
												<FormField
													control={form.control}
													name={`guests.${index}.roomId`}
													render={({ field }) => (
														<FormItem>
															<FormControl>
																<Combobox
																	options={getAvailableRoomOptions(index)}
																	value={field.value}
																	onSelect={(value) => {
																		field.onChange(value);
																		const room = availableRooms.find(
																			(r) => r.roomIdentifier === value,
																		);
																		if (room) {
																			form.setValue(
																				`guests.${index}.nightlyRate`,
																				room.roomPrice,
																			);
																		}
																	}}
																	placeholder="Select room..."
																	emptyText="No rooms available"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<div className="flex items-center gap-2">
													<div className="flex-1">
														<FormField
															control={form.control}
															name={`guests.${index}.dailySpendingCap`}
															render={() => (
																<FormItem>
																	<FormControl>
																		<Input
																			type="number"
																			step="0.01"
																			min="0"
																			placeholder="Spending cap"
																			{...form.register(
																				`guests.${index}.dailySpendingCap`,
																				{ valueAsNumber: true },
																			)}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</div>
													{watchedGuests[index]?.nightlyRate > 0 && (
														<Badge variant="outline" className="text-xs whitespace-nowrap shrink-0">
															{formatCurrency(watchedGuests[index].nightlyRate)}/night
														</Badge>
													)}
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
												<FormField
													control={form.control}
													name={`guests.${index}.checkInDate`}
													render={({ field }) => (
														<FormItem>
															<FormControl>
																<DatePicker
																	initialDate={field.value}
																	onChange={field.onChange}
																	placeholder="Check-in date"
																	minDate={new Date()}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`guests.${index}.checkOutDate`}
													render={({ field }) => (
														<FormItem>
															<FormControl>
																<DatePicker
																	initialDate={field.value}
																	onChange={field.onChange}
																	placeholder="Expected checkout (optional)"
																	minDate={
																		watchedGuests[index]?.checkInDate
																			? new Date(
																					new Date(
																						watchedGuests[index].checkInDate,
																					).getTime() +
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
										</div>
									))}
								</div>
							</div>

							<div className="px-6 py-4 border-t mt-auto">
								<Button
									type="submit"
									className="w-full font-semibold"
									disabled={fields.length === 0}
								>
									Book {fields.length} Guest{fields.length !== 1 && "s"}
								</Button>
							</div>
						</form>
					</Form>
				)}

				{submissionState === "submitting" && (
					<div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-12">
						<div className="relative">
							<Loader2Icon className="size-12 animate-spin text-primary" />
						</div>
						<div className="text-center space-y-2">
							<p className="text-lg font-semibold">
								Booking guest {progress.current} of {progress.total}...
							</p>
							<p className="text-sm text-muted-foreground">
								Creating reservations and assigning to {organizationName}
							</p>
						</div>
						<div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
							<div
								className="bg-primary h-full rounded-full transition-all duration-300"
								style={{
									width: `${(progress.current / progress.total) * 100}%`,
								}}
							/>
						</div>
					</div>
				)}

				{submissionState === "complete" && (
					<div className="flex-1 flex flex-col min-h-0">
						<div className="px-6 py-4 border-b">
							<div className="flex items-center gap-3">
								{failCount === 0 ? (
									<div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
										<CheckCircle2Icon className="size-5 text-green-600" />
									</div>
								) : (
									<div className="size-10 rounded-full bg-yellow-100 flex items-center justify-center">
										<XCircleIcon className="size-5 text-yellow-600" />
									</div>
								)}
								<div>
									<p className="font-semibold">
										{failCount === 0
											? "All guests booked successfully!"
											: `${successCount} of ${results.length} guests booked`}
									</p>
									<p className="text-sm text-muted-foreground">
										{failCount > 0 &&
											`${failCount} booking${failCount !== 1 ? "s" : ""} failed`}
									</p>
								</div>
							</div>
						</div>

						<ScrollArea className="flex-1">
							<div className="px-6 py-4">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Guest</TableHead>
											<TableHead>Room</TableHead>
											<TableHead className="text-right">Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{results.map((result, i) => (
											<TableRow key={i}>
												<TableCell className="font-medium">
													{result.guestName}
												</TableCell>
												<TableCell>{result.roomIdentifier}</TableCell>
												<TableCell className="text-right">
													{result.success ? (
														<Badge variant="green" className="gap-1">
															<CheckCircle2Icon className="size-3" />
															Booked
														</Badge>
													) : (
														<Badge variant="red" className="gap-1">
															<XCircleIcon className="size-3" />
															Failed
														</Badge>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>

								{results.some((r) => !r.success) && (
									<div className="mt-4 space-y-2">
										<p className="text-sm font-medium text-destructive">
											Errors:
										</p>
										{results
											.filter((r) => !r.success)
											.map((r, i) => (
												<p
													key={i}
													className="text-sm text-muted-foreground"
												>
													<span className="font-medium">{r.guestName}:</span>{" "}
													{r.error}
												</p>
											))}
									</div>
								)}
							</div>
						</ScrollArea>

						<div className="px-6 py-4 border-t mt-auto">
							<Button
								className="w-full font-semibold"
								onClick={handleClose}
							>
								Done
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

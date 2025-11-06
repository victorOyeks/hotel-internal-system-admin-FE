"use client";

import { cn } from "@/lib/utils";
import {
  DialogTitle,
  DialogDescription,
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import { BedIcon, ChevronRightIcon, Loader2Icon, PlusIcon } from "lucide-react";
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
import { parseAsString, useQueryStates } from "nuqs";
import type * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  checkInGuest,
  makeReservation,
  reportLostItem,
} from "@/lib/front-desk-actions";
import { toast } from "sonner";
import { revalidateRoute, uploadImage } from "@/lib/actions";
import type { APIOutput } from "@/lib/action-utils";
import { SuccessDialog } from "@/components/shared/shared-dialogs";
import { atom, useAtom, useSetAtom } from "jotai";
import { DatePicker } from "@/components/shared/date-picker";
import { formatDate } from "date-fns";

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
              stat.color
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
                        "MMMM d, yyyy"
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
    rooms: Array<string>;
    roomTypes: Array<string>;
  };
}) {
  const [view, setView] = useState<"check-in" | "reservation">("check-in");
  return (
    <div className="space-y-4">
      <div className="border-b border-primary-5/20 max-w-[content]">
        <Button
          variant={view === "check-in" ? "secondary" : "ghost"}
          className="rounded-none"
          onClick={() => setView("check-in")}
        >
          Check-In
        </Button>
        <Button
          variant={view === "reservation" ? "secondary" : "ghost"}
          className="rounded-none"
          onClick={() => setView("reservation")}
        >
          Reservation
        </Button>
      </div>

      {view === "check-in" ? (
        <CheckInForm data={data} setOpen={setOpen} />
      ) : (
        <ReservationForm data={data} setOpen={setOpen} />
      )}
    </div>
  );
}

const checkInFormSchema = z.object({
  guestName: z.string().nonempty("Guest name is required"),
  phoneNumber: z.string().nonempty("Phone number is required"),
  noOfAdults: z.number().int().positive("Number of adults must be at least 1"),
  noOfChildren: z.number().int().nonnegative("Number of children cannot be negative"),
  nightlyRate: z.number().positive("Nightly rate must be greater than 0"),
  dailySpendingCap: z.number().nonnegative("Daily spending cap must be 0 or greater"),
  amountPaid: z
    .number()
    .nonnegative("You cannot pay a negative amount")
    .min(0, "Please enter a valid amount"),
  roomStatus: z.enum(["CHECKED_IN"]),
  checkInDate: z.string().nonempty("Check-in date is required"),
});

const reservationFormSchema = z
  .object({
    guestName: z.string().nonempty("Guest name is required"),
    phoneNumber: z.string().nonempty("Phone number is required"),
    nightlyRate: z.number().positive("Nightly rate must be greater than 0"),
    dailySpendingCap: z.number().nonnegative("Daily spending cap must be 0 or greater"),
    checkInDate: z.string().nonempty("Check-in date is required"),
    checkOutDate: z.string().nonempty("Check-out date is required"),
    roomId: z.string().nonempty("Room is required"),
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
    }
  );

const lostItemFormSchema = z.object({
  itemName: z.string().nonempty("Item name is required"),
  description: z.string().nonempty("Description is required"),
  imageUrl: z.url("Please enter a valid URL").optional().or(z.literal("")),
  location: z.string().nonempty("Location is required for the lost item"),
  dateFound: z.string().nonempty("Date found is required"),
});

function SelectRoomBox({
  setValue,
  rooms,
}: {
  setValue: (value: string) => void;
  rooms: Array<string>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Select
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
      onValueChange={(value) => setValue(value)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a room" />
      </SelectTrigger>
      <SelectContent className="w-full">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <SelectItem key={room} value={room}>
              {room}
            </SelectItem>
          ))
        ) : (
          <SelectItem disabled value="__EMPTY__ ">
            No rooms available
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

export function CheckInForm({
  data,
  setOpen,
}: {
  data: {
    rooms: Array<string>;
    roomTypes: Array<string>;
  };
  setOpen: (open: boolean) => void;
}) {
  const setShowSuccessDialog = useSetAtom(successDialogAtom);

  const [roomQuery, setRoomQuery] = useQueryStates({
    "room:type": parseAsString.withDefault(""),
  });

  const [selectedRoomId, setSelectedRoomId] = useState("");

  const form = useForm({
    resolver: zodResolver(checkInFormSchema),
    defaultValues: {
      guestName: "",
      phoneNumber: "",
      noOfAdults: 1,
      noOfChildren: 0,
      nightlyRate: 0,
      dailySpendingCap: 0,
      amountPaid: 0,
      roomStatus: "CHECKED_IN" as "CHECKED_IN",
      checkInDate: new Date().toISOString().split("T")[0],
    },
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async (
      data: z.infer<typeof checkInFormSchema> & {
        roomId: string;
      }
    ) => {
      const { roomId, ...restData } = data;
      const response = await checkInGuest({
        roomId,
        ...restData,
      });

      if (!response.success) {
        throw new Error(response.error || "An error occurred");
      }

      return response.data;
    },
    onError: (error) => {
      toast.error(error.message || "An error occurred during check-in.");
    },
    onSuccess: (data) => {
      toast.success(data.message || "Guest checked in successfully.");
      setShowSuccessDialog({
        show: true,
        message: "Guest checked in successfully.",
      });
      form.reset();
      setOpen(false);
      revalidateRoute("/front-desk");
    },
  });

  // use effect to clean queries on unmount
  // biome-ignore lint/correctness/useExhaustiveDependencies: false
  useEffect(() => {
    return () => {
      setRoomQuery({
        "room:type": "",
      });
    };
  }, []);

  return (
    <Form {...form}>
      <form
        className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-hidden"
        onSubmit={form.handleSubmit((data) => {
          if (!selectedRoomId) {
            toast.error("Please select a room");
            return;
          }
          mutate({ ...data, roomId: selectedRoomId });
        })}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-2">
          <FormField
            control={form.control}
            name="guestName"
            render={({ field }) => (
              <FormItem className="col-span-2">
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
            <Select
              value={roomQuery["room:type"]}
              onValueChange={(value) => setRoomQuery({ "room:type": value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="e.g Deluxe, Standard" />
              </SelectTrigger>
              <SelectContent className="w-full p-0">
                {data.roomTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Room</Label>
            <SelectRoomBox setValue={setSelectedRoomId} rooms={data.rooms} />
            {!selectedRoomId && (
              <p className="text-sm text-destructive">Room is required</p>
            )}
          </div>

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
                    placeholder="e.g 5000"
                    min="0"
                    step="0.01"
                    {...form.register("nightlyRate", { valueAsNumber: true })}
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
                    placeholder="e.g 10000"
                    min="0"
                    step="0.01"
                    {...form.register("dailySpendingCap", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amountPaid"
            render={() => (
              <FormItem>
                <FormLabel>Amount Paid</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g 100"
                    {...form.register("amountPaid", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    minDate={new Date(Date.now() - 24 * 60 * 60 * 1000)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          className="mt-4 w-full font-semibold"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              <span>Processing check-in...</span>
            </>
          ) : (
            "Check In Guest"
          )}
        </Button>
      </form>
    </Form>
  );
}

export function ReservationForm({
  data,
  setOpen,
}: {
  data: {
    rooms: Array<string>;
    roomTypes: Array<string>;
  };
  setOpen: (open: boolean) => void;
}) {
  const [roomQuery, setRoomQuery] = useQueryStates({
    "room:type": parseAsString.withDefault(""),
  });

  const form = useForm({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      guestName: "",
      phoneNumber: "",
      nightlyRate: 0,
      dailySpendingCap: 0,
      checkInDate: "",
      checkOutDate: "",
      roomId: "",
      notes: "",
    },
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: z.infer<typeof reservationFormSchema>) => {
      const response = await makeReservation(data);
      if (!response.success) {
        throw new Error(response.error || "An error occurred");
      }
      return response.data;
    },
    onError: (e) => {
      toast.error("An error occurred while creating the reservation.", {
        description: e.message,
      });
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Reservation created successfully.");
      form.reset();
      setOpen(false);
      await revalidateRoute("/front-desk");
    },
  });

  // use effect to clean queries on unmount
  // biome-ignore lint/correctness/useExhaustiveDependencies: false
  useEffect(() => {
    return () => {
      setRoomQuery({
        "room:type": "",
      });
    };
  }, []);

  return (
    <Form {...form}>
      <form
        className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-hidden"
        onSubmit={form.handleSubmit((data) => {
          mutate(data);
        })}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-2">
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

          <FormField
            control={form.control}
            name="nightlyRate"
            render={() => (
              <FormItem>
                <FormLabel>Nightly Rate</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g 25000"
                    {...form.register("nightlyRate", { valueAsNumber: true })}
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
                    step="0.01"
                    placeholder="e.g 10000"
                    {...form.register("dailySpendingCap", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                              24 * 60 * 60 * 1000
                          )
                        : new Date()
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-2">
            <Label>Room Type</Label>
            <Select
              value={roomQuery["room:type"]}
              onValueChange={(value) => setRoomQuery({ "room:type": value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="e.g Deluxe, Standard" />
              </SelectTrigger>
              <SelectContent className="w-full p-0">
                {data.roomTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FormField
            control={form.control}
            name="roomId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room</FormLabel>
                <FormControl>
                  <SelectRoomBox setValue={field.onChange} rooms={data.rooms} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Reservation Summary */}
        {form.watch("checkInDate") && form.watch("checkOutDate") && form.watch("nightlyRate") > 0 && (
          <div className="bg-primary-5/10 border border-primary-5/20 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-sm">Reservation Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 font-medium">
                  {Math.ceil(
                    (new Date(form.watch("checkOutDate")).getTime() -
                      new Date(form.watch("checkInDate")).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  night(s)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Nightly Rate:</span>
                <span className="ml-2 font-medium">
                  ₦{form.watch("nightlyRate").toLocaleString()}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="ml-2 font-medium text-lg">
                  ₦{(
                    Math.ceil(
                      (new Date(form.watch("checkOutDate")).getTime() -
                        new Date(form.watch("checkInDate")).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) * form.watch("nightlyRate")
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any special requests or notes about the reservation..."
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
              <span>Creating reservation...</span>
            </>
          ) : (
            "Create Reservation"
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

export function QuickActions({
  rooms,
  roomTypes,
}: {
  rooms: string[];
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
          }
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
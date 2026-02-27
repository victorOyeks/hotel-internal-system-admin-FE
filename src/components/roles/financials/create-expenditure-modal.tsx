"use client";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Combobox } from "@/components/ui/combobox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createExpenditure } from "@/lib/financials-actions";
import { Loader2 } from "lucide-react";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
    // Required
    title:         z.string().min(1, "Title is required"),
    amount:        z.coerce.number().positive("Enter a valid positive amount"),
    category:      z.string().min(1, "Category is required"),
    expenseDate:   z.string().min(1, "Expense date is required"),
    paymentMethod: z.string().min(1, "Payment method is required"),
    // Optional strings
    description:          z.string().optional(),
    dueDate:              z.string().optional(),
    vendor:               z.string().optional(),
    vendorContact:        z.string().optional(),
    vendorAddress:        z.string().optional(),
    invoiceNumber:        z.string().optional(),
    purchaseOrderNumber:  z.string().optional(),
    departmentId:         z.string().optional(),
    requestedBy:          z.string().optional(),
    taxType:              z.string().optional(),
    taxRate:              z.string().optional(),
    taxAmount:            z.string().optional(),
    recurrenceType:       z.string().optional(),
    nextOccurrence:       z.string().optional(),
    receiptUrl:           z.string().optional(),
    attachmentUrls:       z.string().optional(),
    notes:                z.string().optional(),
    accountCode:          z.string().optional(),
    costCenter:           z.string().optional(),
    budgetId:             z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
    title:                "",
    amount:               "" as unknown as number,
    category:             "",
    expenseDate:          new Date().toISOString().split("T")[0],
    paymentMethod:        "",
    description:          "",
    dueDate:              "",
    vendor:               "",
    vendorContact:        "",
    vendorAddress:        "",
    invoiceNumber:        "",
    purchaseOrderNumber:  "",
    departmentId:         "",
    requestedBy:          "",
    taxType:              "",
    taxRate:              "",
    taxAmount:            "",
    recurrenceType:       "",
    nextOccurrence:       "",
    receiptUrl:           "",
    attachmentUrls:       "",
    notes:                "",
    accountCode:          "",
    costCenter:           "",
    budgetId:             "",
};

// ── Constants ─────────────────────────────────────────────────────────────────

const EXPENDITURE_CATEGORIES = [
    { value: "ELECTRICITY",           label: "Electricity" },
    { value: "WATER",                 label: "Water" },
    { value: "GAS",                   label: "Gas" },
    { value: "INTERNET_AND_PHONE",    label: "Internet & Phone" },
    { value: "BUILDING_MAINTENANCE",  label: "Building Maintenance" },
    { value: "ROOM_MAINTENANCE",      label: "Room Maintenance" },
    { value: "HVAC_MAINTENANCE",      label: "HVAC Maintenance" },
    { value: "ELEVATOR_MAINTENANCE",  label: "Elevator Maintenance" },
    { value: "POOL_MAINTENANCE",      label: "Pool Maintenance" },
    { value: "ELECTRICAL_WORK",       label: "Electrical Work" },
    { value: "PLUMBING",              label: "Plumbing" },
    { value: "PAINTING_AND_DECORATION", label: "Painting & Decoration" },
    { value: "EQUIPMENT_REPAIR",      label: "Equipment Repair" },
    { value: "LANDSCAPING",           label: "Landscaping" },
    { value: "PEST_CONTROL",          label: "Pest Control" },
    { value: "FIRE_SAFETY",           label: "Fire Safety" },
    { value: "WASTE_MANAGEMENT",      label: "Waste Management" },
    { value: "OFFICE_SUPPLIES",       label: "Office Supplies" },
    { value: "CLEANING_SUPPLIES",     label: "Cleaning Supplies" },
    { value: "KITCHEN_SUPPLIES",      label: "Kitchen Supplies" },
    { value: "LAUNDRY_SUPPLIES",      label: "Laundry Supplies" },
    { value: "GUEST_AMENITIES",       label: "Guest Amenities" },
    { value: "FOOD_AND_BEVERAGE",     label: "Food & Beverage" },
    { value: "STAFF_MEALS",           label: "Staff Meals" },
    { value: "SALARIES_AND_WAGES",    label: "Salaries & Wages" },
    { value: "STAFF_BENEFITS",        label: "Staff Benefits" },
    { value: "STAFF_TRAINING",        label: "Staff Training" },
    { value: "STAFF_UNIFORMS",        label: "Staff Uniforms" },
    { value: "RECRUITMENT",           label: "Recruitment" },
    { value: "EMPLOYEE_INSURANCE",    label: "Employee Insurance" },
    { value: "DIGITAL_MARKETING",     label: "Digital Marketing" },
    { value: "SOCIAL_MEDIA_MARKETING", label: "Social Media Marketing" },
    { value: "PRINT_ADVERTISING",     label: "Print Advertising" },
    { value: "PROMOTIONS",            label: "Promotions" },
    { value: "PHOTOGRAPHY",           label: "Photography" },
    { value: "SOFTWARE_LICENSES",     label: "Software Licenses" },
    { value: "HARDWARE_PURCHASE",     label: "Hardware Purchase" },
    { value: "IT_SERVICES",           label: "IT Services" },
    { value: "WEBSITE_MAINTENANCE",   label: "Website Maintenance" },
    { value: "BOOKING_SYSTEM",        label: "Booking System" },
    { value: "POS_SYSTEM",            label: "POS System" },
    { value: "VEHICLE_FUEL",          label: "Vehicle Fuel" },
    { value: "VEHICLE_MAINTENANCE",   label: "Vehicle Maintenance" },
    { value: "VEHICLE_INSURANCE",     label: "Vehicle Insurance" },
    { value: "SHUTTLE_SERVICE",       label: "Shuttle Service" },
    { value: "PROPERTY_INSURANCE",    label: "Property Insurance" },
    { value: "LIABILITY_INSURANCE",   label: "Liability Insurance" },
    { value: "LEGAL_FEES",            label: "Legal Fees" },
    { value: "REGULATORY_FEES",       label: "Regulatory Fees" },
    { value: "BUSINESS_LICENSE",      label: "Business License" },
    { value: "BANK_CHARGES",          label: "Bank Charges" },
    { value: "CREDIT_CARD_FEES",      label: "Credit Card Fees" },
    { value: "LOAN_INTEREST",         label: "Loan Interest" },
    { value: "PROPERTY_TAX",          label: "Property Tax" },
    { value: "ACCOUNTING_FEES",       label: "Accounting Fees" },
    { value: "AUDIT_FEES",            label: "Audit Fees" },
    { value: "CONSULTING_FEES",       label: "Consulting Fees" },
    { value: "GUEST_ENTERTAINMENT",   label: "Guest Entertainment" },
    { value: "GUEST_TRANSPORTATION",  label: "Guest Transportation" },
    { value: "COMPLIMENTARY_SERVICES", label: "Complimentary Services" },
    { value: "DELIVERY_CHARGES",      label: "Delivery Charges" },
    { value: "SECURITY_SERVICES",     label: "Security Services" },
    { value: "SUBSCRIPTIONS",         label: "Subscriptions" },
    { value: "MEMBERSHIPS",           label: "Memberships" },
    { value: "CHARITABLE_DONATIONS",  label: "Charitable Donations" },
    { value: "CONTINGENCY",           label: "Contingency" },
    { value: "OTHERS",                label: "Others" },
];

const PAYMENT_METHODS = [
    { value: "CASH",           label: "Cash" },
    { value: "CARD",           label: "Card" },
    { value: "CREDIT_CARD",    label: "Credit Card" },
    { value: "DEBIT_CARD",     label: "Debit Card" },
    { value: "BANK_TRANSFER",  label: "Bank Transfer" },
    { value: "MOBILE_MONEY",   label: "Mobile Money" },
    { value: "CHEQUE",         label: "Cheque" },
    { value: "ONLINE_PAYMENT", label: "Online Payment" },
    { value: "PETTY_CASH",     label: "Petty Cash" },
    { value: "OTHERS",         label: "Others" },
];

const RECURRENCE_TYPES = [
    { value: "ONE_TIME",   label: "One Time" },
    { value: "DAILY",      label: "Daily" },
    { value: "WEEKLY",     label: "Weekly" },
    { value: "MONTHLY",    label: "Monthly" },
    { value: "QUARTERLY",  label: "Quarterly" },
    { value: "YEARLY",     label: "Yearly" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                {title}
            </span>
            <Separator className="flex-1" />
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CreateExpenditureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateExpenditureModal({ open, onOpenChange }: CreateExpenditureModalProps) {
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: DEFAULT_VALUES,
        mode: "onSubmit",
    });

    const recurrenceType = form.watch("recurrenceType");

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: FormValues) => {
            await createExpenditure({
                title:               data.title,
                amount:              data.amount,
                category:            data.category,
                expenseDate:         data.expenseDate,
                paymentMethod:       data.paymentMethod,
                description:         data.description      || undefined,
                dueDate:             data.dueDate           || undefined,
                vendorName:          data.vendor            || undefined,
                vendorContact:       data.vendorContact     || undefined,
                vendorAddress:       data.vendorAddress     || undefined,
                invoiceNumber:       data.invoiceNumber     || undefined,
                purchaseOrderNumber: data.purchaseOrderNumber || undefined,
                departmentId:        data.departmentId      || undefined,
                requestedBy:         data.requestedBy       || undefined,
                taxType:             data.taxType           || undefined,
                taxRate:             data.taxRate           ? parseFloat(data.taxRate)   : undefined,
                taxAmount:           data.taxAmount         ? parseFloat(data.taxAmount) : undefined,
                recurrenceType:      data.recurrenceType    || undefined,
                nextOccurrence:      data.nextOccurrence    || undefined,
                receiptUrl:          data.receiptUrl        || undefined,
                attachmentUrls:      data.attachmentUrls    || undefined,
                notes:               data.notes             || undefined,
                accountCode:         data.accountCode       || undefined,
                costCenter:          data.costCenter        || undefined,
                budgetId:            data.budgetId          || undefined,
            });
        },
        onSuccess: () => {
            toast.success("Expenditure recorded successfully");
            queryClient.invalidateQueries({ queryKey: ["financials", "expenditures"] });
            onOpenChange(false);
            form.reset();
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to record expenditure");
        },
    });

    const onSubmit = (data: FormValues) => mutate(data);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden">
                <SheetHeader className="px-6 pr-12 py-4 border-b shrink-0">
                    <SheetTitle>Record Expenditure</SheetTitle>
                    <SheetDescription>
                        Fields marked <span className="text-destructive">*</span> are required.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form
                        id="expenditure-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex-1 min-h-0 flex flex-col overflow-hidden"
                    >
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="px-6 py-5 space-y-4">

                                {/* ── Core ── */}
                                <Section title="Core Details" />

                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Monthly Electricity Bill" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Amount <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₦</span>
                                                        <Input type="number" step="0.01" className="pl-7" placeholder="0.00" {...form.register("amount", { valueAsNumber: true })} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="paymentMethod"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Payment Method <span className="text-destructive">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select method" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {PAYMENT_METHODS.map((m) => (
                                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                                            <Combobox
                                                options={EXPENDITURE_CATEGORIES}
                                                value={field.value}
                                                onSelect={field.onChange}
                                                placeholder="Search categories…"
                                                emptyText="No category found."
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Brief description of the expense"
                                                    className="resize-none min-h-[72px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* ── Schedule ── */}
                                <Section title="Schedule" />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="expenseDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expense Date <span className="text-destructive">*</span></FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dueDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Due Date</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="recurrenceType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Recurrence</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select recurrence" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {RECURRENCE_TYPES.map((r) => (
                                                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {recurrenceType && recurrenceType !== "ONE_TIME" && (
                                        <FormField
                                            control={form.control}
                                            name="nextOccurrence"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Next Occurrence</FormLabel>
                                                    <FormControl><Input type="date" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                {/* ── Vendor ── */}
                                <Section title="Vendor" />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="vendor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vendor Name</FormLabel>
                                                <FormControl><Input placeholder="e.g., Utility Co." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="vendorContact"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contact</FormLabel>
                                                <FormControl><Input placeholder="Phone or email" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="vendorAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl><Input placeholder="Street, city" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="invoiceNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Invoice No.</FormLabel>
                                                <FormControl><Input placeholder="INV-001" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="purchaseOrderNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>PO Number</FormLabel>
                                                <FormControl><Input placeholder="PO-001" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* ── Tax ── */}
                                <Section title="Tax" />

                                <div className="grid grid-cols-3 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="taxType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tax Type</FormLabel>
                                                <FormControl><Input placeholder="e.g., VAT" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="taxRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rate (%)</FormLabel>
                                                <FormControl><Input type="number" step="0.01" placeholder="7.5" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="taxAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount</FormLabel>
                                                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* ── Assignment ── */}
                                <Section title="Assignment" />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="requestedBy"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Requested By</FormLabel>
                                                <FormControl><Input placeholder="Name or ID" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="departmentId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Department ID</FormLabel>
                                                <FormControl><Input placeholder="Dept. ID" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* ── Accounting ── */}
                                <Section title="Accounting" />

                                <div className="grid grid-cols-3 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="accountCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Account Code</FormLabel>
                                                <FormControl><Input placeholder="5100" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="costCenter"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cost Center</FormLabel>
                                                <FormControl><Input placeholder="CC-01" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="budgetId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Budget ID</FormLabel>
                                                <FormControl><Input placeholder="BUD-01" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* ── Attachments & Notes ── */}
                                <Section title="Attachments & Notes" />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="receiptUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Receipt URL</FormLabel>
                                                <FormControl><Input placeholder="https://…" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="attachmentUrls"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Attachment URLs</FormLabel>
                                                <FormControl><Input placeholder="Comma-separated" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem className="pb-2">
                                            <FormLabel>Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Internal notes…"
                                                    className="resize-none min-h-[80px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                            </div>
                        </ScrollArea>
                    </form>
                </Form>

                <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" form="expenditure-form" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record Expenditure
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

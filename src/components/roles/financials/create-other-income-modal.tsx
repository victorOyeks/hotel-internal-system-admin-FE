"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createOtherIncome } from "@/lib/financials-actions";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { INCOME_CATEGORIES, CATEGORY_GROUPS } from "@/lib/income-categories";

interface CreateOtherIncomeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMPTY_FORM = {
    title: "",
    description: "",
    amount: "",
    category: "",
    paymentMethod: "",
    incomeDate: new Date().toISOString().split("T")[0],
    receivedDate: "",
    customerName: "",
    customerContact: "",
    customerAddress: "",
    invoiceNumber: "",
    receiptNumber: "",
    taxType: "",
    taxRate: "",
    taxAmount: "",
    commissionPayee: "",
    commissionRate: "",
    commissionAmount: "",
    recurrenceType: "ONE_TIME",
    nextOccurrence: "",
    departmentId: "",
    servedBy: "",
    invoiceUrl: "",
    attachmentUrls: "",
    notes: "",
    accountCode: "",
    revenueCenter: "",
};

export function CreateOtherIncomeModal({
    open,
    onOpenChange,
}: CreateOtherIncomeModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [categoryOpen, setCategoryOpen] = useState(false);

    const set = (field: keyof typeof EMPTY_FORM, value: string) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!formData.title || !formData.amount || !formData.category || !formData.paymentMethod || !formData.incomeDate) {
                throw new Error("Please fill in all required fields.");
            }
            await createOtherIncome({
                title: formData.title,
                description: formData.description || undefined,
                amount: parseFloat(formData.amount),
                category: formData.category,
                paymentMethod: formData.paymentMethod,
                incomeDate: formData.incomeDate,
                receivedDate: formData.receivedDate || undefined,
                customerName: formData.customerName || undefined,
                customerContact: formData.customerContact || undefined,
                customerAddress: formData.customerAddress || undefined,
                invoiceNumber: formData.invoiceNumber || undefined,
                receiptNumber: formData.receiptNumber || undefined,
                taxType: formData.taxType || undefined,
                taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
                taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
                commissionPayee: formData.commissionPayee || undefined,
                commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : undefined,
                commissionAmount: formData.commissionAmount ? parseFloat(formData.commissionAmount) : undefined,
                recurrenceType: formData.recurrenceType !== "ONE_TIME" ? formData.recurrenceType : undefined,
                nextOccurrence: formData.nextOccurrence || undefined,
                departmentId: formData.departmentId || undefined,
                servedBy: formData.servedBy || undefined,
                invoiceUrl: formData.invoiceUrl || undefined,
                attachmentUrls: formData.attachmentUrls || undefined,
                notes: formData.notes || undefined,
                accountCode: formData.accountCode || undefined,
                revenueCenter: formData.revenueCenter || undefined,
            });
        },
        onSuccess: () => {
            toast.success("Income record created successfully");
            queryClient.invalidateQueries({ queryKey: ["financials", "other-income"] });
            onOpenChange(false);
            setFormData(EMPTY_FORM);
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to create income record");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record Other Income</DialogTitle>
                    <DialogDescription>
                        Add a new miscellaneous income entry.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-2">

                    {/* Core Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Core Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => set("title", e.target.value)}
                                    placeholder="e.g., Vending Machine Revenue"
                                    required
                                />
                            </div>
                            <div className="col-span-2 grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="incomeDate">Income Date <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Input
                                            id="incomeDate"
                                            type="date"
                                            value={formData.incomeDate}
                                            onChange={(e) => set("incomeDate", e.target.value)}
                                            required
                                            className="pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        />
                                        <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="receivedDate">Received Date</Label>
                                    <div className="relative">
                                        <Input
                                            id="receivedDate"
                                            type="date"
                                            value={formData.receivedDate}
                                            onChange={(e) => set("receivedDate", e.target.value)}
                                            className="pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        />
                                        <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2 grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₦</span>
                                        <Input id="amount" type="number" step="0.01" className="pl-6" value={formData.amount} onChange={(e) => set("amount", e.target.value)} required placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Category <span className="text-red-500">*</span></Label>
                                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={categoryOpen}
                                                className="w-full justify-between font-normal"
                                            >
                                                <span className="truncate">
                                                    {formData.category
                                                        ? INCOME_CATEGORIES.find((c) => c.value === formData.category)?.label
                                                        : "Select a category"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[280px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search categories..." />
                                                <CommandList className="max-h-64">
                                                    <CommandEmpty>No category found.</CommandEmpty>
                                                    {CATEGORY_GROUPS.map((group) => (
                                                        <CommandGroup key={group} heading={group}>
                                                            {INCOME_CATEGORIES.filter((c) => c.group === group).map((cat) => (
                                                                <CommandItem
                                                                    key={cat.value}
                                                                    value={cat.label}
                                                                    onSelect={() => {
                                                                        set("category", cat.value);
                                                                        setCategoryOpen(false);
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", formData.category === cat.value ? "opacity-100" : "opacity-0")} />
                                                                    {cat.label}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    ))}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="paymentMethod">Payment Method <span className="text-red-500">*</span></Label>
                                <Select value={formData.paymentMethod} onValueChange={(v) => set("paymentMethod", v)} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="CARD">Card</SelectItem>
                                        <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                                        <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                                        <SelectItem value="ONLINE_PAYMENT">Online Payment</SelectItem>
                                        <SelectItem value="PETTY_CASH">Petty Cash</SelectItem>
                                        <SelectItem value="OTHERS">Others</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => set("description", e.target.value)}
                                    placeholder="Brief description of this income..."
                                    className="resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customer Info</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerName">Customer Name</Label>
                                <Input id="customerName" value={formData.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="Full name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerContact">Contact</Label>
                                <Input id="customerContact" value={formData.customerContact} onChange={(e) => set("customerContact", e.target.value)} placeholder="Phone or email" />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="customerAddress">Address</Label>
                                <Input id="customerAddress" value={formData.customerAddress} onChange={(e) => set("customerAddress", e.target.value)} placeholder="Street, city..." />
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                                <Input id="invoiceNumber" value={formData.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} placeholder="INV-001" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="receiptNumber">Receipt Number</Label>
                                <Input id="receiptNumber" value={formData.receiptNumber} onChange={(e) => set("receiptNumber", e.target.value)} placeholder="RCP-001" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoiceUrl">Invoice URL</Label>
                                <Input id="invoiceUrl" value={formData.invoiceUrl} onChange={(e) => set("invoiceUrl", e.target.value)} placeholder="https://..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="attachmentUrls">Attachment URLs</Label>
                                <Input id="attachmentUrls" value={formData.attachmentUrls} onChange={(e) => set("attachmentUrls", e.target.value)} placeholder="Comma-separated URLs" />
                            </div>
                        </div>
                    </div>

                    {/* Tax */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tax</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="taxType">Tax Type</Label>
                                <Input id="taxType" value={formData.taxType} onChange={(e) => set("taxType", e.target.value)} placeholder="e.g., VAT" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                                <Input id="taxRate" type="number" step="0.01" value={formData.taxRate} onChange={(e) => set("taxRate", e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxAmount">Tax Amount</Label>
                                <Input id="taxAmount" type="number" step="0.01" value={formData.taxAmount} onChange={(e) => set("taxAmount", e.target.value)} placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    {/* Commission */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Commission</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="commissionPayee">Payee</Label>
                                <Input id="commissionPayee" value={formData.commissionPayee} onChange={(e) => set("commissionPayee", e.target.value)} placeholder="Name or company" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="commissionRate">Rate (%)</Label>
                                <Input id="commissionRate" type="number" step="0.01" value={formData.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="commissionAmount">Amount</Label>
                                <Input id="commissionAmount" type="number" step="0.01" value={formData.commissionAmount} onChange={(e) => set("commissionAmount", e.target.value)} placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Schedule</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="recurrenceType">Recurrence</Label>
                                <Select value={formData.recurrenceType} onValueChange={(v) => set("recurrenceType", v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ONE_TIME">One Time</SelectItem>
                                        <SelectItem value="DAILY">Daily</SelectItem>
                                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                        <SelectItem value="YEARLY">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {formData.recurrenceType !== "ONE_TIME" && (
                                <div className="space-y-2">
                                    <Label htmlFor="nextOccurrence">Next Occurrence</Label>
                                    <Input id="nextOccurrence" type="date" value={formData.nextOccurrence} onChange={(e) => set("nextOccurrence", e.target.value)} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Accounting & Assignment */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Accounting & Assignment</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="accountCode">Account Code</Label>
                                <Input id="accountCode" value={formData.accountCode} onChange={(e) => set("accountCode", e.target.value)} placeholder="e.g., 4000" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="revenueCenter">Revenue Center</Label>
                                <Input id="revenueCenter" value={formData.revenueCenter} onChange={(e) => set("revenueCenter", e.target.value)} placeholder="e.g., Front Office" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="servedBy">Served By</Label>
                                <Input id="servedBy" value={formData.servedBy} onChange={(e) => set("servedBy", e.target.value)} placeholder="Staff name or ID" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="departmentId">Department</Label>
                                <Input id="departmentId" value={formData.departmentId} onChange={(e) => set("departmentId", e.target.value)} placeholder="Department ID" />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Internal Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            placeholder="Optional internal notes..."
                            className="resize-none"
                            rows={2}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Income
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createExpenditure } from "@/lib/financials-actions";
import { Loader2 } from "lucide-react";

interface CreateExpenditureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateExpenditureModal({
    open,
    onOpenChange,
}: CreateExpenditureModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
        vendor: "",
        invoiceNumber: "",
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            await createExpenditure({
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: formData.category,
                date: formData.date,
                vendor: formData.vendor,
                invoiceNumber: formData.invoiceNumber,
            });
        },
        onSuccess: () => {
            toast.success("Expenditure recorded successfully");
            queryClient.invalidateQueries({ queryKey: ["financials", "expenditures"] });
            onOpenChange(false);
            setFormData({
                description: "",
                amount: "",
                category: "",
                date: new Date().toISOString().split("T")[0],
                vendor: "",
                invoiceNumber: "",
            });
        },
        onError: (error) => {
            toast.error("Failed to record expenditure");
            console.error(error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Record Expenditure</DialogTitle>
                    <DialogDescription>
                        Record a new business expense. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData({ ...formData, amount: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Category
                            </Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                                required
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Utilities">Utilities</SelectItem>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    <SelectItem value="Supplies">Supplies</SelectItem>
                                    <SelectItem value="Salaries">Salaries</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="vendor" className="text-right">
                                Vendor
                            </Label>
                            <Input
                                id="vendor"
                                value={formData.vendor}
                                onChange={(e) =>
                                    setFormData({ ...formData, vendor: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="invoiceNumber" className="text-right">
                                Invoice No.
                            </Label>
                            <Input
                                id="invoiceNumber"
                                value={formData.invoiceNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, invoiceNumber: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                                Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({ ...formData, date: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

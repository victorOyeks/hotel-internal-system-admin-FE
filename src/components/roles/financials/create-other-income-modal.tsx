"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createOtherIncome } from "@/lib/financials-actions";
import { Loader2, PlusIcon } from "lucide-react";

interface CreateOtherIncomeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateOtherIncomeModal({
    open,
    onOpenChange,
}: CreateOtherIncomeModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "",
        reference: "",
        date: new Date().toISOString().split("T")[0],
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            // Basic Validation
            if (!formData.description || !formData.amount || !formData.category || !formData.date) {
                throw new Error("Please fill in all required fields.");
            }

            await createOtherIncome({
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: formData.category,
                reference: formData.reference,
                date: formData.date
            });
        },
        onSuccess: () => {
            toast.success("Income record created successfully");
            queryClient.invalidateQueries({ queryKey: ["financials", "other-income"] });
            onOpenChange(false);
            setFormData({
                description: "",
                amount: "",
                category: "",
                reference: "",
                date: new Date().toISOString().split("T")[0],
            });
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to create income record");
            console.error(error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Record Other Income</DialogTitle>
                    <DialogDescription>
                        Add a new miscellaneous income entry.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({ ...formData, date: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    className="pl-7"
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, amount: e.target.value })
                                    }
                                    required
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) =>
                                setFormData({ ...formData, category: value })
                            }
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sales">Sales</SelectItem>
                                <SelectItem value="Service">Service</SelectItem>
                                <SelectItem value="Rental">Rental</SelectItem>
                                <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                                <SelectItem value="Commission">Commission</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            required
                            placeholder="e.g., Vending Machine Revenue"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference / Notes</Label>
                        <Textarea
                            id="reference"
                            value={formData.reference}
                            onChange={(e) =>
                                setFormData({ ...formData, reference: e.target.value })
                            }
                            placeholder="Optional details..."
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-4">
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

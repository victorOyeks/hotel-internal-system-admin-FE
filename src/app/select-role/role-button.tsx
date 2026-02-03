"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

interface RoleButtonProps {
    icon: React.ReactNode;
    label: string;
    description: string;
}

export function RoleButton({ icon, label, description }: RoleButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={cn(
                "group w-full flex items-center justify-between py-4 px-4 -mx-4 transition-all disabled:cursor-not-allowed border",
                pending
                    ? "border-primary/20 rounded-lg bg-primary/5 animate-pulse"
                    : "hover:bg-muted border-transparent"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "transition-colors",
                    pending ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}>
                    {icon}
                </div>
                <div className="text-left">
                    <div className="text-base font-medium text-foreground">
                        {label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {description}
                    </div>
                </div>
            </div>
            {pending ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
            ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
        </button>
    );
}

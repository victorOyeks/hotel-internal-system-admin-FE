"use client";

import { CheckIcon, CheckCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageDeliveryStatus } from "@/lib/chat-types";

interface DeliveryStatusProps {
	status: MessageDeliveryStatus;
	className?: string;
}

export function DeliveryStatus({ status, className }: DeliveryStatusProps) {
	if (status === "SENT") {
		return <CheckIcon className={cn("size-3.5 text-white/60", className)} />;
	}

	if (status === "DELIVERED") {
		return (
			<CheckCheckIcon className={cn("size-3.5 text-white/60", className)} />
		);
	}

	return (
		<CheckCheckIcon className={cn("size-3.5 text-secondary-5", className)} />
	);
}

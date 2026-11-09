"use client";

import { CreditCardIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SidePanel } from "@hospio/ui/shared/side-panel";
import type { TerminalRow } from "@hospio/api/data/types";
import { PaymentSteps, type TakenPayment } from "../front-office/take-payment";

/** What is being paid: an order (or tab) of an outlet, or any other staff-desk sale such as laundry. */
export type DeskPayment = {
	/** The kitchen or bar order the payment settles; it closes itself when the payment is approved. */
	orderId?: string;
	guestName: string;
	amount: number;
	description: string;
	roomNumber?: string;
};

/**
 * Taking a payment at a staff desk (Kitchen, Bar, Laundry "take payment"): the same steps the front desk
 * uses (method, the POS terminal / transfer / cash, receipt, done), recorded with payment-service under
 * the desk's role so it lands on that desk's POS and till. Nothing is simulated: the card goes to the
 * terminal and the screen shows what the service answers (approved, declined, no response, or still
 * processing). `onDone` fires once the payment is recorded (any status); `onFinish` when the user is done.
 */
export function OrderPaymentPanel({
	open,
	onOpenChange,
	payment,
	desk,
	terminals = [],
	onDone,
	onFinish,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	payment: DeskPayment | null;
	/** The desk taking the payment; sent as the payment's role. */
	desk: "KITCHEN" | "BAR" | "LAUNDRY";
	terminals?: TerminalRow[];
	onDone?: (payment: TakenPayment) => void;
	onFinish?: () => void;
}) {
	const [run, setRun] = useState(0);
	useEffect(() => {
		if (open) setRun((n) => n + 1);
	}, [open]);
	const mine = terminals.filter((t) => t.roles.includes(desk));
	if (!payment) return null;
	return (
		<PaymentSteps
			key={run}
			target={{
				guestName: payment.guestName,
				roomNumber: payment.roomNumber,
				amountDue: payment.amount,
				description: payment.description,
				orderId: payment.orderId,
				role: desk,
			}}
			terminals={mine.length ? mine : terminals}
			onDone={onDone}
			onFinish={() => {
				onOpenChange(false);
				onFinish?.();
			}}
			onBack={() => onOpenChange(false)}
			doneLabel="Back to the orders"
		>
			{(v) => (
				<SidePanel
					open={open}
					onOpenChange={onOpenChange}
					title={v.title}
					subtitle={v.subtitle}
					icon={CreditCardIcon}
					footer={v.footer}
					footerInfo={v.footerInfo}
				>
					{v.body}
				</SidePanel>
			)}
		</PaymentSteps>
	);
}

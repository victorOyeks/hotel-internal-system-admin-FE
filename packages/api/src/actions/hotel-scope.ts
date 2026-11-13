"use client";

import {
	createContext,
	createElement,
	type ReactNode,
	useContext,
	useMemo,
} from "react";
import { runAtHotel, type ScopedActions, type ScopedName } from "./at-hotel";
import { folioById, folioForBooking, postCharge } from "./folio";
import { fillTemplate, messageTemplates } from "./guest-messages";
import { messageGuest } from "./owner";
import { recordPayment } from "./payment";
import {
	cancelBooking,
	changeBookingDates,
	checkIn,
	checkOut,
	createBooking,
} from "./reservation";

/**
 * Which hotel the booking and payment panels act on. The manager and front desk render them without a scope (the
 * sidebar's branch); the owner wraps them in `<HotelScope hotelId=…>` for the booking's own hotel, and every action
 * the panels call goes there (`runAtHotel`). `hotelName` is what messages to the guest say.
 */
type Scope = { hotelId?: string; hotelName?: string };

const ScopeContext = createContext<Scope>({});

export function HotelScope({
	hotelId,
	hotelName,
	children,
}: Scope & { children: ReactNode }) {
	const value = useMemo(() => ({ hotelId, hotelName }), [hotelId, hotelName]);
	return createElement(ScopeContext.Provider, { value }, children);
}

export function useHotelScope(): Scope {
	return useContext(ScopeContext);
}

const DIRECT: ScopedActions = {
	createBooking,
	checkIn,
	checkOut,
	changeBookingDates,
	cancelBooking,
	folioForBooking,
	folioById,
	postCharge,
	recordPayment,
	messageGuest,
	messageTemplates,
	fillTemplate,
};

/** The booking and payment actions for the hotel in scope (the sidebar's branch when there is none). */
export function useHotelActions(): ScopedActions {
	const { hotelId } = useContext(ScopeContext);
	return useMemo(() => {
		if (!hotelId) return DIRECT;
		const scoped: Record<string, unknown> = {};
		for (const name of Object.keys(DIRECT) as ScopedName[]) {
			scoped[name] = (...args: unknown[]) =>
				runAtHotel(hotelId, name, args as never);
		}
		return scoped as ScopedActions;
	}, [hotelId]);
}

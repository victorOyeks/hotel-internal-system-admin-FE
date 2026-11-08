/** Extra sample data for the staff tablets (housekeeping linen, laundry linen, bar seats). */
import { at, day } from "./hotel";

export type LinenRow = { id: string; name: string; clean: number; dirty: number; inLaundry: number; par: number; damaged: number };
export const demoLinen: LinenRow[] = [
	{ id: "ln-1", name: "Bath towel", clean: 118, dirty: 64, inLaundry: 40, par: 240, damaged: 3 },
	{ id: "ln-2", name: "Hand towel", clean: 140, dirty: 52, inLaundry: 30, par: 240, damaged: 1 },
	{ id: "ln-3", name: "Bed sheet · double", clean: 96, dirty: 48, inLaundry: 36, par: 200, damaged: 4 },
	{ id: "ln-4", name: "Pillowcase", clean: 210, dirty: 90, inLaundry: 60, par: 400, damaged: 0 },
	{ id: "ln-5", name: "Duvet cover", clean: 70, dirty: 31, inLaundry: 19, par: 130, damaged: 2 },
	{ id: "ln-6", name: "Bath mat", clean: 60, dirty: 33, inLaundry: 25, par: 130, damaged: 0 },
];

export type MachineLoadRow = { id: string; machine: string; kind: string; items: number; startedAt: string; readyAt: string; status: "RUNNING" | "DONE" | "FREE" };
export const demoMachines: MachineLoadRow[] = [
	{ id: "m-1", machine: "Washer 1", kind: "Bed sheets", items: 24, startedAt: at(0, 9, 10), readyAt: at(0, 10, 5), status: "DONE" },
	{ id: "m-2", machine: "Washer 2", kind: "Towels", items: 40, startedAt: at(0, 10, 20), readyAt: at(0, 11, 15), status: "RUNNING" },
	{ id: "m-3", machine: "Dryer 1", kind: "Guest clothes", items: 9, startedAt: at(0, 10, 40), readyAt: at(0, 11, 20), status: "RUNNING" },
	{ id: "m-4", machine: "Dryer 2", kind: "—", items: 0, startedAt: "", readyAt: "", status: "FREE" },
];

export type LinenMoveRow = { id: string; at: string; direction: "IN" | "OUT"; from: string; items: { name: string; qty: number }[]; by: string };
export const demoLinenMoves: LinenMoveRow[] = [
	{ id: "lm-1", at: at(0, 8, 15), direction: "IN", from: "Floor 1 · dirty", items: [{ name: "Bath towel", qty: 32 }, { name: "Bed sheet · double", qty: 18 }], by: "Lola Eze" },
	{ id: "lm-2", at: at(0, 10, 10), direction: "OUT", from: "Floor 2 · clean", items: [{ name: "Bath towel", qty: 40 }, { name: "Pillowcase", qty: 30 }], by: "Lola Eze" },
	{ id: "lm-3", at: at(-1, 16, 0), direction: "OUT", from: "Floor 3 · clean", items: [{ name: "Duvet cover", qty: 12 }], by: "Lola Eze" },
];

export const laundryPriceList = [
	{ name: "Shirt", price: 1500 },
	{ name: "Trousers", price: 2000 },
	{ name: "Dress", price: 2500 },
	{ name: "Blouse", price: 1550 },
	{ name: "Suit · dry clean", price: 6000 },
	{ name: "Native · 2 piece", price: 4000 },
	{ name: "Jacket", price: 3500 },
	{ name: "Underwear · 5", price: 1200 },
];

export type SeatRow = { id: string; name: string; state: "FREE" | "TAB" | "RESERVED"; who?: string; amount?: number; orderId?: string };
export const demoSeats: SeatRow[] = [
	{ id: "s1", name: "Seat 1", state: "FREE" },
	{ id: "s2", name: "Seat 2", state: "FREE" },
	{ id: "s3", name: "Bar 2", state: "FREE" },
	{ id: "s4", name: "Seat 4", state: "FREE" },
	{ id: "s5", name: "Lounge 1", state: "TAB", who: "Emeka Nwosu · A207", amount: 15600, orderId: "or-6" },
	{ id: "s6", name: "Lounge 2", state: "FREE" },
	{ id: "s7", name: "Pool 3", state: "TAB", who: "2 guests", amount: 8000, orderId: "or-7" },
	{ id: "s8", name: "Lounge 4", state: "RESERVED", who: "Reserved 9pm" },
];

export const demoPublicAreas = ["Lobby", "Restaurant", "Bar", "Pool deck", "Gym", "Floor 1 corridor", "Floor 2 corridor", "Floor 3 corridor"];

export const demoWeekShifts = { from: day(-1), to: day(5) };

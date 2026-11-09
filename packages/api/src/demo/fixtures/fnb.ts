import type {
	CategoryRow,
	HappyHourRow,
	OutletRow,
	OutletSalesDayRow,
} from "@hospio/api/data/types";
import { demoMenu } from "./ops";

/** Demo outlets, tables, categories, happy hours and the day's sales (restaurant-bar contract). */

const tables = (outletId: string, numbers: string[]) =>
	numbers.map((number, i) => ({
		id: `${outletId}-t${i + 1}`,
		outletId,
		number,
		seats: 4,
		active: true,
	}));

export const demoOutlets: OutletRow[] = [
	{
		id: "kitchen",
		name: "Restaurant",
		kind: "KITCHEN",
		status: "OPEN",
		storeId: "st-kitchen",
		tables: tables("kitchen", [
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"Terrace 1",
			"Terrace 2",
		]),
	},
	{
		id: "bar",
		name: "Bar",
		kind: "BAR",
		status: "OPEN",
		storeId: "st-bar",
		tables: tables("bar", [
			"Seat 1",
			"Seat 2",
			"Bar 2",
			"Seat 4",
			"Lounge 1",
			"Lounge 2",
			"Pool 3",
			"Lounge 4",
		]),
	},
];

export const demoCategories = (outletId: string): CategoryRow[] =>
	Array.from(
		new Set(
			demoMenu.filter((m) => m.outletId === outletId).map((m) => m.category),
		),
	).map((name, i) => ({
		id: `${outletId}-c${i + 1}`,
		name,
		sortOrder: i,
		active: true,
	}));

export const demoHappyHours: HappyHourRow[] = [
	{
		id: "hh-1",
		name: "Happy hour",
		from: "17:00",
		to: "19:00",
		days: "MON,TUE,WED,THU,FRI",
		discountPct: 20,
		active: true,
	},
];

export const demoSales: OutletSalesDayRow = {
	outlets: [
		{
			outletId: "kitchen",
			name: "Restaurant",
			kind: "KITCHEN",
			orders: 14,
			sales: 214600,
			paidAtOutlet: 163400,
			chargedToRooms: 51200,
			cancelled: 1,
			byMethod: { CARD: 98000, TRANSFER: 31400, CASH: 34000 },
			topItems: [
				{ name: "Jollof rice & chicken", qty: 12, sales: 102000 },
				{ name: "Pounded yam & egusi", qty: 6, sales: 57000 },
			],
		},
		{
			outletId: "bar",
			name: "Bar",
			kind: "BAR",
			orders: 31,
			sales: 184500,
			paidAtOutlet: 159150,
			chargedToRooms: 25350,
			cancelled: 0,
			byMethod: { CARD: 98500, TRANSFER: 39650, CASH: 21000 },
			topItems: [
				{ name: "Star Lager", qty: 42, sales: 75600 },
				{ name: "Heineken", qty: 18, sales: 39600 },
			],
		},
	],
	totals: {
		orders: 45,
		sales: 399100,
		paidAtOutlet: 322550,
		chargedToRooms: 76550,
		cancelled: 1,
		byMethod: { CARD: 196500, TRANSFER: 71050, CASH: 55000 },
	},
};

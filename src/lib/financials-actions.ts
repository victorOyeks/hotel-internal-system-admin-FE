"use server";

import { getCookieData } from "@/lib/server-fns";
import { $fetch } from "./fetch";
import { cache } from "react";
import { getManagerCurrentHotel, getOwnerCurrentHotel } from "./dal";
import type { OtherIncome, Expenditure } from "./api-routes/financials";

const getHotelContext = async () => {
	const managerHotel = await getManagerCurrentHotel();
	if (managerHotel) return { hotelId: managerHotel.id, role: "managers" as const };

	const ownerHotel = await getOwnerCurrentHotel();
	if (ownerHotel) return { hotelId: ownerHotel.id, role: "hotel-owners" as const };

	return null;
};

export const getFinancialDashboard = cache(
	async (params: { startDate?: string; endDate?: string; period?: string }) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			params: { hotelId: ctx.hotelId },
			query: { ...params },
			throw: true,
		};

		const res = ctx.role === "hotel-owners"
			? await $fetch("@get/api/hotel-owners/:hotelId/financials/dashboard", opts)
			: await $fetch("@get/api/managers/:hotelId/financials/dashboard", opts);

		return res.data;
	},
);

export const getOtherIncome = cache(
	async (params: {
		page?: number;
		size?: number;
		search?: string;
		startDate?: string;
		endDate?: string;
		category?: string;
	}) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			params: { hotelId: ctx.hotelId },
			query: { ...params },
			throw: true,
		};

		const res = ctx.role === "hotel-owners"
			? await $fetch("@get/api/hotel-owners/:hotelId/financials/other-income", opts)
			: await $fetch("@get/api/managers/:hotelId/financials/other-income", opts);

		return res.data;
	},
);

export const createOtherIncome = async (
	data: Omit<OtherIncome, "id" | "status" | "recordedBy">,
) => {
	const cookieData = await getCookieData();
	const ctx = await getHotelContext();
	if (!cookieData || !ctx) throw new Error("Unauthorized");

	const opts = {
		auth: { type: "Bearer" as const, token: cookieData.token },
		params: { hotelId: ctx.hotelId },
		body: { ...data },
	};

	const res = ctx.role === "hotel-owners"
		? await $fetch("@post/api/hotel-owners/:hotelId/financials/other-income", opts)
		: await $fetch("@post/api/managers/:hotelId/financials/other-income", opts);

	return res.data;
};

export const updateOtherIncomeStatus = async (
	id: string,
	status: "PENDING" | "APPROVED" | "REJECTED",
) => {
	const cookieData = await getCookieData();
	const ctx = await getHotelContext();
	if (!cookieData || !ctx) throw new Error("Unauthorized");

	const opts = {
		auth: { type: "Bearer" as const, token: cookieData.token },
		params: { hotelId: ctx.hotelId, id },
		query: { status },
	};

	const res = ctx.role === "hotel-owners"
		? await $fetch("@patch/api/hotel-owners/:hotelId/financials/other-income/:id/status", opts)
		: await $fetch("@patch/api/managers/:hotelId/financials/other-income/:id/status", opts);

	return res.data;
};

export const getExpenditures = cache(
	async (params: {
		page?: number;
		size?: number;
		search?: string;
		status?: string;
		category?: string;
		startDate?: string;
		endDate?: string;
	}) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			params: { hotelId: ctx.hotelId },
			query: { ...params },
			throw: true,
		};

		const res = ctx.role === "hotel-owners"
			? await $fetch("@get/api/hotel-owners/:hotelId/financials/expenditures", opts)
			: await $fetch("@get/api/managers/:hotelId/financials/expenditures", opts);

		return res.data;
	},
);

export const createExpenditure = async (
	data: {
		description: string;
		amount: number;
		category: string;
		expenseDate: string;
		vendorName: string;
		invoiceNumber?: string;
	},
) => {
	const cookieData = await getCookieData();
	const ctx = await getHotelContext();
	if (!cookieData || !ctx) throw new Error("Unauthorized");

	const opts = {
		auth: { type: "Bearer" as const, token: cookieData.token },
		params: { hotelId: ctx.hotelId },
		body: { ...data },
	};

	const res = ctx.role === "hotel-owners"
		? await $fetch("@post/api/hotel-owners/:hotelId/financials/expenditures", opts)
		: await $fetch("@post/api/managers/:hotelId/financials/expenditures", opts);

	return res.data;
};

export const updateExpenditureStatus = async (
	id: string,
	status: "PENDING" | "APPROVED" | "PAID" | "REJECTED",
) => {
	const cookieData = await getCookieData();
	const ctx = await getHotelContext();
	if (!cookieData || !ctx) throw new Error("Unauthorized");

	const opts = {
		auth: { type: "Bearer" as const, token: cookieData.token },
		params: { hotelId: ctx.hotelId, id },
		query: { status },
	};

	const res = ctx.role === "hotel-owners"
		? await $fetch("@patch/api/hotel-owners/:hotelId/financials/expenditures/:id/status", opts)
		: await $fetch("@patch/api/managers/:hotelId/financials/expenditures/:id/status", opts);

	return res.data;
};

export const getProfitAndLoss = cache(
	async (params: { startDate: string; endDate: string; period?: string }) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			params: { hotelId: ctx.hotelId },
			query: { ...params },
			throw: true,
		};

		const res = ctx.role === "hotel-owners"
			? await $fetch("@get/api/hotel-owners/:hotelId/financials/profit-and-loss", opts)
			: await $fetch("@get/api/managers/:hotelId/financials/profit-and-loss", opts);

		return res.data;
	},
);

export const getCashFlow = cache(
	async (params: { startDate: string; endDate: string; period?: string }) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			params: { hotelId: ctx.hotelId },
			query: { ...params },
			throw: true,
		};

		const res = ctx.role === "hotel-owners"
			? await $fetch("@get/api/hotel-owners/:hotelId/financials/cash-flow", opts)
			: await $fetch("@get/api/managers/:hotelId/financials/cash-flow", opts);

		return res.data;
	},
);

export const getOverdueExpenditures = cache(async () => {
	const cookieData = await getCookieData();
	const ctx = await getHotelContext();
	if (!cookieData || !ctx) return null;

	const opts = {
		auth: { type: "Bearer" as const, token: cookieData.token },
		params: { hotelId: ctx.hotelId },
		throw: true,
	};

	const res = ctx.role === "hotel-owners"
		? await $fetch("@get/api/hotel-owners/:hotelId/financials/expenditures/overdue", opts)
		: await $fetch("@get/api/managers/:hotelId/financials/expenditures/overdue", opts);

	return res.data;
});

export const getConsumptionReport = cache(
	async (params: {
		startDate?: string;
		endDate?: string;
		page?: string;
		size?: string;
	}) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const res = await $fetch("@get/api/financials/items/consumption-report", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId: ctx.hotelId },
			throw: true,
		});

		return res.data;
	},
);

export const getComprehensiveSummary = cache(
	async (params: { startDate?: string; endDate?: string }) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			params: { hotelId: ctx.hotelId },
			query: { ...params },
			throw: true,
		};

		const res = ctx.role === "hotel-owners"
			? await $fetch("@get/api/hotel-owners/:hotelId/financials/comprehensive", opts)
			: await $fetch("@get/api/managers/:hotelId/financials/comprehensive", opts);

		return res.data;
	},
);

export const getRevenue = cache(
	async (params: { startDate?: string; endDate?: string; period?: string }) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			params: { hotelId: ctx.hotelId },
			query: { ...params },
			throw: true,
		};

		const res = ctx.role === "hotel-owners"
			? await $fetch("@get/api/hotel-owners/:hotelId/financials/revenue", opts)
			: await $fetch("@get/api/managers/:hotelId/financials/revenue", opts);

		return res.data;
	},
);

export const getRestaurantDailySummary = cache(
	async (params: { date?: string }) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			params: { hotelId: ctx.hotelId },
			query: { ...params },
			throw: true,
		};

		const res = ctx.role === "hotel-owners"
			? await $fetch("@get/api/hotel-owners/:hotelId/restaurant/summary", opts)
			: await $fetch("@get/api/managers/:hotelId/restaurant/summary", opts);

		return res.data;
	},
);

export const getRestaurantRoomFoodSales = cache(
	async (params: {
		startDate?: string;
		endDate?: string;
		search?: string;
		page?: number;
		size?: number;
	}) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const res = await $fetch("@get/api/financials/restaurant/room-food-sales", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId: ctx.hotelId },
			throw: true,
		});

		return res.data;
	},
);

export const getRestaurantItemSalesDetail = cache(
	async (params: {
		startDate?: string;
		endDate?: string;
		search?: string;
		page?: number;
		size?: number;
	}) => {
		const cookieData = await getCookieData();
		const ctx = await getHotelContext();
		if (!cookieData || !ctx) return null;

		const res = await $fetch(
			"@get/api/financials/restaurant/item-sales-detail",
			{
				auth: {
					type: "Bearer",
					token: cookieData.token,
				},
				query: { ...params, hotelId: ctx.hotelId },
				throw: true,
			},
		);

		return res.data;
	},
);

export const getBookingFinancialDetails = cache(async (bookingId: string) => {
	const cookieData = await getCookieData();
	const ctx = await getHotelContext();
	if (!cookieData || !ctx) return null;

	const res = await $fetch("@get/api/financials/bookings/:bookingId/detailed", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
		params: { bookingId },
		query: { hotelId: ctx.hotelId },
		throw: true,
	});

	return res.data;
});

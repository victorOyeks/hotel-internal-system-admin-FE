"use server";

import { getCookieData } from "@/lib/server-fns";
import { $fetch } from "./fetch";
import { cache } from "react";
import { getManagerCurrentHotel } from "./dal";
import type { OtherIncome, Expenditure } from "./api-routes/financials";

const getHotelId = async () => {
	const managerHotel = await getManagerCurrentHotel();
	if (managerHotel) return managerHotel.id;

	return null;
};

export const getFinancialDashboard = cache(
	async (params: { startDate?: string; endDate?: string; period?: string }) => {
		const cookieData = await getCookieData();
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch("@get/api/financials/dashboard", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId },
			throw: true,
		});

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
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch("@get/api/financials/other-income", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId },
			throw: true,
		});

		return res.data;
	},
);

// ... create/update actions restored

export const createOtherIncome = async (
	data: Omit<OtherIncome, "id" | "status" | "recordedBy">,
) => {
	const cookieData = await getCookieData();
	const hotelId = await getHotelId();
	if (!cookieData || !hotelId) throw new Error("Unauthorized");

	const res = await $fetch("@post/api/financials/other-income", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
		body: { ...data, hotelId },
	});

	return res.data;
};

export const updateOtherIncomeStatus = async (
	id: string,
	status: "PENDING" | "APPROVED" | "REJECTED",
) => {
	const cookieData = await getCookieData();
	if (!cookieData) throw new Error("Unauthorized");

	const res = await $fetch("@patch/api/financials/other-income/:id/status", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
		params: { id },
		body: { status },
	});

	return res.data;
};

export const getExpenditures = cache(
	async (params: {
		page?: number;
		size?: number;
		search?: string;
		startDate?: string;
		endDate?: string;
	}) => {
		const cookieData = await getCookieData();
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch("@get/api/financials/expenditures", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId },
			throw: true,
		});

		return res.data;
	},
);

export const createExpenditure = async (
	data: Omit<Expenditure, "id" | "status" | "approvedBy">,
) => {
	const cookieData = await getCookieData();
	const hotelId = await getHotelId();
	if (!cookieData || !hotelId) throw new Error("Unauthorized");

	const res = await $fetch("@post/api/financials/expenditures", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
		body: { ...data, hotelId },
	});

	return res.data;
};

export const updateExpenditureStatus = async (
	id: string,
	status: "PENDING" | "APPROVED" | "PAID" | "REJECTED",
) => {
	const cookieData = await getCookieData();
	if (!cookieData) throw new Error("Unauthorized");

	const res = await $fetch("@patch/api/financials/expenditures/:id/status", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
		params: { id },
		body: { status },
	});

	return res.data;
};

export const getProfitAndLoss = cache(
	async (params: { startDate: string; endDate: string; period?: string }) => {
		const cookieData = await getCookieData();
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch("@get/api/financials/profit-and-loss", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId },
			throw: true,
		});

		return res.data;
	},
);

export const getCashFlow = cache(
	async (params: { startDate: string; endDate: string; period?: string }) => {
		const cookieData = await getCookieData();
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch("@get/api/financials/cash-flow", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId },
			throw: true,
		});

		return res.data;
	},
);

export const getOverdueExpenditures = cache(async () => {
	const cookieData = await getCookieData();
	const hotelId = await getHotelId();
	if (!cookieData || !hotelId) return null;

	const res = await $fetch("@get/api/financials/expenditures/overdue", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
		query: { hotelId },
		throw: true,
	});

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
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch("@get/api/financials/items/consumption-report", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId },
			throw: true,
		});

		return res.data;
	},
);

export const getComprehensiveSummary = cache(
	async (params: { startDate?: string; endDate?: string }) => {
		const cookieData = await getCookieData();
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch("@get/api/financials/summary/comprehensive", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId },
			throw: true,
		});

		return res.data;
	},
);

export const getRevenue = cache(
	async (params: { startDate?: string; endDate?: string; period?: string }) => {
		const cookieData = await getCookieData();
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch("@get/api/financials/revenue", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId },
			throw: true,
		});

		return res.data;
	},
);

export const getRestaurantDailySummary = cache(
	async (params: { date?: string }) => {
		const cookieData = await getCookieData();
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch("@get/api/financials/restaurant/daily-summary", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId },
			throw: true,
		});

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
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch("@get/api/financials/restaurant/room-food-sales", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: { ...params, hotelId },
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
		const hotelId = await getHotelId();
		if (!cookieData || !hotelId) return null;

		const res = await $fetch(
			"@get/api/financials/restaurant/item-sales-detail",
			{
				auth: {
					type: "Bearer",
					token: cookieData.token,
				},
				query: { ...params, hotelId },
				throw: true,
			},
		);

		return res.data;
	},
);

export const getBookingFinancialDetails = cache(async (bookingId: string) => {
	const cookieData = await getCookieData();
	const hotelId = await getHotelId();
	if (!cookieData || !hotelId) return null;

	const res = await $fetch("@get/api/financials/bookings/:bookingId/detailed", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
		params: { bookingId },
		query: { hotelId },
		throw: true,
	});

	return res.data;
});

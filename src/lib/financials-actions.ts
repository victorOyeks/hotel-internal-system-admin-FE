"use server";

import { getCookieData } from "@/lib/server-fns";
import { $fetch } from "./fetch";
import { cache } from "react";
import type {
	OtherIncome,
	FinancialDashboardResponse,
	ProfitAndLossStatement,
	CashFlowStatement,
	ComprehensiveSummaryData,
	ItemConsumptionReport,
} from "./api-routes/financials";

export const getFinancialDashboard = cache(
	async (params: {
		startDate?: string;
		endDate?: string;
		period?: string;
	}): Promise<FinancialDashboardResponse | null> => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			query: { ...params },
			throw: true,
		};

		const res = await $fetch("@get/api/financials/dashboard", opts);
		return res.data as FinancialDashboardResponse;
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
		if (!cookieData) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			query: {
				...params,
				page: params.page?.toString(),
				size: params.size?.toString(),
			},
			throw: true,
		};

		const res = await $fetch("@get/api/financials/other-income", opts);

		return res.data;
	},
);

export const createOtherIncome = async (data: {
	title: string;
	description?: string;
	amount: number;
	category: string;
	paymentMethod: string;
	incomeDate: string;
	receivedDate?: string;
	customerName?: string;
	customerContact?: string;
	customerAddress?: string;
	invoiceNumber?: string;
	receiptNumber?: string;
	taxAmount?: number;
	taxType?: string;
	taxRate?: number;
	commissionAmount?: number;
	commissionRate?: number;
	commissionPayee?: string;
	recurrenceType?: string;
	nextOccurrence?: string;
	departmentId?: string;
	servedBy?: string;
	invoiceUrl?: string;
	attachmentUrls?: string;
	notes?: string;
	accountCode?: string;
	revenueCenter?: string;
}) => {
	const cookieData = await getCookieData();
	if (!cookieData) throw new Error("Unauthorized");
	const res = await $fetch("@post/api/financials/other-income", {
		auth: { type: "Bearer", token: cookieData.token },
		body: { ...data },
		throw: true,
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
		params: { id },
		auth: { type: "Bearer", token: cookieData.token },
		query: { status },
		throw: true,
	});

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
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/expenditures", {
			auth: { type: "Bearer", token: cookieData.token },
			query: {
				...params,
				page: params.page?.toString(),
				size: params.size?.toString(),
			},
			throw: true,
		});

		return res.data;
	},
);

export const createExpenditure = async (data: {
	title: string;
	description?: string;
	amount: number;
	category: string;
	paymentMethod: string;
	expenseDate: string;
	dueDate?: string;
	vendorName?: string;
	vendorContact?: string;
	vendorAddress?: string;
	invoiceNumber?: string;
	purchaseOrderNumber?: string;
	departmentId?: string;
	requestedBy?: string;
	taxAmount?: number;
	taxType?: string;
	taxRate?: number;
	recurrenceType?: string;
	nextOccurrence?: string;
	receiptUrl?: string;
	attachmentUrls?: string;
	notes?: string;
	accountCode?: string;
	costCenter?: string;
	budgetId?: string;
}) => {
	const cookieData = await getCookieData();
	if (!cookieData) throw new Error("Unauthorized");

	const res = await $fetch("@post/api/financials/expenditures", {
		auth: { type: "Bearer", token: cookieData.token },
		body: { ...data },
		throw: true,
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
		params: { id },
		auth: { type: "Bearer", token: cookieData.token },
		query: { status },
		throw: true,
	});

	return res.data;
};

export const getProfitAndLoss = cache(
	async (params: {
		startDate: string;
		endDate: string;
		period?: string;
	}): Promise<ProfitAndLossStatement | null> => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			query: { ...params },
			throw: true,
		};

		const res = await $fetch("@get/api/financials/profit-and-loss", opts);

		return res.data as ProfitAndLossStatement;
	},
);

export const getCashFlow = cache(
	async (params: {
		startDate: string | null;
		endDate: string | null;
		period?: string | null;
	}): Promise<CashFlowStatement | null> => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			query: { ...params },
			throw: true,
		};

		const res = await $fetch("@get/api/financials/cash-flow", opts);

		return res.data as CashFlowStatement;
	},
);

export const getOverdueExpenditures = cache(async () => {
	const cookieData = await getCookieData();
	if (!cookieData) return null;

	const opts = {
		auth: { type: "Bearer" as const, token: cookieData.token },
		throw: true,
	};

	const res = await $fetch("@get/api/financials/expenditures/overdue", opts);

	return res.data;
});

export const getConsumptionReport = cache(
	async (params: {
		startDate?: string | null;
		endDate?: string | null;
		itemType?: string | null;
		page?: number | null;
		size?: number | null;
	}): Promise<ItemConsumptionReport | null> => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/items/consumption-report", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: {
				...params,
				page: params.page,
				size: params.size,
			},
			throw: true,
		});

		return res.data as ItemConsumptionReport;
	},
);

export const getComprehensiveSummary = cache(
	async (params: {
		startDate?: string | null;
		endDate?: string | null;
	}): Promise<ComprehensiveSummaryData | null> => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			query: { ...params },
			throw: true,
		};

		const res = await $fetch("@get/api/financials/summary/comprehensive", opts);

		return res.data as ComprehensiveSummaryData;
	},
);

export const getRevenue = cache(
	async (params: { startDate?: string; endDate?: string; period?: string }) => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			query: { ...params },
			throw: true,
		};

		const res = await $fetch("@get/api/financials/revenue", opts);

		return res.data;
	},
);

export const getRestaurantDailySummary = cache(
	async (params: { date?: string }) => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const opts = {
			auth: { type: "Bearer" as const, token: cookieData.token },
			query: { ...params },
			throw: true,
		};

		const res = await $fetch(
			"@get/api/financials/restaurant/daily-summary",
			opts,
		);

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
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/restaurant/room-food-sales", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: {
				...params,
				page: params.page?.toString(),
				size: params.size?.toString(),
			},
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
		if (!cookieData) return null;

		const res = await $fetch(
			"@get/api/financials/restaurant/item-sales-detail",
			{
				auth: {
					type: "Bearer",
					token: cookieData.token,
				},
				query: {
					...params,
					page: params.page?.toString(),
					size: params.size?.toString(),
				},
				throw: true,
			},
		);

		return res.data;
	},
);

export const getBookingFinancialDetails = cache(async (bookingId: string) => {
	const cookieData = await getCookieData();
	if (!cookieData) return null;

	const res = await $fetch("@get/api/financials/bookings/:bookingId/detailed", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
		params: { bookingId },
		throw: true,
	});

	return res.data;
});

// --- New actions ---

export type PeriodComparisonData = {
	period1: FinancialDashboardResponse | null;
	period2: FinancialDashboardResponse | null;
	period1Label?: string;
	period2Label?: string;
};

export const compareFinancials = cache(
	async (params: {
		period1Start: string;
		period1End: string;
		period2Start: string;
		period2End: string;
	}): Promise<PeriodComparisonData | null> => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/compare", {
			auth: { type: "Bearer" as const, token: cookieData.token },
			query: { ...params },
			throw: true,
		});

		return res.data as unknown as PeriodComparisonData;
	},
);

export const getTodaySummary = cache(
	async (): Promise<FinancialDashboardResponse | null> => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/today", {
			auth: { type: "Bearer" as const, token: cookieData.token },
			throw: true,
		});

		return res.data as unknown as FinancialDashboardResponse;
	},
);

export const getThisWeekSummary = cache(
	async (): Promise<FinancialDashboardResponse | null> => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/this-week", {
			auth: { type: "Bearer" as const, token: cookieData.token },
			throw: true,
		});

		return res.data as unknown as FinancialDashboardResponse;
	},
);

export const getRestaurantDetailedReport = cache(
	async (params: {
		startDate?: string | null;
		endDate?: string | null;
	}) => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/restaurant/detailed-report", {
			auth: { type: "Bearer" as const, token: cookieData.token },
			query: { ...params },
			throw: true,
		});

		return res.data;
	},
);

export const getRestaurantPaginatedDailySummary = cache(
	async (params: {
		startDate?: string | null;
		endDate?: string | null;
		destination?: string | null;
		search?: string | null;
		page?: number | null;
		size?: number | null;
	}) => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const res = await $fetch(
			"@get/api/financials/restaurant/daily-summary/paginated",
			{
				auth: { type: "Bearer" as const, token: cookieData.token },
				query: {
					...params,
					page: params.page?.toString(),
					size: params.size?.toString(),
				},
				throw: true,
			},
		);

		return res.data;
	},
);

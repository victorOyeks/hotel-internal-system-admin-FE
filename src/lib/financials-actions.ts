"use server";

import { getCookieData } from "@/lib/server-fns";
import { $fetch, type OtherIncome, type Expenditure } from "./fetch";
import { cache } from "react";

// --- Actions ---

export const getFinancialDashboard = cache(
	async (params: { startDate?: string; endDate?: string; period?: string }) => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/dashboard", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: params,
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
	}) => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/other-income", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: params,
			throw: true,
		});

		return res.data;
	},
);

export const createOtherIncome = async (
	data: Omit<OtherIncome, "id" | "status" | "recordedBy">,
) => {
	const cookieData = await getCookieData();
	if (!cookieData) throw new Error("Unauthorized");

	const res = await $fetch("@post/api/financials/other-income", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
		input: data,
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
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/expenditures", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: params,
			throw: true,
		});

		return res.data;
	},
);

export const createExpenditure = async (
	data: Omit<Expenditure, "id" | "status" | "approvedBy">,
) => {
	const cookieData = await getCookieData();
	if (!cookieData) throw new Error("Unauthorized");

	const res = await $fetch("@post/api/financials/expenditures", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
		input: data,
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
	async (params: { startDate: string; endDate: string }) => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/profit-and-loss", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: params,
			throw: true,
		});

		return res.data;
	},
);

export const getCashFlow = cache(
	async (params: { startDate: string; endDate: string }) => {
		const cookieData = await getCookieData();
		if (!cookieData) return null;

		const res = await $fetch("@get/api/financials/cash-flow", {
			auth: {
				type: "Bearer",
				token: cookieData.token,
			},
			query: params,
			throw: true,
		});

		return res.data;
	},
);

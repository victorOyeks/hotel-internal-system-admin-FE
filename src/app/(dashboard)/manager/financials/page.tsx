import { Financials } from "@/components/roles/manager/financials";
import { getManagerCurrentHotel } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import { use } from "react";

function FinancesPage() {
	const breadcrumbs: Breadcrumb[] = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Financials", href: "/dashboard/financials" },
	];

	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const { id } = use(getManagerCurrentHotel())!;

	const fetchOpts = {
		query: {},
		auth: { type: "Bearer" as const, token: cookieData.token },
		throw: true,
	};

	// Start all queries in parallel before any use() call
	const dashboardPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "financials", "dashboard", id],
		queryFn: async () => {
			try {
				const res = await $fetch(
					"@get/api/managers/:hotelId/financials/dashboard",
					{ params: { hotelId: id }, ...fetchOpts },
				);
				return res.data;
			} catch {
				return null;
			}
		},
	});

	const revenuePromise = queryClient.ensureQueryData({
		queryKey: ["manager", "financials", "revenue", id],
		queryFn: async () => {
			try {
				const res = await $fetch(
					"@get/api/managers/:hotelId/financials/revenue",
					{ params: { hotelId: id }, ...fetchOpts },
				);
				return res.data;
			} catch {
				return null;
			}
		},
	});

	const profitLossPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "financials", "profit-loss", id],
		queryFn: async () => {
			try {
				const res = await $fetch(
					"@get/api/managers/:hotelId/financials/profit-and-loss",
					{ params: { hotelId: id }, ...fetchOpts },
				);
				return res.data;
			} catch {
				return null;
			}
		},
	});

	const expensesPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "financials", "expenses", id],
		queryFn: async () => {
			try {
				const res = await $fetch(
					"@get/api/managers/:hotelId/financials/expenses",
					{ params: { hotelId: id }, ...fetchOpts },
				);
				return res.data;
			} catch {
				return null;
			}
		},
	});

	// Wait for all results (queries already running in parallel)
	const dashboardData = use(dashboardPromise);
	const revenueData = use(revenuePromise);
	const profitLossData = use(profitLossPromise);
	const expensesData = use(expensesPromise);

	return (
		<Financials
			breadcrumbs={breadcrumbs}
			dashboardData={dashboardData}
			revenueData={revenueData}
			profitLossData={profitLossData}
			expensesData={expensesData}
			hotelId={id}
		/>
	);
}

export default FinancesPage;

import { Financials } from "@/components/roles/manager/financials";
import { getOwnerCurrentHotel } from "@/lib/dal";
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
	const currentHotel = use(getOwnerCurrentHotel());

	if (!currentHotel) {
		return (
			<div className="p-6">
				<div className="bg-white p-8 rounded-2xl text-center">
					<p className="text-gray-500">
						Please select a hotel from the sidebar to view financial data.
					</p>
				</div>
			</div>
		);
	}

	const { id } = currentHotel;

	const fetchOpts = {
		query: {},
		auth: { type: "Bearer" as const, token: cookieData.token },
		throw: true,
	};

	const dashboardPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "financials", "dashboard", id],
		queryFn: async () => {
			try {
				const res = await $fetch(
					"@get/api/hotel-owners/:hotelId/financials/dashboard",
					{ params: { hotelId: id }, ...fetchOpts },
				);
				return res.data;
			} catch {
				return null;
			}
		},
	});

	const revenuePromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "financials", "revenue", id],
		queryFn: async () => {
			try {
				const res = await $fetch(
					"@get/api/hotel-owners/:hotelId/financials/revenue",
					{ params: { hotelId: id }, ...fetchOpts },
				);
				return res.data;
			} catch {
				return null;
			}
		},
	});

	const profitLossPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "financials", "profit-loss", id],
		queryFn: async () => {
			try {
				const res = await $fetch(
					"@get/api/hotel-owners/:hotelId/financials/profit-and-loss",
					{ params: { hotelId: id }, ...fetchOpts },
				);
				return res.data;
			} catch {
				return null;
			}
		},
	});

	const expensesPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "financials", "expenses", id],
		queryFn: async () => {
			try {
				const res = await $fetch(
					"@get/api/hotel-owners/:hotelId/financials/expenses",
					{ params: { hotelId: id }, ...fetchOpts },
				);
				return res.data;
			} catch {
				return null;
			}
		},
	});

	const dashboardData = use(dashboardPromise);
	const revenueData = use(revenuePromise);
	const profitLossData = use(profitLossPromise);
	const expensesData = use(expensesPromise);

	return (
		<Financials
			breadcrumbs={breadcrumbs}
			dashboardData={dashboardData as any}
			revenueData={revenueData as any}
			profitLossData={profitLossData as any}
			expensesData={expensesData as any}
			hotelId={id}
		/>
	);
}

export default FinancesPage;

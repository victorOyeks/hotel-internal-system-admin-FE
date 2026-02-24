import { z } from "zod";

const ApiResponseObject = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: z.object({}), // Generic object
});

// --- Schemas ---

export const FinancialDashboardTrendData = z.object({
	periodStart: z.string().optional().nullable(),
	periodEnd: z.string().optional().nullable(),
	periodLabel: z.string().optional().nullable(),
	revenue: z.number(),
	expenses: z.number(),
	profit: z.number(),
	cashFlow: z.number().optional().nullable(),
	profitMargin: z.number().optional().nullable(),
	transactionCount: z.number().optional().nullable(),
});

export type FinancialDashboardTrendData = z.infer<
	typeof FinancialDashboardTrendData
>;

export const FinancialDashboardTopRevenueStream = z.object({
	source: z.string(),
	amount: z.number(),
	percentage: z.number(),
	transactionCount: z.number().optional().nullable(),
	averageTransactionValue: z.number().optional().nullable(),
	paidAmount: z.number().optional().nullable(),
	pendingAmount: z.number().optional().nullable(),
	refundedAmount: z.number().optional().nullable(),
});

export type FinancialDashboardTopRevenueStream = z.infer<
	typeof FinancialDashboardTopRevenueStream
>;

export const FinancialDashboardTopExpenseCategory = z.object({
	category: z.string(),
	categoryDisplay: z.string().optional().nullable(),
	amount: z.number(),
	percentage: z.number(),
	transactionCount: z.number().optional().nullable(),
	averageExpenseValue: z.number().optional().nullable(),
	paidAmount: z.number().optional().nullable(),
	pendingAmount: z.number().optional().nullable(),
	overdueAmount: z.number().optional().nullable(),
});

export type FinancialDashboardTopExpenseCategory = z.infer<
	typeof FinancialDashboardTopExpenseCategory
>;

export const FinancialDashboardResponse = z.object({
	hotelId: z.string().optional().nullable(),
	startDate: z.string().optional().nullable(),
	endDate: z.string().optional().nullable(),
	period: z.string().optional().nullable(),
	totalRevenue: z.number(),
	totalExpenses: z.number(),
	netProfit: z.number(),
	netProfitMargin: z.number().optional().nullable(),
	cashBalance: z.number().optional().nullable(),
	revenueGrowth: z.number().optional().nullable(),
	expenseGrowth: z.number().optional().nullable(),
	profitGrowth: z.number().optional().nullable(),
	topRevenueStreams: z
		.array(FinancialDashboardTopRevenueStream)
		.optional()
		.nullable(),
	topExpenseCategories: z
		.array(FinancialDashboardTopExpenseCategory)
		.optional()
		.nullable(),
	totalOutstandingReceivables: z.number().optional().nullable(),
	totalOverduePayables: z.number().optional().nullable(),
	overdueExpendituresCount: z.number().optional().nullable(),
	totalCustomerTransactions: z.number().optional().nullable(),
	averageRevenuePerTransaction: z.number().optional().nullable(),
	occupancyRate: z.number().optional().nullable(),
	averageDailyRate: z.number().optional().nullable(),
	revenuePerAvailableRoom: z.number().optional().nullable(),
	financialAlerts: z.array(z.string()).optional().nullable(),
	trendData: z.array(FinancialDashboardTrendData).optional().nullable(),
});

export type FinancialDashboardResponse = z.infer<
	typeof FinancialDashboardResponse
>;

// Convenience aliases used by UI components
export type FinancialDashboardMetrics = Pick<
	FinancialDashboardResponse,
	| "totalRevenue"
	| "totalExpenses"
	| "netProfit"
	| "netProfitMargin"
	| "cashBalance"
	| "revenueGrowth"
	| "expenseGrowth"
	| "profitGrowth"
	| "occupancyRate"
	| "averageDailyRate"
	| "revenuePerAvailableRoom"
	| "totalOutstandingReceivables"
	| "totalOverduePayables"
	| "overdueExpendituresCount"
	| "topRevenueStreams"
	| "topExpenseCategories"
	| "financialAlerts"
>;

export type FinancialDashboardGraphData = FinancialDashboardTrendData;

export const OtherIncome = z.object({
	id: z.string(),
	description: z.string(),
	amount: z.number(),
	date: z.string(),
	category: z.string(),
	reference: z.string(),
	status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
	recordedBy: z.string(),
});

export type OtherIncome = z.infer<typeof OtherIncome>;

export const PaginatedOtherIncomeResponse = z.object({
	content: z.array(OtherIncome),
	pageable: z.any(),
	last: z.boolean(),
	totalPages: z.number(),
	totalElements: z.number(),
	size: z.number(),
	number: z.number(),
	sort: z.any(),
	first: z.boolean(),
	numberOfElements: z.number(),
	empty: z.boolean(),
});

export const Expenditure = z.object({
	id: z.string(),
	referenceNumber: z.string().optional().nullable(),
	title: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	amount: z.number(),
	category: z.string(),
	status: z.enum([
		"PENDING",
		"APPROVED",
		"PAID",
		"REJECTED",
		"OVERDUE",
		"CANCELLED",
	]),
	vendorName: z.string().optional().nullable(),
	invoiceNumber: z.string().optional().nullable(),
	expenseDate: z.string().optional().nullable(),
	dueDate: z.string().optional().nullable(),
	paidDate: z.string().optional().nullable(),
	createdAt: z.string().optional().nullable(),
	approvedBy: z.string().optional().nullable(),
});

export type Expenditure = z.infer<typeof Expenditure>;

export const PaginatedExpenditureResponse = z.object({
	content: z.array(Expenditure),
	pageable: z.any(),
	last: z.boolean(),
	totalPages: z.number(),
	totalElements: z.number(),
	size: z.number(),
	number: z.number(),
	sort: z.any(),
	first: z.boolean(),
	numberOfElements: z.number(),
	empty: z.boolean(),
});

export const ProfitAndLossStatement = z.object({
	revenue: z.array(z.object({ category: z.string(), amount: z.number() })),
	totalRevenue: z.number(),
	expenses: z.array(z.object({ category: z.string(), amount: z.number() })),
	totalExpenses: z.number(),
	netProfit: z.number(),
});

export type ProfitAndLossStatement = z.infer<typeof ProfitAndLossStatement>;

export const CashFlowActivity = z.object({
	category: z.string(),
	amount: z.number(),
});

export const CashFlowStatement = z.object({
	operatingActivities: z.array(CashFlowActivity),
	investingActivities: z.array(CashFlowActivity),
	financingActivities: z.array(CashFlowActivity),
	netCashFlow: z.number(),
	beginningCashBalance: z.number(),
	endingCashBalance: z.number(),
});

export type CashFlowStatement = z.infer<typeof CashFlowStatement>;

export const ComprehensiveSummaryData = z.object({
	totalRevenue: z.number(),
	totalExpenses: z.number(),
	grossProfit: z.number(),
	netProfit: z.number(),
	operatingCashFlow: z.number(),
	endingCashBalance: z.number(),
	occupancyRate: z.number(),
	revPAR: z.number(),
	adr: z.number(),
});

export type ComprehensiveSummaryData = z.infer<typeof ComprehensiveSummaryData>;

export const ConsumptionReport = z.object({
	period: z.string(),
	foodCost: z.number(),
	beverageCost: z.number(),
	otherCost: z.number(),
	totalConsumptionCost: z.number(),
	foodSales: z.number(),
	beverageSales: z.number(),
	otherSales: z.number(),
	totalRestaurantRevenue: z.number(),
	foodCostPercentage: z.number(),
	beverageCostPercentage: z.number(),
	overallCostPercentage: z.number(),
});

export type ConsumptionReport = z.infer<typeof ConsumptionReport>;

export const BookingFinancialDetails = z.object({
	charges: z
		.array(z.object({ description: z.string(), amount: z.number() }))
		.optional()
		.nullable(),
	totalCharges: z.number().optional().nullable(),
	payments: z
		.array(
			z.object({ method: z.string(), date: z.string(), amount: z.number() }),
		)
		.optional()
		.nullable(),
	totalPaid: z.number().optional().nullable(),
	balance: z.number().optional().nullable(),
});

export type BookingFinancialDetails = z.infer<typeof BookingFinancialDetails>;

// --- Routes ---

export const financialsRoutes = {
	"@get/api/financials/dashboard": {
		query: z
			.object({
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				period: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: FinancialDashboardResponse,
		}),
	},
	"@get/api/financials/other-income": {
		query: z
			.object({
				category: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
				pageable: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: PaginatedOtherIncomeResponse,
		}),
	},
	"@get/api/financials/other-income/:id": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject.extend({
			data: OtherIncome,
		}),
	},
	"@post/api/financials/other-income": {
		input: OtherIncome.omit({ id: true, status: true, recordedBy: true }),
		output: ApiResponseObject.extend({
			data: OtherIncome,
		}),
	},
	"@patch/api/financials/other-income/:id/status": {
		params: z.object({ id: z.string() }),
		input: z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]) }),
		output: ApiResponseObject.extend({
			data: OtherIncome,
		}),
	},
	"@get/api/financials/expenditures": {
		query: z
			.object({
				category: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
				pageable: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: PaginatedExpenditureResponse,
		}),
	},
	"@get/api/financials/expenditures/:id": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject.extend({
			data: Expenditure,
		}),
	},
	"@post/api/financials/expenditures": {
		input: Expenditure.omit({ id: true, status: true, approvedBy: true }),
		output: ApiResponseObject.extend({
			data: Expenditure,
		}),
	},
	"@patch/api/financials/expenditures/:id/status": {
		params: z.object({ id: z.string() }),
		query: z.object({
			status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"]),
		}),
		output: ApiResponseObject.extend({
			data: Expenditure,
		}),
	},
	"@get/api/financials/profit-and-loss": {
		query: z
			.object({
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				period: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: ProfitAndLossStatement,
		}),
	},
	"@get/api/financials/cash-flow": {
		query: z
			.object({
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				period: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: CashFlowStatement,
		}),
	},
	"@get/api/financials/expenses": {
		query: z
			.object({
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				period: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/compare": {
		query: z
			.object({
				period1Start: z.string().optional().nullable(),
				period1End: z.string().optional().nullable(),
				period2Start: z.string().optional().nullable(),
				period2End: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/expenditures/overdue": {
		output: ApiResponseObject.extend({
			data: PaginatedExpenditureResponse,
		}),
	},
	"@get/api/financials/items/consumption-report": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				itemType: z.string().optional().nullable(),
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: z.array(ConsumptionReport),
		}),
	},
	"@get/api/financials/monthly-summary": {
		output: ApiResponseObject,
	},
	"@get/api/financials/other-income/booking/:bookingId": {
		params: z.object({ bookingId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/financials/quarterly-summary": {
		output: ApiResponseObject,
	},
	"@get/api/financials/restaurant/daily-summary": {
		query: z
			.object({
				date: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/bookings/:bookingId/detailed": {
		params: z.object({ bookingId: z.string() }),
		output: ApiResponseObject.extend({
			data: BookingFinancialDetails,
		}),
	},
	"@get/api/financials/restaurant/daily-summary/paginated": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				destination: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/restaurant/detailed-report": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/restaurant/item-sales-detail": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/restaurant/room-food-sales": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/revenue": {
		query: z
			.object({
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				period: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: z.object({
				totalRevenue: z.number(),
				totalReceivedRevenue: z.number().optional().nullable(),
				totalPendingRevenue: z.number().optional().nullable(),
				roomBookingsRevenue: z.number(),
				restaurantRevenue: z.number(),
				laundryRevenue: z.number(),
				rentalsRevenue: z.number(),
				otherIncomeRevenue: z.number(),
				revenueGrowthPercentage: z.number().optional().nullable(),
				averageDailyRevenue: z.number().optional().nullable(),
				revenueBySource: z
					.array(
						z.object({
							source: z.string(),
							amount: z.number(),
							paidAmount: z.number().optional().nullable(),
							pendingAmount: z.number().optional().nullable(),
							transactionCount: z.number(),
							percentage: z.number(),
						}),
					)
					.optional()
					.nullable(),
			}),
		}),
	},
	"@get/api/financials/summary/comprehensive": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: ComprehensiveSummaryData,
		}),
	},
	"@get/api/financials/this-week": {
		output: ApiResponseObject,
	},
	"@get/api/financials/today": {
		output: ApiResponseObject,
	},
	"@get/api/financials/yearly-summary": {
		output: ApiResponseObject,
	},
};

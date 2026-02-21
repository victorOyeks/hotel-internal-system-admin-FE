# Feature: Financial Reports

**Goal**: Provide in-depth financial analysis.

## Route
`src/app/(dashboard)/financials/reports/page.tsx` (and sub-routes if needed)

## API Requirements
-   P&L: `@get/api/financials/profit-and-loss`
-   Cash Flow: `@get/api/financials/cash-flow`
-   Comparison: `@get/api/financials/compare`
-   Consumption: `@get/api/financials/items/consumption-report`
-   Consumption: `@get/api/financials/items/consumption-report`
-   Period Summaries: `@get/api/financials/monthly-summary`, `@get/api/financials/quarterly-summary`, `@get/api/financials/yearly-summary`, `@get/api/financials/this-week`, `@get/api/financials/today`
-   Comprehensive: `@get/api/financials/summary/comprehensive`, `@get/api/financials/revenue`

## Components Needed
1.  **ProfitLossStatement**: Structured view of Revenue vs Expenses items.
2.  **CashFlowStatement**: Breakdown of Operating, Investing, and Financing activities.
3.  **ReportFilters**: Date range, Period (Monthly/Quarterly/Yearly).
4.  **ConsumptionTable**: Table showing item usage and cost.
5.  **PeriodSummaryCard**: Quick view of Monthly/Quarterly performance.

## Implementation Steps
1.  [ ] Verify/Create report actions in `financials-actions.ts`.
2.  [ ] Create `profit-loss-statement.tsx`.
3.  [ ] Create `cash-flow-statement.tsx`.
4.  [ ] Implement generic `ReportPage` layout with filters.

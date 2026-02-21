# Feature: Financials Dashboard

**Goal**: Create a high-level overview of the hotel's financial health.

## Route
`src/app/(dashboard)/financials/page.tsx`

## API Requirements
-   Endpoint: `@get/api/financials/dashboard`
-   Schema: `FinancialDashboardResponse`
    -   `metrics`: `FinancialDashboardMetrics` (Total Revenue, Expenses, Net Profit, etc.)
    -   `graphData`: `FinancialDashboardGraphData[]` (Period, Revenue, Expenses, Profit)

## Components Needed
1.  **StatsCards**: Display distinct metrics with trend indicators (if available) or simple values.
    -   *Design*: Colorful, glassmorphism or clean cards.
2.  **FinancialChart**: A composed chart (Line + Bar) showing Revenue vs Expenses vs Profit over time.
    -   *Lib*: `recharts`
3.  **DateFilter**: A global date range picker for the dashboard.
    -   *Lib*: `nuqs` for URL state sync.

## Implementation Steps
1.  [ ] Verify `getFinancialDashboard` action in `financials-actions.ts`.
2.  [ ] Create `metrics-cards.tsx` component.
3.  [ ] Create `financial-overview-chart.tsx` component.
4.  [ ] Assemble components in `page.tsx`.

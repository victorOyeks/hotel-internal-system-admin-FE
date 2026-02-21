# Financials Module Implementation Master Plan

This document outlines the plan to implement the Financials Module in `src/app/(dashboard)/financials` based on the API routes defined in `src/lib/api-routes/financials.ts`.

## Features Breakdown

We will implement the module feature by feature. Detailed plans for each feature are located in this directory.

1.  **Dashboard** (`dashboard.md`)
    -   Route: `/financials` (or `/financials/dashboard`)
    -   Components: Metric Cards, Revenue vs Expenses Graph, Recent Activity.
    -   API: `@get/api/financials/dashboard`

2.  **Other Income** (`other-income.md`)
    -   Route: `/financials/other-income`
    -   Components: List Table (Paginated), Create Modal, Edit Modal, Status Management (Approve/Reject).
    -   API: `@get/api/financials/other-income`, `@post...`, `@patch.../status`

3.  **Expenditures** (`expenditures.md`)
    -   Route: `/financials/expenditures`
    -   Components: List Table (Paginated), Create Modal (with Invoice #), Edit Modal, Status Management (Approve/Pay/Reject).
    -   API: `@get/api/financials/expenditures`, `@post...`, `@patch.../status`

4.  **Reports** (`reports.md`)
    -   Route: `/financials/reports`
    -   Sub-pages/Tabs:
        -   Profit & Loss (`profit-and-loss`)
        -   Cash Flow (`cash-flow`)
        -   Consumption Report (`consumption`)
        -   Comparisons (`compare`)
    -   API: `@get/api/financials/profit-and-loss`, `@get/api/financials/cash-flow`, etc.

5.  **Integrations** (`integrations.md`)
    -   Displaying financial data from other modules (Restaurant, Front Desk) within the Financials context.
    -   API: `@get/api/financials/restaurant/*`, `@get/api/front-desks/*` (Exports).

## Strategy

1.  **Define Server Actions**: Ensure `src/lib/financials-actions.ts` covers all endpoints in `src/lib/api-routes/financials.ts`.
2.  **Scaffold Routes**: Create `page.tsx` for each section.
3.  **Build Components**: Create UI components in `src/components/roles/financials/`.
4.  **Integrate**: Connect Server Actions to UI Components using `useQuery` or direct Server Component data fetching.
5.  **Refine**: Apply "Premium/Rich Aesthetics" as requested.

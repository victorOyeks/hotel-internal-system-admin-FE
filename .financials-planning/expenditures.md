# Feature: Expenditures

**Goal**: Track and manage hotel expenses.

## Route
`src/app/(dashboard)/financials/expenditures/page.tsx`

## API Requirements
-   List: `@get/api/financials/expenditures` (Paginated)
-   Detail: `@get/api/financials/expenditures/:id`
-   Create: `@post/api/financials/expenditures`
-   Update Status: `@patch/api/financials/expenditures/:id/status`
-   Overdue: `@get/api/financials/expenditures/overdue`

## Components Needed
1.  **ExpenditureTable**: DataTable with columns: Date, Vendor, Description, Category, Amount, Invoice #, Status.
2.  **ExpenditureForm**: Form for recording expenses.
    -   Fields: Vendor, Invoice #, Amount, Date, Category, Description.
3.  **ExpenditureStatusAction**: UI to transition status (Pending -> Approved -> Paid).
4.  **OverdueAlerts**: Widget or filtered view to show unpaid expenses past due date.

## Implementation Steps
1.  [ ] Verify/Create actions: `getExpenditures`, `createExpenditure`, `updateExpenditureStatus`.
2.  [ ] Create `expenditure-table.tsx`.
3.  [ ] Create `expenditure-form-modal.tsx`.
4.  [ ] Assemble in `page.tsx`.

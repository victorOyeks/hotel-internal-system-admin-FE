# Feature: Other Income

**Goal**: Manage miscellaneous income sources.

## Route
`src/app/(dashboard)/financials/other-income/page.tsx`

## API Requirements
-   List: `@get/api/financials/other-income` (Paginated)
-   Detail: `@get/api/financials/other-income/:id`
-   Create: `@post/api/financials/other-income`
-   Update Status: `@patch/api/financials/other-income/:id/status`

## Components Needed
1.  **OtherIncomeTable**: DataTable with columns: Date, Description, Category, Amount, Status, Recorded By.
    -   *Actions*: View Details, Approve/Reject (if authorized).
2.  **OtherIncomeForm**: Form for creating new income entries.
    -   Fields: Description, Amount, Date, Category, Reference.
    -   *Validation*: Zod schema.
3.  **StatusBadge**: Visual indicator for PENDING/APPROVED/REJECTED.

## Implementation Steps
1.  [ ] Verify/Create actions: `getOtherIncome`, `createOtherIncome`, `updateOtherIncomeStatus`.
2.  [ ] Create `other-income-table.tsx`.
3.  [ ] Create `other-income-form-modal.tsx`.
4.  [ ] Assemble in `page.tsx`.

# Feature: Financial Integrations

**Goal**: Seamlessly display financial data from other operational modules (Bookings, Restaurant) within the Financials context.

## Route
These are primarily used as components within other pages or as specific sub-views, rather than standalone top-level pages.

## API Requirements
1.  **Restaurant Integration**:
    -   Endpoint: `@get/api/financials/restaurant/daily-summary` (plus detailed/paginated variants)
    -   Endpoint: `@get/api/financials/restaurant/room-food-sales`
    -   Endpoint: `@get/api/financials/restaurant/item-sales-detail`
    -   Usage: Widget on Dashboard or separate "Restaurant Financials" tab.
    
2.  **Booking Integration**:
    -   Endpoint: `@get/api/financials/bookings/:bookingId/detailed`
    -   Endpoint: `@get/api/financials/other-income/booking/:bookingId`
    -   Usage: Modal or slide-over when clicking a generic "Reference" in income/revenue reports, or a dedicated "Booking Lookup" tool.

## Components Needed
1.  **RestaurantDailySummaryCard**: Shows daily POS revenue, breaks, etc.
2.  **BookingFinancialDetailModal**: Shows breakdown of room charges, add-ons, payments, and outstanding balance for a specific booking.
3.  **RestaurantDetailedReport**: A dedicated view/modal for deep-diving into restaurant performance.
4.  **RoomFoodSalesTable**: Specific report for food charged to rooms.

## Implementation Steps
1.  [ ] Verify actions in `financials-actions.ts`.
2.  [ ] Create `restaurant-summary-card.tsx`.
3.  [ ] Create `booking-financial-modal.tsx`.
4.  [ ] Create `restaurant-detailed-reports.tsx`.
5.  [ ] Integrate `RestaurantSummary` into the main `Dashboard` page (optional) or `Reports` page.

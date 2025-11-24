# User Stories

## Hotel Rental Management System

**Version:** 1.0
**Date:** 2025-11-22
**Module:** Rental Management

---

## Epic 1: Rental Item Inventory Management

### Story 1.1: Create Rental Items

**As a** Rental Manager
**I want to** create rental items with pricing tiers and stock levels
**So that** guests can rent items from our inventory

**Acceptance Criteria:**

- Given I am on the rental items page
- When I click "Add New Rental Item"
- And I enter item details (name, description, category)
- And I set pricing for different durations (hourly, daily, weekly, monthly)
- And I set deposit amount and replacement cost
- And I enter total quantity available
- And I set minimum and maximum rental duration
- And I click "Save"
- Then the item is created with available quantity = total quantity
- And I receive a confirmation message
- And the item appears in the active items list

**Priority:** High
**Story Points:** 5

---

### Story 1.2: Track Item Availability

**As a** Front Desk Staff
**I want to** see real-time availability of rental items
**So that** I can tell guests what's available right now

**Acceptance Criteria:**

- Given I am viewing rental items
- When I check an item's availability
- Then I see:
  - Total quantity owned
  - Currently rented out count
  - Available for rent count
  - List of active rentals for this item
- And availability updates in real-time
- And items show as unavailable when stock is zero

**Priority:** High
**Story Points:** 3

---

### Story 1.3: Configure Flexible Pricing

**As a** Rental Manager
**I want to** set different rates for hourly, daily, weekly, and monthly rentals
**So that** we can offer flexible pricing based on rental duration

**Acceptance Criteria:**

- Given I am creating/editing a rental item
- When I set pricing
- Then I can enter:
  - Hourly rate (for short-term rentals)
  - Daily rate (for 1-6 day rentals)
  - Weekly rate (for 7-29 day rentals)
  - Monthly rate (for 30+ day rentals)
- And the system automatically selects the best rate based on duration
- And all rates are optional (some items may be daily-only)

**Priority:** High
**Story Points:** 3

---

### Story 1.4: Set Security Deposits

**As a** Rental Manager
**I want to** require deposits for rental items
**So that** we're protected against damage or loss

**Acceptance Criteria:**

- Given I am creating a rental item
- When I set the deposit amount
- Then this deposit is collected with every rental
- And the deposit is held separately from rental fees
- And the deposit is refundable upon safe return
- And I can set different deposit amounts per item

**Priority:** High
**Story Points:** 2

---

### Story 1.5: View Available Items Only

**As a** Guest Services Staff
**I want to** filter to show only items currently available
**So that** I don't offer items that are out of stock

**Acceptance Criteria:**

- Given I am browsing rental items
- When I select "Show Available Only"
- Then I see only items with available quantity > 0
- And out-of-stock items are hidden
- And I can see when items will become available

**Priority:** Medium
**Story Points:** 2

---

## Epic 2: Rental Order Management

### Story 2.1: Create Rental Order

**As a** Front Desk Staff
**I want to** create a rental order for a guest
**So that** they can rent items during their stay

**Acceptance Criteria:**

- Given a guest wants to rent items
- When I create a new rental order
- And I enter customer details (name, phone, ID document)
- And I link to their booking (if applicable)
- And I select items with quantities
- And I set rental start and end dates/times
- And I click "Create Order"
- Then a unique order number is generated (RNT-YYYYMMDD-XXXX)
- And rental fees are calculated based on duration
- And deposits are calculated
- And the total includes rental fees + deposits + tax
- And stock is reserved immediately
- And order status is set to PENDING
- And I receive order confirmation

**Priority:** Critical
**Story Points:** 8

---

### Story 2.2: Auto-Calculate Rental Duration

**As a** Front Desk Staff
**I want to** the system to automatically calculate rental fees based on duration
**So that** pricing is accurate and consistent

**Acceptance Criteria:**

- Given I am creating a rental order
- When I select start and end dates
- Then the system calculates duration in hours
- And automatically selects the best rate:
  - < 24 hours: use hourly rate
  - 1-6 days: use daily rate
  - 7-29 days: use weekly rate
  - 30+ days: use monthly rate
- And displays the calculation breakdown
- And applies this to each item

**Priority:** High
**Story Points:** 5

---

### Story 2.3: Reserve Stock on Order Creation

**As a** Rental Manager
**I want to** stock to be reserved when an order is created
**So that** we don't overbook rental items

**Acceptance Criteria:**

- Given I create a rental order
- When the order is saved
- Then available quantity decreases immediately
- And the items are reserved for this order
- And other staff cannot rent reserved items
- And if insufficient stock, order creation fails with clear message
- And stock is released if order is cancelled

**Priority:** Critical
**Story Points:** 5

---

### Story 2.4: Link Rental to Guest Booking

**As a** Front Desk Staff
**I want to** link rental orders to guest bookings
**So that** charges can be added to room bills

**Acceptance Criteria:**

- Given a guest has an active booking
- When I create a rental order
- And I select their booking
- Then customer details auto-populate
- And room number is filled automatically
- And the rental appears on their booking charges
- And payments can be settled with checkout

**Priority:** High
**Story Points:** 5

---

### Story 2.5: Collect Customer Identification

**As a** Security Staff
**I want to** record customer ID information for rentals
**So that** we have documentation in case of issues

**Acceptance Criteria:**

- Given I am creating a rental order
- When I enter customer details
- Then I must record:
  - ID document type (passport, driver's license, national ID)
  - ID document number
  - Customer name matching ID
  - Contact phone number
- And this information is stored securely
- And I can retrieve it later if needed

**Priority:** Medium
**Story Points:** 3

---

### Story 2.6: Start Active Rental

**As a** Rental Staff
**I want to** mark an order as active when items are picked up
**So that** we track what's currently rented out

**Acceptance Criteria:**

- Given I have a PENDING rental order
- When the customer picks up the items
- And I change status to ACTIVE
- Then the actual start time is recorded
- And the expected return date is confirmed
- And the order shows in "Currently Rented" list
- And customer is given rental agreement/receipt

**Priority:** High
**Story Points:** 3

---

### Story 2.7: Process Rental Return

**As a** Rental Staff
**I want to** record when rental items are returned
**So that** I can release inventory and process final payment

**Acceptance Criteria:**

- Given I have an ACTIVE rental
- When the customer returns all items
- And I inspect items for damage
- And I change status to COMPLETED
- Then actual return time is recorded
- And stock is released (available quantity increases)
- And late fees are calculated if overdue
- And damage fees are assessed if applicable
- And final payment is settled
- And deposit is refunded if no outstanding charges

**Priority:** Critical
**Story Points:** 8

---

### Story 2.8: Extend Rental Period

**As a** Front Desk Staff
**I want to** extend a rental period at customer request
**So that** guests can keep items longer

**Acceptance Criteria:**

- Given I have an ACTIVE rental
- When the customer requests an extension
- And I enter the new return date
- Then the system calculates additional charges
- And updates the expected return date
- And adds extension fee to the order
- And I can collect payment for extension
- And if the rental was overdue, it clears overdue status
- And stock remains reserved

**Priority:** High
**Story Points:** 5

---

### Story 2.9: Identify Overdue Rentals

**As a** Rental Manager
**I want to** automatically identify overdue rentals
**So that** I can follow up with customers

**Acceptance Criteria:**

- Given rentals have expected return dates
- When a rental passes its return date/time
- Then status automatically changes to OVERDUE
- And it appears in overdue rentals list
- And late fees start calculating
- And I can see how many days overdue
- And I can contact the customer

**Priority:** High
**Story Points:** 5

---

### Story 2.10: Search and Filter Rentals

**As a** Front Desk Staff
**I want to** search for rentals using multiple criteria
**So that** I can quickly find specific orders

**Acceptance Criteria:**

- Given I am on the rentals page
- When I search by:
  - Customer name, phone, or ID number
  - Room number
  - Order number
  - Order status (PENDING, ACTIVE, COMPLETED, OVERDUE, CANCELLED)
  - Payment status
  - Date range
- Then I see only matching results
- And results are paginated
- And I can sort by date, status, or amount

**Priority:** High
**Story Points:** 5

---

### Story 2.11: View Rentals by Room

**As a** Front Desk Staff
**I want to** see all rentals for a specific room
**So that** I can quickly answer guest inquiries

**Acceptance Criteria:**

- Given a guest calls from their room
- When I search by room number
- Then I see all rental orders for that room
- Including current active rentals
- And historical completed rentals
- And I can see rental details and return dates

**Priority:** Medium
**Story Points:** 3

---

## Epic 3: Deposit and Payment Management

### Story 3.1: Collect Deposit on Rental

**As a** Cashier
**I want to** collect security deposits separately from rental fees
**So that** we have funds to cover potential damage

**Acceptance Criteria:**

- Given I am processing a rental order
- When I collect payment
- Then I can record deposit payment separately
- And deposit amount is tracked independently
- And deposit is marked as "held"
- And I provide deposit receipt
- And deposit doesn't count as revenue

**Priority:** Critical
**Story Points:** 5

---

### Story 3.2: Collect Rental Fees

**As a** Cashier
**I want to** collect rental fees upfront or on return
**So that** we get paid for the rental

**Acceptance Criteria:**

- Given I have a rental order
- When I collect rental fee payment
- Then payment is recorded as RENTAL_FEE type
- And it counts toward rental charges
- And payment status updates based on amount paid
- And I can accept partial payments
- And receipt is generated

**Priority:** Critical
**Story Points:** 5

---

### Story 3.3: Assess Damage Charges

**As a** Rental Staff
**I want to** charge for item damage
**So that** repair/replacement costs are covered

**Acceptance Criteria:**

- Given items are returned damaged
- When I assess the damage
- And I enter damage description and cost
- Then damage fee is added to the order
- And it must be paid before deposit refund
- And damage fee can be deducted from deposit
- And additional payment collected if exceeds deposit
- And damage is documented with notes

**Priority:** High
**Story Points:** 5

---

### Story 3.4: Calculate Late Fees

**As a** System
**I want to** automatically calculate late fees for overdue rentals
**So that** late returns are penalized consistently

**Acceptance Criteria:**

- Given a rental is overdue
- When late fee calculation runs (daily)
- Then late fees are calculated based on:
  - Number of days overdue
  - Daily late fee rate
  - Item rental rate
- And late fees are added to the order
- And customer is notified of charges
- And late fees must be paid before deposit refund

**Priority:** High
**Story Points:** 5

---

### Story 3.5: Refund Security Deposit

**As a** Cashier
**I want to** refund deposits when items are returned undamaged
**So that** customers get their money back

**Acceptance Criteria:**

- Given a rental is completed
- And all fees are paid (rental, late, damage)
- And items are returned in good condition
- When I process deposit refund
- Then refund amount = deposit - any applied charges
- And refund payment is recorded
- And payment status shows REFUNDED
- And customer receives refund receipt
- But I cannot refund if outstanding charges exist

**Priority:** High
**Story Points:** 5

---

### Story 3.6: Handle Multiple Payment Types

**As a** Cashier
**I want to** accept different payment methods
**So that** customers have payment flexibility

**Acceptance Criteria:**

- Given I am recording a payment
- When I select payment method
- Then I can choose from:
  - Cash
  - Credit/Debit Card
  - Mobile Money
  - Bank Transfer
  - Hotel Wallet/Credit
- And payment reference can be entered
- And method is recorded with payment
- And receipts show payment method

**Priority:** Medium
**Story Points:** 3

---

### Story 3.7: View Payment Summary

**As a** Staff Member
**I want to** see a complete payment breakdown for a rental
**So that** I understand all charges and payments

**Acceptance Criteria:**

- Given I am viewing a rental order
- When I check payment summary
- Then I see:
  - Deposit amount and status
  - Rental fee total
  - Extension fees (if any)
  - Late fees (if any)
  - Damage fees (if any)
  - Total charges
  - Total paid
  - Outstanding balance
  - Refundable deposit amount
  - Payment history with dates
- And all amounts are clearly labeled

**Priority:** High
**Story Points:** 3

---

### Story 3.8: Track Payment History

**As a** Accountant
**I want to** view all payments made on a rental
**So that** I can audit payment records

**Acceptance Criteria:**

- Given a rental has multiple payments
- When I view payment history
- Then I see all payments listed:
  - Payment date and time
  - Payment type (deposit, rental, damage, late, refund)
  - Amount
  - Payment method
  - Reference number
  - Staff who processed
  - Running balance
- And payments are sorted chronologically
- And payment types are color-coded

**Priority:** Medium
**Story Points:** 3

---

## Epic 4: Dashboard and Operations

### Story 4.1: View Rental Dashboard

**As a** Rental Manager
**I want to** see key metrics about rental operations
**So that** I can monitor performance and make decisions

**Acceptance Criteria:**

- Given I access the rental dashboard
- Then I see:
  - Total active rental items
  - Total orders (all time)
  - Active rentals count
  - Overdue rentals count
  - Completed rentals count
  - Total revenue generated
  - Outstanding payments amount
  - Total deposits held
  - Orders created today
  - Revenue today
  - Items currently rented out
- And all metrics are specific to my hotel
- And data is current/real-time

**Priority:** High
**Story Points:** 5

---

### Story 4.2: Monitor Overdue Rentals

**As a** Rental Manager
**I want to** see all overdue rentals in one place
**So that** I can follow up on late returns

**Acceptance Criteria:**

- Given I am on the dashboard
- When I view overdue rentals section
- Then I see list of all overdue orders
- With details:
  - Customer name and contact
  - Items rented
  - Days overdue
  - Late fees accumulated
  - Last contact date
- And I can click to see full order details
- And I can contact customer directly
- And list is sorted by most overdue first

**Priority:** High
**Story Points:** 5

---

### Story 4.3: Track Inventory Utilization

**As a** Rental Manager
**I want to** see how well our rental inventory is being used
**So that** I can make purchasing decisions

**Acceptance Criteria:**

- Given I am on the dashboard
- When I view utilization metrics
- Then I see:
  - Overall utilization rate (rented/total)
  - Utilization per item category
  - Most frequently rented items
  - Least rented items
  - Average rental duration
  - Peak rental periods
- And I can identify items to add or retire

**Priority:** Medium
**Story Points:** 5

---

### Story 4.4: View Today's Activity

**As a** Rental Manager
**I want to** see today's rental activity
**So that** I can track daily performance

**Acceptance Criteria:**

- Given I check the dashboard daily
- When I view today's metrics
- Then I see:
  - Orders created today
  - Rentals started today (picked up)
  - Rentals returned today
  - Revenue collected today
  - Deposits collected today
  - Deposits refunded today
- And amounts are in hotel currency
- And counts are accurate as of now

**Priority:** Medium
**Story Points:** 3

---

## Epic 5: Special Scenarios and Features

### Story 5.1: Handle Item Unavailability

**As a** Front Desk Staff
**I want to** see clear messages when items are unavailable
**So that** I can offer alternatives to guests

**Acceptance Criteria:**

- Given I am creating a rental order
- When I try to add an item that's out of stock
- Then I see clear error message
- And I'm told how many are available vs requested
- And I'm shown when items will become available
- And I can see items on waitlist
- And I can suggest alternative items

**Priority:** Medium
**Story Points:** 3

---

### Story 5.2: Cancel Rental Order

**As a** Front Desk Supervisor
**I want to** cancel rental orders
**So that** I can handle customer cancellations

**Acceptance Criteria:**

- Given I have a rental order to cancel
- When I change status to CANCELLED
- And I provide cancellation reason
- Then stock is released immediately
- And if deposit was collected, it's refunded
- And if rental fees were paid, refund policy applies
- And order is marked cancelled but preserved
- And cancellation is recorded in order history

**Priority:** Medium
**Story Points:** 5

---

### Story 5.3: Handle Walk-in Rentals

**As a** Front Desk Staff
**I want to** create rentals for non-hotel guests
**So that** we can serve external customers

**Acceptance Criteria:**

- Given a walk-in customer wants to rent
- When I create the rental order
- Then booking ID is optional
- And room identifier is optional
- But customer name, phone, and ID are required
- And all other rental processes work normally
- And payment must be collected upfront (deposit + rental)

**Priority:** Medium
**Story Points:** 2

---

### Story 5.4: Set Rental Duration Constraints

**As a** Rental Manager
**I want to** set minimum and maximum rental durations per item
**So that** items are rented appropriately

**Acceptance Criteria:**

- Given I am creating/editing a rental item
- When I set duration constraints
- Then I can specify:
  - Minimum rental duration (e.g., 2 hours minimum)
  - Maximum rental duration (e.g., 7 days maximum)
- And system enforces these when creating orders
- And orders outside constraints are rejected
- And clear error message explains why

**Priority:** Low
**Story Points:** 3

---

### Story 5.5: Document Item Condition

**As a** Rental Staff
**I want to** note item condition at pickup and return
**So that** damage disputes are avoided

**Acceptance Criteria:**

- Given I am processing a rental pickup
- When I hand over items
- Then I can note item condition
- And customer sees and acknowledges condition
- And when items are returned
- I can compare return condition to pickup condition
- And any differences are documented
- And photos can be attached (future enhancement)

**Priority:** Low
**Story Points:** 3

---

### Story 5.6: Generate Rental Agreement

**As a** Front Desk Staff
**I want to** generate a rental agreement document
**So that** customers sign terms and conditions

**Acceptance Criteria:**

- Given I have created a rental order
- When I print rental agreement
- Then document includes:
  - Customer details and ID
  - Items rented with serial numbers
  - Rental period and fees
  - Deposit amount
  - Terms and conditions
  - Damage and late fee policies
  - Signature fields
- And customer signs before pickup
- And copy is kept with order

**Priority:** Low
**Story Points:** 5

---

## Definition of Done

For all user stories:

1. Code is written and follows project standards
2. Unit tests are written and passing
3. Stock concurrency is handled correctly
4. API endpoints are documented in Swagger
5. Integration tests pass
6. Code is reviewed and approved
7. API is tested with Postman/similar tool
8. No critical or high-priority bugs
9. Acceptance criteria are met and verified
10. User documentation is updated

---

## Story Prioritization

### Must Have (MVP)

- Create rental items with stock management
- Real-time availability tracking
- Create rental orders with stock reservation
- Process rental returns
- Collect deposits and rental fees
- Basic payment tracking
- View overdue rentals

### Should Have

- Extend rental periods
- Calculate late fees automatically
- Damage fee assessment
- Deposit refunds
- Dashboard statistics
- Advanced search and filtering
- Link to bookings

### Could Have

- Walk-in customer rentals
- Duration constraints
- Item condition documentation
- Utilization metrics
- Rental agreements

### Won't Have (Future)

- Online booking portal
- Mobile app
- Photo documentation
- Barcode/QR tracking
- SMS notifications
- Maintenance scheduling

---

## Technical Considerations

### Concurrency Control

- Stock reservation must be atomic
- Prevent race conditions on availability
- Handle simultaneous order creation
- Use database transactions

### Data Integrity

- Ensure available quantity = total - rented
- Validate stock levels before reservation
- Audit all stock changes
- Track reservation history

### Payment Accuracy

- Separate deposit accounting
- Accurate fee calculations
- Handle refund scenarios
- Payment reconciliation

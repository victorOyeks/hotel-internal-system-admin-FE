# Functional Requirements Document (FRD)

## Hotel Rental Management System

**Version:** 1.0
**Date:** 2025-11-22
**Module:** Rental Management

---

## 1. Executive Summary

The Hotel Rental Management System is a comprehensive solution designed to manage the rental of hotel items and equipment to guests and external customers. The system handles rental item inventory, order processing, return management, payment tracking including deposits and penalties, and provides real-time operational analytics.

---

## 2. System Overview

### 2.1 Purpose

To provide hotel staff with an efficient system to:

- Manage rental inventory (bikes, sports equipment, electronics, etc.)
- Process rental orders with flexible duration
- Track item availability and stock levels
- Handle deposits, rental fees, damage charges, and late penalties
- Monitor overdue rentals
- Generate operational insights through dashboard analytics

### 2.2 Scope

The system covers:

- Rental item master data with stock management
- Rental order lifecycle from booking to return
- Deposit and payment processing
- Extension of rental periods
- Damage assessment and penalty charges
- Real-time availability tracking
- Integration with booking and room management

---

## 3. Functional Requirements

### 3.1 Rental Item Management

#### 3.1.1 Create Rental Item

**Requirement ID:** RNT-FR-001
**Priority:** High

**Description:**
The system shall allow authorized users to create new rental items in the inventory.

**Input:**

- Item name (required)
- Description
- Category (SPORTS_EQUIPMENT, ELECTRONICS, VEHICLES, RECREATION, CONFERENCE_EQUIPMENT, BABY_ITEMS, MOBILITY_AIDS, OTHER)
- Pricing structure:
  - Hourly rate
  - Daily rate
  - Weekly rate
  - Monthly rate
- Deposit amount (required)
- Total quantity/stock available
- Available quantity (auto-calculated)
- Minimum rental duration (hours)
- Maximum rental duration (hours)
- Replacement cost
- Special instructions
- Active status

**Processing:**

- Validate item name uniqueness per hotel
- Set item as active by default
- Initialize available quantity = total quantity
- Auto-generate item ID
- Associate with current hotel from authenticated user context

**Output:**

- Rental item created successfully
- Return complete item details including ID and stock levels

#### 3.1.2 Update Rental Item

**Requirement ID:** RNT-FR-002
**Priority:** High

**Description:**
The system shall allow authorized users to update existing rental items.

**Input:**

- Item ID (required)
- Updated item details

**Processing:**

- Validate item exists and belongs to user's hotel
- Update item details
- If total quantity changed, recalculate available quantity:
  - Available = Total - Currently Rented
- Prevent reducing stock below currently rented amount

**Business Rules:**

- Cannot reduce total quantity below currently rented count
- Price changes don't affect existing active rentals
- Can update deposit amount for future rentals

**Output:**

- Updated item details
- Confirmation message

#### 3.1.3 Retrieve Rental Items

**Requirement ID:** RNT-FR-003
**Priority:** High

**Description:**
The system shall provide various methods to retrieve rental items.

**Retrieval Methods:**

1. **Get All Items**

   - Optional filter: Active only
   - Return sorted by name
   - Include stock availability

2. **Get Available Items**

   - Return only items with available quantity > 0
   - Only active items
   - Real-time availability

3. **Get by Category**

   - Filter by specific category
   - Show stock levels
   - Only active items

4. **Get by ID**
   - Retrieve single item details
   - Include availability status
   - Validate hotel ownership

**Output:**

- List of rental items or single item
- Complete details including:
  - Pricing for all durations
  - Current stock levels
  - Availability status

#### 3.1.4 Deactivate Rental Item

**Requirement ID:** RNT-FR-004
**Priority:** Medium

**Description:**
The system shall support soft deletion of rental items.

**Input:**

- Item ID

**Processing:**

- Mark item as inactive
- Cannot deactivate if items currently rented out
- Preserve item in database for historical orders

**Output:**

- Success confirmation
- Item no longer available for new rentals

---

### 3.2 Rental Order Management

#### 3.2.1 Create Rental Order

**Requirement ID:** RNT-FR-005
**Priority:** Critical

**Description:**
The system shall allow staff to create rental orders for guests.

**Input:**

- Booking ID (optional - for hotel guests)
- Customer name (required)
- Customer phone (required)
- Customer ID document type and number
- Room identifier (optional)
- Rental start date and time
- Rental end date and time
- Order items array:
  - Rental item ID
  - Quantity
  - Special notes (optional)
- Order notes (optional)

**Processing:**

1. Generate unique order number (format: RNT-YYYYMMDD-XXXX)
2. Validate rental items exist, are active, and have sufficient stock
3. Calculate rental duration in hours
4. Determine applicable rate (hourly, daily, weekly, monthly):
   - < 24 hours: hourly rate
   - 1-6 days: daily rate
   - 7-29 days: weekly rate
   - 30+ days: monthly rate
5. Calculate pricing per item:
   - Rental fee based on duration
   - Deposit amount
   - Line total = rental fee + deposit
6. Calculate order totals:
   - Subtotal (sum of rental fees)
   - Total deposit
   - Tax amount
   - Grand total
7. Set initial status to PENDING
8. Set payment status to UNPAID
9. Reserve stock (reduce available quantity)
10. Calculate expected return date

**Business Rules:**

- Order number must be unique
- Minimum one item required
- Customer name and phone mandatory
- Cannot rent more than available quantity
- Rental duration must be within item's min/max constraints
- Stock reservation is immediate

**Output:**

- Complete order details
- Order number
- Total breakdown (rental fee, deposits, tax)
- Expected return date
- Items reserved from inventory

#### 3.2.2 Search Rental Orders

**Requirement ID:** RNT-FR-006
**Priority:** High

**Description:**
The system shall provide comprehensive search and filtering for rental orders.

**Search Parameters:**

- Order status (PENDING, ACTIVE, COMPLETED, CANCELLED, OVERDUE)
- Payment status (UNPAID, PARTIALLY_PAID, PAID, REFUNDED, PENDING_REFUND)
- Search text (customer name, room, order number, ID document)
- Date range (start and end date)
- Pagination support

**Processing:**

- Filter orders by hotel
- Apply all provided filters
- Support partial text matching
- Sort by creation date (descending)
- Return paginated results

**Output:**

- Page of order summaries
- Each summary includes:
  - Order ID and number
  - Customer details
  - Rental period
  - Status
  - Payment status
  - Total amount
  - Outstanding balance
  - Items rented

#### 3.2.3 Retrieve Order Details

**Requirement ID:** RNT-FR-007
**Priority:** High

**Description:**
The system shall provide detailed information for a specific rental order.

**Input:**

- Order ID

**Processing:**

- Validate order exists and belongs to user's hotel
- Retrieve complete order details
- Calculate current status (check if overdue)

**Output:**

- Complete order information:
  - Order header (number, dates, customer info)
  - Order items with pricing breakdown
  - Status information
  - Payment summary (deposits, fees, penalties)
  - Return status
  - Damage assessment (if applicable)
  - Notes and special instructions

#### 3.2.4 Update Order Status

**Requirement ID:** RNT-FR-008
**Priority:** High

**Description:**
The system shall allow updating order status through the workflow.

**Input:**

- Order ID
- New status
- Status notes (optional)

**Status Workflow:**

```
PENDING → ACTIVE → COMPLETED
         ↓
      CANCELLED (from PENDING or ACTIVE)

Auto: ACTIVE → OVERDUE (if past return date)
```

**Processing:**

- Validate status transition is allowed
- When changing to ACTIVE:
  - Record actual rental start time
  - Confirm stock is reserved
- When changing to COMPLETED:
  - Record actual return time
  - Release stock (increase available quantity)
  - Calculate final charges (late fees, damage)
  - Finalize payment settlement
- When changing to CANCELLED:
  - Release stock reservation
  - Handle deposit refund
  - Record cancellation reason
- Auto-detect OVERDUE:
  - Daily job checks if return date passed
  - Calculate late penalty fees

**Business Rules:**

- Cannot move from COMPLETED back to earlier status
- CANCELLED orders release inventory
- OVERDUE status auto-triggers late fees
- Each status change is audited

**Output:**

- Updated order details
- Status change confirmation
- Stock availability updated

#### 3.2.5 Extend Rental Period

**Requirement ID:** RNT-FR-009
**Priority:** High

**Description:**
The system shall allow extending the rental period for active orders.

**Input:**

- Order ID
- New return date and time
- Extension reason (optional)

**Processing:**

1. Validate order is in ACTIVE or OVERDUE status
2. Calculate additional duration
3. Calculate extension charges:
   - Apply appropriate rate for additional period
   - May require additional deposit
4. Add extension charges to order
5. Update expected return date
6. Update payment due
7. If OVERDUE, clear overdue status
8. Record extension in order history

**Business Rules:**

- Can extend multiple times
- Each extension creates additional charge
- Extension must respect item's maximum duration
- Stock must still be available for extension period
- Extension requires approval if significant

**Output:**

- Updated order with new return date
- Additional charges calculated
- Updated payment summary

#### 3.2.6 Retrieve Orders by Context

**Requirement ID:** RNT-FR-010
**Priority:** Medium

**Description:**
The system shall provide methods to retrieve orders by various contexts.

**Retrieval Methods:**

1. **By Booking ID**

   - Return all rental orders for a booking
   - Useful for billing integration

2. **By Room Identifier**

   - Return all orders for a specific room
   - Useful for front desk inquiries

3. **Overdue Rentals**
   - Return all orders past return date
   - Filter by hotel
   - Include late fee calculations
   - Priority for follow-up

**Output:**

- List of order summaries
- Sorted appropriately
- Include relevant metrics (days overdue, penalties)

---

### 3.3 Payment Management

#### 3.3.1 Record Payment

**Requirement ID:** RNT-FR-011
**Priority:** Critical

**Description:**
The system shall support recording various types of payments for rental orders.

**Payment Types:**

- DEPOSIT: Security deposit
- RENTAL_FEE: Base rental charge
- DAMAGE_FEE: Charges for item damage
- LATE_FEE: Penalty for overdue return
- EXTENSION_FEE: Additional rental period
- REFUND: Return of deposit or overpayment

**Input:**

- Rental order ID
- Payment amount
- Payment type
- Payment method (CASH, CARD, MOBILE_MONEY, BANK_TRANSFER, WALLET)
- Payment reference (optional)
- Notes (optional)

**Processing:**

1. Validate order exists and belongs to hotel
2. Validate payment type is appropriate
3. For DEPOSIT payments:
   - Track separately from rental fees
   - Mark deposit as paid
4. For RENTAL_FEE payments:
   - Apply to rental balance
5. For DAMAGE_FEE/LATE_FEE:
   - Create if not exists
   - Apply payment
6. For REFUND:
   - Must have positive balance
   - Record negative payment
7. Update order payment tracking:
   - Total paid
   - Remaining balance
   - Deposit status
8. Update payment status:
   - UNPAID: no payments
   - PARTIALLY_PAID: 0 < paid < total
   - PAID: all fees paid
   - PENDING_REFUND: overpaid, refund needed
   - REFUNDED: deposit returned
9. Auto-generate receipt number

**Business Rules:**

- Deposit typically collected upfront
- Multiple partial payments allowed
- Refunds require supervisor approval
- All damage/late fees must be settled before deposit refund
- Each payment is immutable once created

**Output:**

- Payment confirmation
- Receipt number
- Updated order balance
- Payment status
- Deposit status

#### 3.3.2 Get Payments for Order

**Requirement ID:** RNT-FR-012
**Priority:** Medium

**Description:**
The system shall provide payment history for an order.

**Input:**

- Order ID

**Processing:**

- Retrieve all payments for order
- Sort by payment date (descending)
- Group by payment type

**Output:**

- List of payments:
  - Payment ID
  - Payment type
  - Amount
  - Payment method
  - Payment date
  - Reference number
  - User who recorded payment

#### 3.3.3 Payment Summary

**Requirement ID:** RNT-FR-013
**Priority:** High

**Description:**
The system shall provide comprehensive payment summary for a rental order.

**Input:**

- Order ID

**Processing:**

- Calculate all payment metrics
- Separate deposit from fees
- Calculate refundable amount

**Output:**

- Deposit amount
- Deposit paid (yes/no)
- Rental fee total
- Rental fee paid
- Damage fees (if any)
- Late fees (if any)
- Extension fees (if any)
- Total charges
- Total amount paid
- Outstanding balance
- Refundable deposit amount
- Payment status
- Payment history

---

### 3.4 Dashboard and Analytics

#### 3.4.1 Dashboard Statistics

**Requirement ID:** RNT-FR-014
**Priority:** High

**Description:**
The system shall provide real-time dashboard statistics for rental operations.

**Processing:**

- Calculate metrics from hotel's data
- Use current date/time for real-time data

**Output Metrics:**

1. **Inventory Metrics:**

   - Total active rental items
   - Total quantity of items
   - Currently rented out quantity
   - Available items

2. **Operational Metrics:**

   - Total rental orders (all time)
   - Active rentals (currently rented)
   - Overdue rentals (past return date)
   - Completed rentals
   - Orders created today
   - Orders completed today

3. **Financial Metrics:**

   - Total revenue (sum of all payments)
   - Outstanding amount (unpaid balances)
   - Revenue today
   - Total deposits held
   - Pending refunds
   - Late fee revenue
   - Damage fee revenue

4. **Utilization Metrics:**
   - Utilization rate (rented / total stock)
   - Most popular items
   - Average rental duration

**Business Rules:**

- All metrics are hotel-specific
- Active rentals = ACTIVE + OVERDUE status
- Completed = COMPLETED status
- Revenue includes all payment types except deposits
- Deposits are tracked separately

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Dashboard statistics load within 2 seconds
- Order search returns results within 3 seconds
- Stock availability checks in real-time (< 500ms)
- Support minimum 100 concurrent users
- Handle 50,000+ orders per hotel

### 4.2 Security

- All endpoints require authentication
- Hotel data isolation enforced
- User actions are audited
- Payment information is secured
- Customer ID documents encrypted

### 4.3 Data Integrity

- Order numbers are unique
- Stock levels are accurately tracked
- Payment records are immutable
- Status changes are logged
- Soft deletes preserve history
- Concurrent stock reservations handled

### 4.4 Usability

- RESTful API design
- Consistent response format
- Clear error messages
- Comprehensive validation
- Stock availability real-time

### 4.5 Reliability

- Stock reservation is atomic
- No overbooking (stock control)
- Automatic overdue detection
- Payment calculation accuracy

---

## 5. Data Model

### 5.1 Core Entities

**RentalItem:**

- ID, hotelId, name, description
- category
- hourlyRate, dailyRate, weeklyRate, monthlyRate
- depositAmount, replacementCost
- totalQuantity, availableQuantity
- minRentalDuration, maxRentalDuration
- specialInstructions
- active flag
- Audit fields

**RentalOrder:**

- ID, hotelId, orderNumber
- bookingId, customerName, customerPhone
- customerIdType, customerIdNumber, roomIdentifier
- rentalStartDate, rentalEndDate, actualReturnDate
- status, paymentStatus
- subtotal (rental fees only)
- totalDeposit, taxAmount, totalAmount
- damageFees, lateFees, extensionFees
- amountPaid, outstandingBalance
- depositRefunded
- notes
- Audit fields

**RentalOrderItem:**

- ID, orderId, rentalItemId
- quantity
- rentalDuration (hours)
- unitRentalFee, unitDeposit
- lineRentalTotal, lineDepositTotal, lineTotal
- damageNotes, returned

**RentalPayment:**

- ID, orderId, hotelId
- amount, paymentType
- paymentMethod, paymentReference
- receiptNumber, paymentDate
- processedBy, notes

---

## 6. API Endpoints Summary

### Rental Items

- POST /api/hotels/rentals/items - Create item
- PUT /api/hotels/rentals/items/{itemId} - Update item
- GET /api/hotels/rentals/items - Get all items
- GET /api/hotels/rentals/items/available - Get available items
- GET /api/hotels/rentals/items/category/{category} - Get by category
- GET /api/hotels/rentals/items/{itemId} - Get by ID
- DELETE /api/hotels/rentals/items/{itemId} - Deactivate item

### Rental Orders

- POST /api/hotels/rentals/orders - Create order
- GET /api/hotels/rentals/orders - Search orders
- GET /api/hotels/rentals/orders/{orderId} - Get order details
- PATCH /api/hotels/rentals/orders/{orderId}/status - Update status
- POST /api/hotels/rentals/orders/{orderId}/extend - Extend rental
- GET /api/hotels/rentals/orders/booking/{bookingId} - Get by booking
- GET /api/hotels/rentals/orders/room/{roomIdentifier} - Get by room
- GET /api/hotels/rentals/orders/overdue - Get overdue rentals

### Payments

- POST /api/hotels/rentals/payments - Record payment
- GET /api/hotels/rentals/orders/{orderId}/payments - Get payments
- GET /api/hotels/rentals/orders/{orderId}/payment-summary - Get summary

### Dashboard

- GET /api/hotels/rentals/dashboard/stats - Get statistics

---

## 7. Business Rules Summary

1. **Inventory Management:**

   - Stock reservation is real-time
   - Cannot rent more than available
   - Stock released on completion or cancellation
   - Item names unique per hotel

2. **Order Processing:**

   - Order numbers: RNT-YYYYMMDD-XXXX
   - Minimum one item per order
   - Customer name and phone mandatory
   - Auto-rate selection based on duration
   - Stock reserved immediately

3. **Payment Processing:**

   - Deposits collected separately
   - Multiple payment types supported
   - Partial payments allowed
   - Deposit refund only after all fees paid
   - Payment status auto-calculated

4. **Late Fees:**

   - Auto-calculated when overdue
   - Daily penalty charges
   - Must be paid before deposit refund

5. **Damage Assessment:**

   - Recorded at return
   - Deducted from deposit
   - Additional payment if exceeds deposit

6. **Extension Processing:**
   - Multiple extensions allowed
   - Recalculates fees
   - Updates return date
   - Clears overdue status

---

## 8. Calculation Examples

### Example 1: Daily Rental

- Item: Bicycle
- Daily rate: $20
- Deposit: $50
- Duration: 3 days
- Rental fee: 3 × $20 = $60
- Deposit: $50
- Total: $110

### Example 2: Hourly Rental

- Item: Laptop
- Hourly rate: $5
- Deposit: $200
- Duration: 8 hours
- Rental fee: 8 × $5 = $40
- Deposit: $200
- Total: $240

### Example 3: Weekly Rental

- Item: Car
- Weekly rate: $300
- Deposit: $500
- Duration: 10 days (1.43 weeks)
- Rental fee: 2 × $300 = $600 (rounded to 2 weeks)
- Deposit: $500
- Total: $1,100

### Example 4: Late Return with Damage

- Original rental: $100
- Deposit: $200
- Paid: $300
- Returned: 2 days late
- Late fee: 2 × $20 = $40
- Damage fee: $80
- Total charges: $100 + $40 + $80 = $220
- Deposit applied: $200
- Additional payment needed: $20
- No deposit refund

---

## 9. Future Enhancements

1. Online booking portal for guests
2. Mobile app for rental management
3. QR code item tracking
4. Maintenance scheduling
5. Insurance integration
6. Analytics and reporting dashboard
7. Loyalty program integration
8. Integration with POS systems
9. SMS/Email notifications
10. Photo documentation of item condition

---

## 10. Glossary

- **Deposit:** Refundable security amount held against damage/loss
- **Rental Fee:** Non-refundable charge for item usage
- **Late Fee:** Penalty for returning item past due date
- **Damage Fee:** Charge for item damage during rental
- **Extension:** Prolonging rental period beyond original agreement
- **Available Quantity:** Items in stock not currently rented
- **Stock Reservation:** Temporarily allocating items to an order
- **Overdue:** Rental past expected return date

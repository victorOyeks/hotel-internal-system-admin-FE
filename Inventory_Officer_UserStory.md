# User Stories

## Hotel Inventory Management System - Inventory Officer Module

**Version:** 1.0
**Date:** 2025-11-22
**Module:** Inventory Officer Operations

---

## Epic 1: Basic Inventory Management

### Story 1.1: Add Inventory Items

**As an** Inventory Officer
**I want to** add new items to the inventory system
**So that** I can track stock levels for all hotel supplies

**Acceptance Criteria:**

- Given I am on the inventory items page
- When I click "Add New Item"
- And I enter item details (name, SKU, category, unit)
- And I set reorder levels
- And I click "Save"
- Then the item is created with zero initial stock
- And I receive a confirmation message
- And the item appears in the inventory list

**Priority:** High
**Story Points:** 3

---

### Story 1.2: Issue Stock to Departments

**As an** Inventory Officer
**I want to** issue stock to departments (Kitchen, Housekeeping, Bar)
**So that** operations can continue and stock is tracked

**Acceptance Criteria:**

- Given I have items in stock
- When I select an item to issue
- And I choose the department (Kitchen, Bar, Housekeeping, etc.)
- And I enter the quantity to issue
- And I provide a purpose/note
- And I click "Issue"
- Then the stock quantity is reduced
- And the issuance is recorded for the department
- And I cannot issue more than available stock

**Priority:** High
**Story Points:** 5

---

### Story 1.3: Monitor Stock Levels

**As an** Inventory Manager
**I want to** view all inventory items with their stock status
**So that** I can identify low stock and reorder needs

**Acceptance Criteria:**

- Given I am on the inventory page
- When I view the inventory list
- Then I see items categorized by stock status:
  - IN_STOCK (green indicator)
  - LOW_STOCK (yellow indicator)
  - OUT_OF_STOCK (red indicator)
  - OVERSTOCK (blue indicator)
- And I can filter by stock availability
- And I can search by name or SKU
- And items show current quantity and reorder level

**Priority:** High
**Story Points:** 3

---

### Story 1.4: Request Restock

**As an** Inventory Officer
**I want to** create restock requests for low inventory items
**So that** supplies are replenished before running out

**Acceptance Criteria:**

- Given an item is low in stock
- When I view the item details
- And I click "Request Restock"
- And I enter requested quantity and urgency
- And I provide justification
- And I submit the request
- Then a restock request is created
- And it appears in pending requests list
- And relevant approvers are notified

**Priority:** High
**Story Points:** 3

---

### Story 1.5: View Inventory Summary

**As an** Inventory Manager
**I want to** see a high-level summary of inventory status
**So that** I can quickly understand the overall inventory health

**Acceptance Criteria:**

- Given I access the inventory summary
- Then I see:
  - Total number of items
  - Low stock items count
  - Out of stock items count
  - Total inventory value
  - Top issued items
  - Pending restock requests
- And metrics are current/real-time

**Priority:** Medium
**Story Points:** 3

---

## Epic 2: Supplier and Delivery Management

### Story 2.1: Add Suppliers

**As an** Inventory Officer
**I want to** add and manage supplier information
**So that** I can track who supplies what products

**Acceptance Criteria:**

- Given I am on the suppliers page
- When I click "Add New Supplier"
- And I enter supplier details (name, contact, email, phone, address)
- And I enter payment terms and credit limit
- And I click "Save"
- Then the supplier is created
- And appears in the suppliers list
- And I can associate products with this supplier

**Priority:** High
**Story Points:** 3

---

### Story 2.2: Record Deliveries

**As an** Inventory Officer
**I want to** record deliveries from suppliers
**So that** I track what was received and when

**Acceptance Criteria:**

- Given a supplier delivers goods
- When I create a delivery record
- And I select the supplier
- And I enter delivery date and reference number
- And I add delivered items with quantities and prices
- And I enter invoice details
- And I save the delivery
- Then the delivery is recorded
- And I can optionally auto-update stock levels
- And the delivery appears in delivery history

**Priority:** High
**Story Points:** 5

---

### Story 2.3: Search Deliveries

**As an** Inventory Officer
**I want to** search and filter delivery records
**So that** I can find specific deliveries quickly

**Acceptance Criteria:**

- Given I have delivery records
- When I search by:
  - Supplier name
  - Delivery reference
  - Date range
  - Invoice number
- Then I see matching deliveries
- With supplier details and item summaries
- And results are paginated

**Priority:** Medium
**Story Points:** 3

---

## Epic 3: Product Catalog Management

### Story 3.1: Create Products

**As an** Inventory Manager
**I want to** create products in the catalog
**So that** I can track detailed product information

**Acceptance Criteria:**

- Given I am creating a new product
- When I enter product details:
  - Unique SKU/product code
  - Product name and description
  - Category (Food, Beverage, Supplies, etc.)
  - Unit of measure
  - Enable batch tracking (yes/no)
  - Enable expiry tracking (yes/no)
  - Min/Max stock levels
  - Reorder point
  - Standard cost
- And I save the product
- Then it's created with ACTIVE status
- And appears in product catalog
- And can be used in purchase orders and GRNs

**Priority:** High
**Story Points:** 5

---

### Story 3.2: Track Batches and Expiry

**As an** Inventory Officer
**I want to** track products by batch and expiry date
**So that** I can manage FIFO and prevent using expired items

**Acceptance Criteria:**

- Given a product has batch tracking enabled
- When I receive goods (via GRN)
- Then I must enter batch number
- And optionally manufacture and expiry dates
- And the system tracks stock by batch
- And I can see items expiring in next 30 days
- And I'm alerted before items expire

**Priority:** High
**Story Points:** 8

---

### Story 3.3: Search Products

**As an** Inventory Officer
**I want to** search products with various filters
**So that** I can quickly find specific products

**Acceptance Criteria:**

- Given I am searching products
- When I filter by:
  - Status (Active, Inactive, Discontinued)
  - Category
  - Search text (name, SKU, description)
  - Batch tracking enabled
  - Expiry tracking enabled
- Then I see matching products
- With current stock levels
- And can view detailed product information

**Priority:** Medium
**Story Points:** 3

---

## Epic 4: Purchase Order Management

### Story 4.1: Create Purchase Orders

**As an** Inventory Officer
**I want to** create purchase orders for suppliers
**So that** I can formally request and track orders

**Acceptance Criteria:**

- Given I need to order products
- When I create a purchase order
- And I select supplier
- And I add products with quantities and unit prices
- And I set delivery location and expected date
- And I enter shipping and other costs
- And I save as DRAFT
- Then a unique PO number is generated
- And totals are calculated (subtotal, tax, total)
- And PO status is DRAFT
- And I can submit for approval

**Priority:** Critical
**Story Points:** 8

---

### Story 4.2: Approve Purchase Orders

**As an** Inventory Manager
**I want to** approve purchase orders
**So that** orders can proceed to suppliers

**Acceptance Criteria:**

- Given I have a PO in PENDING_APPROVAL status
- When I review the PO details
- And I click "Approve"
- Then the PO status changes to APPROVED
- And my approval and timestamp are recorded
- And the supplier can be notified
- And goods can now be received against this PO

**Priority:** High
**Story Points:** 3

---

### Story 4.3: Search Purchase Orders

**As an** Inventory Officer
**I want to** search and filter purchase orders
**So that** I can track order status and history

**Acceptance Criteria:**

- Given I have purchase orders
- When I search by:
  - Status (Draft, Pending Approval, Approved, Received)
  - Supplier
  - Date range
  - PO number
- Then I see matching POs
- With status, supplier, total amount
- And I can view full PO details
- And results are paginated

**Priority:** High
**Story Points:** 3

---

## Epic 5: Goods Receipt Management

### Story 5.1: Create Goods Receipt Notes

**As an** Inventory Officer
**I want to** create GRNs when goods arrive
**So that** I document what was received

**Acceptance Criteria:**

- Given goods arrive from a supplier
- When I create a GRN
- And I optionally link to a purchase order
- And I select supplier and storage location
- And I enter receipt date and invoice details
- And I add received items with:
  - Product
  - Quantity received, accepted, rejected
  - Batch number and expiry date
  - Quality status
  - Unit price
- And I save the GRN
- Then a unique GRN number is generated
- And GRN status is DRAFT
- And stock is NOT yet updated
- And I can post to update stock

**Priority:** Critical
**Story Points:** 8

---

### Story 5.2: Post GRN to Stock

**As an** Inventory Officer
**I want to** post GRNs to update stock levels
**So that** received goods are added to inventory

**Acceptance Criteria:**

- Given I have a GRN in DRAFT status
- When I review and verify the GRN
- And I click "Post to Stock"
- Then for each accepted item:
  - Stock level is increased
  - Average cost is recalculated (weighted)
  - Stock movement record is created
  - Batch record is created (if batch tracking)
- And GRN status changes to ACCEPTED
- And GRN is marked as posted
- And I cannot post the same GRN twice

**Priority:** Critical
**Story Points:** 8

---

### Story 5.3: Handle Rejected Items

**As an** Inventory Officer
**I want to** record rejected items in GRNs
**So that** damaged/poor quality goods are tracked

**Acceptance Criteria:**

- Given I'm creating a GRN
- When I receive damaged or poor quality items
- Then I can specify:
  - Quantity rejected
  - Rejection reason
  - Damage details
  - Packaging condition
- And rejected quantities are NOT added to stock
- And rejection is documented for supplier follow-up
- And only accepted quantities update inventory

**Priority:** High
**Story Points:** 3

---

## Epic 6: Stock Adjustment Management

### Story 6.1: Create Stock Adjustments

**As an** Inventory Officer
**I want to** create stock adjustments
**So that** I can correct stock levels for damages, theft, etc.

**Acceptance Criteria:**

- Given I need to adjust stock
- When I create a stock adjustment
- And I select product and location
- And I choose reason (Damage, Theft, Expiry, Breakage, etc.)
- And I select type (Increase or Decrease)
- And I enter adjustment quantity
- And I add notes
- And I save the adjustment
- Then an adjustment number is generated
- And it shows quantity before/after and cost impact
- And status is set based on approval requirement
- And stock is NOT updated until posted

**Priority:** High
**Story Points:** 5

---

### Story 6.2: Approve Stock Adjustments

**As an** Inventory Manager
**I want to** approve significant stock adjustments
**So that** stock changes are authorized

**Acceptance Criteria:**

- Given I have adjustments pending approval
- When I review an adjustment
- And I verify the reason and quantity
- And I click "Approve"
- Then the adjustment is marked as approved
- And my approval is recorded
- And it can now be posted to stock

**Priority:** Medium
**Story Points:** 2

---

### Story 6.3: Post Stock Adjustments

**As an** Inventory Officer
**I want to** post approved adjustments to stock
**So that** stock levels are corrected

**Acceptance Criteria:**

- Given I have an approved adjustment
- When I post the adjustment
- Then stock level is increased or decreased
- And a stock movement record is created
- And the adjustment is marked as posted
- And I cannot post the same adjustment twice

**Priority:** High
**Story Points:** 3

---

### Story 6.4: Track Adjustment History

**As an** Inventory Manager
**I want to** view all stock adjustments
**So that** I can monitor stock corrections

**Acceptance Criteria:**

- Given I search stock adjustments
- When I filter by:
  - Product
  - Location
  - Reason
  - Adjustment type (Increase/Decrease)
  - Date range
  - Posted status
  - Approved status
- Then I see matching adjustments
- With details and cost impact
- And I can identify patterns of loss

**Priority:** Medium
**Story Points:** 3

---

## Epic 7: Stock Take Operations

### Story 7.1: Create Stock Take

**As an** Inventory Manager
**I want to** initiate a stock take/physical count
**So that** I can verify actual vs. system stock

**Acceptance Criteria:**

- Given I need to perform physical inventory count
- When I create a stock take
- And I select a storage location
- And I set scheduled date and supervisor
- And I set acceptable variance percentage
- And I save the stock take
- Then a unique stock take number is generated
- And stock take items are auto-created for all products in the location
- And each item shows system quantity
- And status is SCHEDULED
- And counting can begin

**Priority:** High
**Story Points:** 5

---

### Story 7.2: Record Physical Counts

**As an** Stock Counter
**I want to** record actual physical counts
**So that** variances can be identified

**Acceptance Criteria:**

- Given I have a stock take in progress
- When I count a product physically
- And I enter the actual quantity
- And I note condition (damaged, expired items found)
- And I save the count
- Then the count is recorded
- And variance is automatically calculated (actual - system)
- And variance percentage is shown
- And items exceeding acceptable variance are flagged
- And stock take status updates to IN_PROGRESS

**Priority:** Critical
**Story Points:** 5

---

### Story 7.3: Complete Stock Take

**As an** Inventory Manager
**I want to** complete a stock take after counting
**So that** I can review variances

**Acceptance Criteria:**

- Given all items have been counted
- When I complete the stock take
- Then the system calculates:
  - Total items with variances
  - Total value variance
  - System stock value vs. actual stock value
- And status changes to PENDING_REVIEW
- And I can review variances before posting
- And I can investigate significant variances

**Priority:** High
**Story Points:** 3

---

### Story 7.4: Post Stock Take Adjustments

**As an** Inventory Manager
**I want to** post stock take adjustments automatically
**So that** stock levels match physical count

**Acceptance Criteria:**

- Given I have reviewed and approved variances
- When I post stock take adjustments
- Then for each variance:
  - Stock adjustment is auto-created
  - Reason is set to "Stock Count Variance"
  - Adjustment is auto-approved and posted
  - Stock level is corrected
  - Item is marked as resolved
- And stock take status is COMPLETED
- And I cannot post the same stock take twice
- And all variances are now reflected in stock

**Priority:** Critical
**Story Points:** 8

---

### Story 7.5: Search Stock Takes

**As an** Inventory Manager
**I want to** view stock take history
**So that** I can track inventory accuracy over time

**Acceptance Criteria:**

- Given I have completed stock takes
- When I search by:
  - Status
  - Location
  - Date range
  - Has variances
- Then I see matching stock takes
- With variance summaries
- And I can view detailed results

**Priority:** Medium
**Story Points:** 2

---

## Epic 8: Storage Location Management

### Story 8.1: Create Storage Locations

**As an** Inventory Manager
**I want to** create storage locations
**So that** I can track stock by physical location

**Acceptance Criteria:**

- Given I need to add a new storage area
- When I create a storage location
- And I enter:
  - Unique location code
  - Location name
  - Type (Warehouse, Cold Storage, Dry Storage, etc.)
  - Building/Floor/Room details
  - Capacity information
  - Temperature/humidity controls
  - Access restrictions
  - Manager and contact info
- And I save the location
- Then it's created and active
- And I can receive stock into this location
- And I can issue stock from this location

**Priority:** High
**Story Points:** 5

---

### Story 8.2: Search Storage Locations

**As an** Inventory Officer
**I want to** search storage locations
**So that** I can find where items are stored

**Acceptance Criteria:**

- Given I have multiple storage locations
- When I search by:
  - Location code or name
  - Location type
  - Temperature controlled
  - Active status
- Then I see matching locations
- With capacity and stock information
- And I can view location details

**Priority:** Medium
**Story Points:** 2

---

## Epic 9: Dashboard and Reporting

### Story 9.1: View Inventory Dashboard

**As an** Inventory Manager
**I want to** see a comprehensive inventory dashboard
**So that** I can monitor all key inventory metrics

**Acceptance Criteria:**

- Given I access the inventory dashboard
- Then I see:
  - Total active products count
  - Low stock items alert
  - Out of stock items alert
  - Items expiring in 30 days
  - Pending approval POs count
  - Approved POs count
  - Unposted GRNs count
  - Scheduled/in-progress stock takes
  - Pending approval adjustments
- And all metrics are hotel-specific
- And data is current/real-time
- And I can drill down into each metric

**Priority:** High
**Story Points:** 8

---

### Story 9.2: Monitor Expiring Items

**As an** Inventory Officer
**I want to** see items expiring soon
**So that** I can use them before expiry or dispose properly

**Acceptance Criteria:**

- Given I have products with expiry tracking
- When I view the dashboard
- Then I see count of items expiring in next 30 days
- And I can click to see the detailed list
- With product name, batch, expiry date
- Sorted by nearest expiry first
- And I can take action (use, return, dispose)

**Priority:** High
**Story Points:** 3

---

### Story 9.3: Track Purchase Order Status

**As an** Inventory Manager
**I want to** see PO status at a glance
**So that** I can follow up on pending orders

**Acceptance Criteria:**

- Given I have purchase orders
- When I view the dashboard
- Then I see:
  - Pending approval POs count and value
  - Approved POs count and value
  - Overdue deliveries (past expected date)
- And I can click to see detailed lists
- And take appropriate action

**Priority:** Medium
**Story Points:** 3

---

## Definition of Done

For all user stories:

1. Code is written and follows project standards
2. Unit tests are written and passing
3. Average cost calculations are correct
4. Stock movements create audit trail
5. API endpoints are documented in Swagger
6. Integration tests pass
7. Code is reviewed and approved
8. API is tested with Postman/similar tool
9. No critical or high-priority bugs
10. Acceptance criteria are met and verified
11. User documentation is updated

---

## Story Prioritization

### Must Have (MVP)

- Add inventory items
- Issue stock to departments
- Monitor stock levels
- Add suppliers
- Record deliveries
- Create products
- Create purchase orders
- Approve purchase orders
- Create and post GRNs
- Create stock adjustments
- Basic dashboard

### Should Have

- Batch and expiry tracking
- Stock take operations
- Post stock adjustments
- Storage location management
- Advanced search and filtering
- Restock requests
- Purchase order search

### Could Have

- Supplier performance tracking
- Automated reorder points
- Email notifications
- Barcode scanning
- Advanced analytics
- Mobile app for counting

### Won't Have (Future)

- AI-powered demand forecasting
- Supplier portal integration
- Blockchain tracking
- IoT sensor integration
- Automated drone counting

---

## Technical Considerations

### Inventory Accuracy

- Stock movements must be atomic
- Average cost calculations must be precise
- Batch tracking must maintain FIFO
- Concurrent updates must be handled

### Approval Workflows

- Role-based permissions required
- Approval routing configurable
- Audit trail comprehensive
- Notifications timely

### Performance

- Large stock takes must complete quickly
- Search must handle large datasets
- Dashboard must load fast
- Batch operations must be efficient

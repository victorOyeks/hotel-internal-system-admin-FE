# Functional Requirements Document (FRD)

## Hotel Inventory Management System - Inventory Officer Module

**Version:** 1.0
**Date:** 2025-11-22
**Module:** Inventory Officer Operations

---

## 1. Executive Summary

The Inventory Officer Module is a comprehensive inventory management system designed for hotel operations. It encompasses basic inventory management, supplier management, delivery tracking, purchase order processing, goods receipt, stock adjustments, stock takes, and storage location management. This module provides end-to-end inventory control from procurement to stock reconciliation.

---

## 2. System Overview

### 2.1 Purpose

To provide inventory officers and managers with a complete system to:

- Manage inventory items and stock levels
- Process purchase orders and approvals
- Track goods receipts and deliveries
- Manage suppliers and their deliveries
- Perform stock adjustments and reconciliation
- Conduct periodic stock takes
- Issue stock to departments
- Monitor inventory through comprehensive dashboards

### 2.2 Scope

The system covers:

- Basic inventory item management
- Product catalog with batch and expiry tracking
- Supplier master data management
- Delivery tracking
- Purchase order workflow
- Goods Receipt Note (GRN) processing
- Stock adjustment management
- Stock take/physical inventory counting
- Storage location management
- Stock issuance to departments
- Inventory analytics and reporting

---

## 3. Functional Requirements

### 3.1 Basic Inventory Management

#### 3.1.1 Add Inventory Item

**Requirement ID:** INV-FR-001
**Priority:** High

**Description:**
The system shall allow inventory officers to add new inventory items to the system.

**Input:**

- Item name
- Custom ID/SKU
- Category
- Unit of measurement
- Reorder level
- Stock availability threshold
- Other item attributes

**Processing:**

- Validate item uniqueness
- Generate system ID
- Associate with hotel
- Set initial stock level to zero
- Mark as active

**Output:**

- Item created confirmation
- Item ID

#### 3.1.2 Issue Inventory Item

**Requirement ID:** INV-FR-002
**Priority:** High

**Description:**
The system shall support issuing inventory items to departments.

**Input:**

- Item ID
- Department (KITCHEN, HOUSEKEEPING, BAR, RESTAURANT, etc.)
- Quantity to issue
- Purpose/notes

**Processing:**

- Validate item exists and has sufficient stock
- Reduce available quantity
- Create issuance record
- Track issued stock by department
- Update inventory status

**Output:**

- Issue confirmation
- Updated stock levels
- Issuance record

#### 3.1.3 Search and Filter Inventory

**Requirement ID:** INV-FR-003
**Priority:** High

**Description:**
The system shall provide comprehensive search and filtering for inventory items.

**Search Parameters:**

- Item name (partial match)
- Custom ID/SKU
- Category
- Unit of measurement
- Stock availability (IN_STOCK, LOW_STOCK, OUT_OF_STOCK, OVERSTOCK)
- Pagination support

**Processing:**

- Apply filters
- Support text search
- Return paginated results

**Output:**

- List of inventory items
- Stock status indicators
- Pagination metadata

#### 3.1.4 Get Issued Stock Inventory

**Requirement ID:** INV-FR-004
**Priority:** Medium

**Description:**
The system shall track stock issued to different departments.

**Search Parameters:**

- Search text
- Custom ID
- Department filter
- Unit filter
- Pagination

**Output:**

- List of issued stock by department
- Quantities issued
- Department-wise breakdown

#### 3.1.5 Request Restock

**Requirement ID:** INV-FR-005
**Priority:** High

**Description:**
The system shall allow requesting restock for low inventory items.

**Input:**

- Item ID
- Requested quantity
- Urgency level
- Justification

**Processing:**

- Create restock request
- Set status to PENDING
- Notify approvers

**Output:**

- Request confirmation
- Request ID

#### 3.1.6 Get Inventory Summary

**Requirement ID:** INV-FR-006
**Priority:** Medium

**Description:**
The system shall provide high-level inventory summary.

**Output:**

- Total items count
- Low stock items count
- Out of stock items count
- Total inventory value
- Top issued items
- Restock requests pending

---

### 3.2 Supplier Management

#### 3.2.1 Add Supplier

**Requirement ID:** INV-FR-007
**Priority:** High

**Description:**
The system shall support adding new suppliers.

**Input:**

- Supplier name (required)
- Contact person
- Email
- Phone number
- Address
- Tax ID/Registration number
- Payment terms
- Credit limit
- Notes

**Processing:**

- Validate supplier name uniqueness
- Generate supplier ID
- Associate with hotel
- Set as active

**Output:**

- Supplier created confirmation
- Supplier ID

#### 3.2.2 Update Supplier

**Requirement ID:** INV-FR-008
**Priority:** Medium

**Description:**
The system shall allow updating supplier information.

**Input:**

- Supplier ID
- Updated supplier details

**Processing:**

- Validate supplier exists
- Update information
- Maintain audit trail

**Output:**

- Updated supplier details
- Confirmation

#### 3.2.3 Search Suppliers

**Requirement ID:** INV-FR-009
**Priority:** Medium

**Description:**
The system shall provide search functionality for suppliers.

**Search Parameters:**

- Search text (name, contact, email)
- Pagination

**Output:**

- List of suppliers
- Supplier details
- Pagination metadata

---

### 3.3 Delivery Management

#### 3.3.1 Add Delivery Record

**Requirement ID:** INV-FR-010
**Priority:** High

**Description:**
The system shall track deliveries from suppliers.

**Input:**

- Supplier ID (required)
- Delivery date
- Delivery number/reference
- Items delivered (array):
  - Item ID
  - Quantity delivered
  - Unit price
  - Batch number (optional)
  - Expiry date (optional)
- Invoice number
- Invoice amount
- Notes

**Processing:**

- Validate supplier exists
- Create delivery record
- Update stock levels if auto-post enabled
- Generate delivery ID
- Associate with supplier

**Output:**

- Delivery confirmation
- Delivery ID
- Updated stock levels

#### 3.3.2 Update Delivery Record

**Requirement ID:** INV-FR-011
**Priority:** Medium

**Description:**
The system shall allow updating delivery information.

**Input:**

- Supplier ID
- Delivery ID
- Updated delivery details

**Processing:**

- Validate delivery exists
- Update information
- Recalculate totals if items changed
- Maintain audit trail

**Output:**

- Updated delivery details

#### 3.3.3 Search Deliveries

**Requirement ID:** INV-FR-012
**Priority:** Medium

**Description:**
The system shall provide delivery search and filtering.

**Search Parameters:**

- Search text (supplier name, delivery reference)
- Date range (start and end date)
- Pagination

**Output:**

- List of deliveries
- Delivery details
- Supplier information
- Pagination metadata

---

### 3.4 Product Catalog Management

#### 3.4.1 Create Product

**Requirement ID:** INV-FR-013
**Priority:** High

**Description:**
The system shall support creating products in the catalog.

**Input:**

- SKU/Product code (required, unique)
- Product name (required)
- Description
- Category (FOOD, BEVERAGE, SUPPLIES, EQUIPMENT, LINEN, AMENITIES, etc.)
- Unit of measure
- Track batches (yes/no)
- Track expiry (yes/no)
- Minimum stock level
- Maximum stock level
- Reorder point
- Standard cost
- Status (ACTIVE, INACTIVE, DISCONTINUED)

**Processing:**

- Validate SKU uniqueness per hotel
- Create product record
- Associate with hotel
- Set initial status to ACTIVE

**Output:**

- Product created confirmation
- Product ID and SKU

#### 3.4.2 Update Product

**Requirement ID:** INV-FR-014
**Priority:** Medium

**Description:**
The system shall allow updating product information.

**Input:**

- Product ID
- Updated product details

**Processing:**

- Validate product exists
- Update information
- Maintain version history

**Output:**

- Updated product details

#### 3.4.3 Search Products

**Requirement ID:** INV-FR-015
**Priority:** High

**Description:**
The system shall provide comprehensive product search.

**Search Parameters:**

- Status filter
- Category filter
- Search text (name, SKU, description)
- Track batches filter
- Track expiry filter
- Pagination

**Output:**

- List of products
- Product details
- Stock information
- Pagination metadata

#### 3.4.4 Delete Product

**Requirement ID:** INV-FR-016
**Priority:** Low

**Description:**
The system shall support soft deletion of products.

**Input:**

- Product ID

**Processing:**

- Validate product exists
- Check for dependencies (active stock, pending orders)
- Mark as DISCONTINUED
- Preserve historical data

**Output:**

- Deletion confirmation

---

### 3.5 Storage Location Management

#### 3.5.1 Create Storage Location

**Requirement ID:** INV-FR-017
**Priority:** High

**Description:**
The system shall support creating storage locations.

**Input:**

- Location code (required, unique)
- Location name (required)
- Location type (WAREHOUSE, COLD_STORAGE, DRY_STORAGE, BAR, KITCHEN, etc.)
- Description
- Building/Floor/Room
- Physical address
- Capacity information
- Temperature controlled (yes/no)
- Temperature range (if controlled)
- Humidity controlled (yes/no)
- Humidity range (if controlled)
- Manager user ID
- Contact information
- Access restrictions
- Operating hours
- Special instructions

**Processing:**

- Validate location code uniqueness
- Create location record
- Set as active
- Associate with hotel

**Output:**

- Location created confirmation
- Location ID

#### 3.5.2 Search Storage Locations

**Requirement ID:** INV-FR-018
**Priority:** Medium

**Description:**
The system shall provide storage location search.

**Search Parameters:**

- Active status filter
- Location type filter
- Search text (code, name)
- Temperature controlled filter
- Pagination

**Output:**

- List of locations
- Location details
- Capacity information

---

### 3.6 Stock Issue Management

#### 3.6.1 Issue Stock

**Requirement ID:** INV-FR-019
**Priority:** Critical

**Description:**
The system shall support issuing stock from inventory to departments/orders.

**Input:**

- Location ID (source)
- Issue date and time
- Issue type (SALE, TRANSFER_OUT, CONSUMPTION, WASTAGE, etc.)
- Items to issue (array):
  - Product ID
  - Quantity
  - Notes
- Order ID (optional - for sales)
- Booking ID (optional - for guest charges)
- Department ID (optional - for transfers)
- To Location ID (optional - for transfers)
- Received by
- Notes
- Reason

**Processing:**

- Validate products exist
- Check stock availability at location
- Reduce stock levels
- Create stock movement records
- Update average cost calculations
- Track balance after

**Business Rules:**

- Cannot issue more than available
- Transfer requires destination location
- Each issue creates movement record
- Cost calculated using weighted average

**Output:**

- Issue confirmation
- Updated stock levels
- Movement records

---

### 3.7 Purchase Order Management

#### 3.7.1 Create Purchase Order

**Requirement ID:** INV-FR-020
**Priority:** Critical

**Description:**
The system shall support creating purchase orders.

**Input:**

- Supplier ID (required)
- Delivery location ID
- Order date
- Expected delivery date
- Items (array):
  - Product ID
  - Quantity ordered
  - Unit price
  - Tax rate
  - Notes
- Shipping cost
- Other charges
- Tax rate (overall)
- Payment terms
- Special instructions

**Processing:**

1. Generate unique PO number (format: PO-YYYYMMDD-XXXX)
2. Validate supplier and products exist
3. Calculate line totals
4. Calculate subtotal, tax, total
5. Set status to DRAFT
6. Associate with hotel

**Business Rules:**

- PO number must be unique
- Minimum one item required
- Status workflow: DRAFT → PENDING_APPROVAL → APPROVED → RECEIVED → COMPLETED

**Output:**

- Purchase order confirmation
- PO number
- Total amount

#### 3.7.2 Approve Purchase Order

**Requirement ID:** INV-FR-021
**Priority:** High

**Description:**
The system shall support PO approval workflow.

**Input:**

- PO ID

**Processing:**

- Validate PO is in DRAFT or PENDING_APPROVAL status
- Change status to APPROVED
- Record approver and approval date
- Notify relevant parties

**Output:**

- Approval confirmation
- Updated PO status

#### 3.7.3 Search Purchase Orders

**Requirement ID:** INV-FR-022
**Priority:** High

**Description:**
The system shall provide PO search and filtering.

**Search Parameters:**

- Status filter
- Supplier ID filter
- Date range
- Search text (PO number, supplier name)
- Pagination

**Output:**

- List of purchase orders
- PO summaries
- Status information

---

### 3.8 Goods Receipt Note (GRN) Management

#### 3.8.1 Create GRN

**Requirement ID:** INV-FR-023
**Priority:** Critical

**Description:**
The system shall support creating goods receipt notes.

**Input:**

- Purchase Order ID (optional - can be standalone)
- Supplier ID (required)
- Storage location ID (required)
- Receipt date and time
- Supplier invoice number
- Supplier invoice date
- Supplier delivery note
- Items received (array):
  - Product ID
  - Quantity received
  - Quantity accepted
  - Quantity rejected
  - Unit price
  - Batch number
  - Serial number
  - Manufacture date
  - Expiry date
  - Quality status
  - Rejection reason (if rejected)
  - Damage details
  - Packaging condition
- Delivered by (driver/person)
- Vehicle number
- Inspection required (yes/no)
- General notes

**Processing:**

1. Generate unique GRN number (format: GRN-YYYYMMDD-XXXX)
2. Validate supplier, products, location exist
3. If linked to PO, validate products match
4. Calculate line totals
5. Calculate overall totals
6. Set status to DRAFT
7. Mark as not posted to stock

**Business Rules:**

- GRN number must be unique
- Can be linked to PO or standalone
- Stock not updated until posted
- Accepted + Rejected must equal Received

**Output:**

- GRN confirmation
- GRN number
- Total amount

#### 3.8.2 Post GRN to Stock

**Requirement ID:** INV-FR-024
**Priority:** Critical

**Description:**
The system shall support posting GRN to update stock levels.

**Input:**

- GRN ID

**Processing:**

1. Validate GRN not already posted
2. For each accepted item:
   - Get or create stock level record
   - Add quantity to stock
   - Update average cost (weighted)
   - Create stock movement (PURCHASE_RECEIPT)
   - If batch tracking, create batch record
3. Mark GRN as posted
4. Update GRN status to ACCEPTED
5. Record who posted and when

**Business Rules:**

- Cannot post twice
- Only accepted quantities posted
- Average cost calculated using weighted average
- Creates audit trail

**Output:**

- Post confirmation
- Updated stock levels
- Movement records

---

### 3.9 Stock Adjustment Management

#### 3.9.1 Create Stock Adjustment

**Requirement ID:** INV-FR-025
**Priority:** High

**Description:**
The system shall support creating stock adjustments.

**Input:**

- Product ID (required)
- Location ID (required)
- Adjustment date
- Reason (DAMAGE, THEFT, EXPIRY, STOCK_COUNT_VARIANCE, BREAKAGE, etc.)
- Adjustment type (INCREASE or DECREASE)
- Adjustment quantity
- Requires approval (yes/no)
- Notes
- Insurance claim (yes/no)
- Claim number (if applicable)
- Claim amount (if applicable)

**Processing:**

1. Generate adjustment number (format: ADJ-YYYYMMDD-XXXX)
2. Validate product and location exist
3. Get current stock level
4. Calculate quantity before and after
5. Calculate cost impact (quantity × unit cost)
6. Create adjustment record
7. Set status based on approval requirement
8. Mark as not posted

**Business Rules:**

- Adjustment number must be unique
- Cannot reduce below zero (unless allowed)
- Requires approval for significant adjustments
- Not posted until approved and posted

**Output:**

- Adjustment confirmation
- Adjustment number
- Projected quantity after

#### 3.9.2 Approve Stock Adjustment

**Requirement ID:** INV-FR-026
**Priority:** Medium

**Description:**
The system shall support approving stock adjustments.

**Input:**

- Adjustment ID

**Processing:**

- Validate adjustment not already approved
- Validate not already posted
- Mark as approved
- Record approver

**Output:**

- Approval confirmation

#### 3.9.3 Post Stock Adjustment

**Requirement ID:** INV-FR-027
**Priority:** High

**Description:**
The system shall post approved adjustments to stock.

**Input:**

- Adjustment ID

**Processing:**

1. Validate adjustment not already posted
2. Validate approved if approval required
3. Get stock level
4. Increase or decrease quantity
5. Create stock movement (ADJUSTMENT_IN or ADJUSTMENT_OUT)
6. Mark adjustment as posted
7. Record who posted and when

**Output:**

- Post confirmation
- Updated stock levels

#### 3.9.4 Search Stock Adjustments

**Requirement ID:** INV-FR-028
**Priority:** Medium

**Description:**
The system shall provide stock adjustment search.

**Search Parameters:**

- Product ID
- Location ID
- Reason filter
- Adjustment type filter
- Date range
- Posted status
- Approved status
- Pagination

**Output:**

- List of adjustments
- Adjustment details
- Status information

---

### 3.10 Stock Take Management

#### 3.10.1 Create Stock Take

**Requirement ID:** INV-FR-029
**Priority:** High

**Description:**
The system shall support creating stock take/physical count exercises.

**Input:**

- Location ID (required)
- Scheduled date
- Stock take type (FULL, PARTIAL, CYCLE_COUNT, etc.)
- Supervisor ID
- Supervisor name
- Acceptable variance percentage
- Notes

**Processing:**

1. Generate stock take number (format: ST-YYYYMMDD-XXXX)
2. Validate location exists
3. Create stock take header
4. Get all products in the location
5. Create stock take items for each product:
   - Product ID
   - System quantity (from stock level)
   - Unit cost
   - Mark as not counted
6. Calculate expected items count
7. Set status to SCHEDULED

**Business Rules:**

- Stock take number must be unique
- Creates snapshot of current stock
- Items auto-generated from location stock

**Output:**

- Stock take confirmation
- Stock take number
- Items to count

#### 3.10.2 Record Stock Count

**Requirement ID:** INV-FR-030
**Priority:** Critical

**Description:**
The system shall support recording actual physical counts.

**Input:**

- Stock take ID
- Item ID (specific product being counted)
- Actual quantity counted
- Condition notes
- Damaged items found (yes/no)
- Expired items found (yes/no)
- Notes

**Processing:**

1. Validate stock take in SCHEDULED or IN_PROGRESS
2. Get stock take item
3. Record actual quantity
4. Calculate variance (actual - system)
5. Calculate variance percentage
6. Determine if requires investigation (exceeds acceptable variance)
7. Mark as counted
8. Record counter and timestamp
9. Update stock take status to IN_PROGRESS if was SCHEDULED
10. Increment counted items count

**Output:**

- Count recorded confirmation
- Variance information

#### 3.10.3 Complete Stock Take

**Requirement ID:** INV-FR-031
**Priority:** High

**Description:**
The system shall support completing stock take.

**Input:**

- Stock take ID

**Processing:**

1. Validate stock take is IN_PROGRESS
2. Calculate totals:
   - Items with variance count
   - Total value variance
   - System stock value
   - Actual stock value
3. Set status to PENDING_REVIEW
4. Record completion time

**Output:**

- Completion confirmation
- Variance summary

#### 3.10.4 Post Stock Take Adjustments

**Requirement ID:** INV-FR-032
**Priority:** Critical

**Description:**
The system shall auto-create adjustments from stock take variances.

**Input:**

- Stock take ID

**Processing:**

1. Validate stock take is REVIEWED
2. For each item with variance:
   - Create stock adjustment
   - Set reason to STOCK_COUNT_VARIANCE
   - Set type (INCREASE or DECREASE)
   - Set quantity to variance absolute value
   - Set requires approval to false
   - Auto-approve
   - Auto-post to stock
   - Link adjustment to stock take item
   - Mark item as resolved
3. Update stock take status to COMPLETED
4. Record adjustments count and timestamp

**Business Rules:**

- Must be reviewed before posting
- Adjustments auto-approved
- Cannot post twice

**Output:**

- Post confirmation
- Adjustments created count
- Updated stock levels

#### 3.10.5 Search Stock Takes

**Requirement ID:** INV-FR-033
**Priority:** Medium

**Description:**
The system shall provide stock take search.

**Search Parameters:**

- Status filter
- Location ID
- Date range
- Has variances filter
- Pagination

**Output:**

- List of stock takes
- Stock take summaries
- Variance indicators

---

### 3.11 Dashboard and Reporting

#### 3.11.1 Inventory Dashboard

**Requirement ID:** INV-FR-034
**Priority:** High

**Description:**
The system shall provide comprehensive inventory dashboard.

**Output Metrics:**

1. **Product Metrics:**

   - Total active products
   - Products count

2. **Stock Metrics:**

   - Low stock items count
   - Out of stock items count
   - Expiring soon items count (next 30 days)

3. **Purchase Order Metrics:**

   - Pending approval POs count
   - Approved POs count
   - Total PO value (pending + approved)

4. **Stock Take Metrics:**

   - Scheduled stock takes count
   - In progress stock takes count
   - Pending review stock takes count

5. **GRN Metrics:**

   - Unposted GRNs count
   - GRNs value (unposted)

6. **Adjustment Metrics:**
   - Pending approval adjustments
   - Unapproved adjustments value

**Business Rules:**

- All metrics hotel-specific
- Real-time data
- Count-based for performance

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Dashboard loads within 3 seconds
- Search operations complete within 2 seconds
- Stock posting completes within 5 seconds
- Support 50+ concurrent users
- Handle 100,000+ products

### 4.2 Security

- Role-based access control
- Approval workflows enforced
- Hotel data isolation
- Audit trails for all transactions
- Stock movements are immutable

### 4.3 Data Integrity

- Stock levels always accurate
- Movements create audit trail
- Average cost calculated correctly
- Batch tracking maintained
- Expiry dates tracked

### 4.4 Usability

- RESTful API design
- Consistent response format
- Comprehensive validation
- Clear error messages
- Pagination support

---

## 5. Integration Points

- **Booking System:** Links GRNs and stock issues to bookings
- **Kitchen/Restaurant:** Receives issued stock
- **Bar:** Receives issued stock
- **Housekeeping:** Receives supplies
- **Financial System:** Cost tracking and reporting

---

## 6. Business Rules Summary

1. **Stock Movements:**

   - All movements create audit trail
   - Stock cannot go negative (unless configured)
   - Average cost calculated using weighted average
   - Batch tracking if enabled

2. **Approval Workflows:**

   - Purchase orders require approval
   - Stock adjustments require approval
   - Approver cannot be creator

3. **Posting:**

   - GRNs must be posted to update stock
   - Adjustments must be posted to update stock
   - Stock takes auto-create and post adjustments
   - Posted transactions are immutable

4. **Variances:**
   - Stock take variances tracked
   - Acceptable variance configurable
   - Variances require investigation if exceed threshold

---

## 7. API Endpoints Summary

### Basic Inventory

- POST /api/inventories/items - Add item
- POST /api/inventories/items/issue - Issue item
- GET /api/inventories/items - Search items
- GET /api/inventories/issued - Get issued stock
- POST /api/inventories/items/request-restock/{itemId} - Request restock
- GET /api/inventories/items/restock-requests - Get restock requests
- GET /api/inventories/summary - Get summary
- GET /api/inventories/items/list - Get all items (no pagination)

### Suppliers

- POST /api/inventories/suppliers - Add supplier
- GET /api/inventories/suppliers - Search suppliers
- PUT /api/inventories/{supplierId}/suppliers - Update supplier

### Deliveries

- POST /api/inventories/{supplierId}/deliveries - Add delivery
- PUT /api/inventories/{supplierId}/deliveries/{deliveryId} - Update delivery
- GET /api/inventories/deliveries - Search deliveries

### Products

- POST /api/inventories/products - Create product
- PUT /api/inventories/products/{productId} - Update product
- GET /api/inventories/products/{productId} - Get product
- GET /api/inventories/products - Search products
- DELETE /api/inventories/products/{productId} - Delete product

### Storage Locations

- POST /api/inventories/locations - Create location
- GET /api/inventories/locations - Search locations

### Stock Operations

- POST /api/inventories/stock/issue - Issue stock

### Purchase Orders

- POST /api/inventories/purchase-orders - Create PO
- POST /api/inventories/purchase-orders/{poId}/approve - Approve PO
- GET /api/inventories/purchase-orders - Search POs

### GRN

- POST /api/inventories/grn - Create GRN
- POST /api/inventories/grn/{grnId}/post-to-stock - Post to stock

### Stock Adjustments

- POST /api/inventories/adjustments - Create adjustment
- POST /api/inventories/adjustments/{adjustmentId}/approve - Approve adjustment
- POST /api/inventories/adjustments/{adjustmentId}/post - Post adjustment
- GET /api/inventories/adjustments - Search adjustments

### Stock Takes

- POST /api/inventories/stock-takes - Create stock take
- POST /api/inventories/stock-takes/{stockTakeId}/items/{itemId}/record-count - Record count
- POST /api/inventories/stock-takes/{stockTakeId}/complete - Complete stock take
- POST /api/inventories/stock-takes/{stockTakeId}/post-adjustments - Post adjustments
- GET /api/inventories/stock-takes - Search stock takes

### Dashboard

- GET /api/inventories/dashboard - Get dashboard

### Other

- POST /api/inventories/review-bar-restock/{requestId} - Review bar restock

---

## 8. Glossary

- **GRN:** Goods Receipt Note - document recording receipt of goods
- **SKU:** Stock Keeping Unit - unique product identifier
- **PO:** Purchase Order - document authorizing purchase
- **Stock Take:** Physical inventory count
- **Variance:** Difference between system and actual stock
- **Batch Tracking:** Tracking items by production batch
- **Weighted Average Cost:** Cost calculation method
- **Reorder Level:** Stock level triggering reorder
- **Stock Movement:** Any transaction affecting stock quantity

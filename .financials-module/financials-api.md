# Financials API Documentation (Fully Resolved)


# /api/financials/bookings/{bookingId}/detailed
## GET
**Summary:** Get comprehensive booking financial details (complete guest statement)

**Description:** N/A

### Parameters
- **bookingId** (path): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **bookingId** (string)
      - **customId** (string)
      - **roomIdentifier** (string)
      - **guestName** (string)
      - **guestPhoneNumber** (string)
      - **roomType** (string)
      - **checkInDate** (string)
      - **checkOutDate** (string)
      - **bookingStatus** (string)
      - **nightlyRate** (number)
      - **totalRoomRevenue** (number)
      - **amountPaid** (number)
      - **amountDue** (number)
      - **amountRemaining** (number)
      - **totalKitchenSales** (number)
      - **totalBarSales** (number)
      - **totalRestaurantRevenue** (number)
      - **totalLaundryCharges** (number)
      - **laundryOrdersCount** (integer)
      - **totalRentalCharges** (number)
      - **rentalOrdersCount** (integer)
      - **totalManualCharges** (number)
      - **manualChargesCount** (integer)
      - **grandTotal** (number)
      - **dailyBreakdown** (array) (object[] )
        - **date** (string)
        - **roomRevenue** (number)
        - **kitchenRevenue** (number)
        - **barRevenue** (number)
        - **totalRevenue** (number)
      - **kitchenItems** (array) (object[] )
        - **itemName** (string)
        - **quantity** (integer)
        - **unitPrice** (number)
        - **total** (number)
        - **saleType** (string)
        - **saleTime** (string)
      - **barItems** (array) (object[] )
        - **itemName** (string)
        - **quantity** (integer)
        - **unitPrice** (number)
        - **total** (number)
        - **saleType** (string)
        - **saleTime** (string)
      - **organizationName** (string)
      - **dailySpendingCap** (number)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/cash-flow
## GET
**Summary:** Get cash flow summary with inflows and outflows

**Description:** N/A

### Parameters
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **period** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **period** (string)
      - **cashFromOperations** (number)
      - **cashReceivedFromCustomers** (number)
      - **cashPaidToSuppliers** (number)
      - **cashPaidToEmployees** (number)
      - **cashPaidForOperatingExpenses** (number)
      - **netCashFromOperatingActivities** (number)
      - **cashFromRoomBookings** (number)
      - **cashFromRestaurants** (number)
      - **cashFromLaundry** (number)
      - **cashFromRentals** (number)
      - **cashFromOtherIncome** (number)
      - **cashForStaffCosts** (number)
      - **cashForUtilities** (number)
      - **cashForSupplies** (number)
      - **cashForMaintenance** (number)
      - **cashForMarketing** (number)
      - **cashForOtherExpenses** (number)
      - **accountsReceivable** (number)
      - **accountsPayable** (number)
      - **netReceivablesPayables** (number)
      - **openingCashBalance** (number)
      - **totalCashInflow** (number)
      - **totalCashOutflow** (number)
      - **netCashFlow** (number)
      - **closingCashBalance** (number)
      - **cashInHand** (number)
      - **bankBalance** (number)
      - **cardPayments** (number)
      - **mobileMoneyBalance** (number)
      - **otherPaymentMethods** (number)
      - **cashFlowFromRevenueRatio** (number)
      - **daysOfCashOnHand** (number)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/compare
## GET
**Summary:** Compare financial performance between two periods

**Description:** N/A

### Parameters
- **period1Start** (query): No description [string]
- **period1End** (query): No description [string]
- **period2Start** (query): No description [string]
- **period2End** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data** (object)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/dashboard
## GET
**Summary:** Get financial dashboard with key metrics and trends

**Description:** N/A

### Parameters
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **period** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **period** (string)
      - **totalRevenue** (number)
      - **totalExpenses** (number)
      - **netProfit** (number)
      - **netProfitMargin** (number)
      - **cashBalance** (number)
      - **revenueGrowth** (number)
      - **expenseGrowth** (number)
      - **profitGrowth** (number)
      - **topRevenueStreams** (array) (object[] )
        - **source** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageTransactionValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **refundedAmount** (number)
      - **topExpenseCategories** (array) (object[] )
        - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
        - **categoryDisplay** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageExpenseValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **overdueAmount** (number)
      - **totalOutstandingReceivables** (number)
      - **totalOverduePayables** (number)
      - **overdueExpendituresCount** (integer)
      - **totalCustomerTransactions** (integer)
      - **averageRevenuePerTransaction** (number)
      - **occupancyRate** (number)
      - **averageDailyRate** (number)
      - **revenuePerAvailableRoom** (number)
      - **financialAlerts** (array) (string[] )
      - **trendData** (array) (object[] )
        - **periodStart** (string)
        - **periodEnd** (string)
        - **periodLabel** (string)
        - **revenue** (number)
        - **expenses** (number)
        - **profit** (number)
        - **cashFlow** (number)
        - **profitMargin** (number)
        - **transactionCount** (integer)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/expenditures
## GET
**Summary:** Search and filter expenditures

**Description:** N/A

### Parameters
- **category** (query): No description [string]
- **status** (query): No description [string]
- **search** (query): No description [string]
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **pageable** (query): No description

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **content** (array) (object[] )
        - **id** (string)
        - **referenceNumber** (string)
        - **hotelId** (string)
        - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
        - **title** (string)
        - **description** (string)
        - **amount** (number)
        - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
        - **status** (string) (Enum: PENDING, APPROVED, PAID, PARTIALLY_PAID, REJECTED, CANCELLED, REFUNDED, OVERDUE, DISPUTED)
        - **expenseDate** (string)
        - **dueDate** (string)
        - **paidDate** (string)
        - **vendorName** (string)
        - **vendorContact** (string)
        - **vendorAddress** (string)
        - **invoiceNumber** (string)
        - **purchaseOrderNumber** (string)
        - **departmentId** (string)
        - **requestedBy** (string)
        - **approvedBy** (string)
        - **approvedAt** (string)
        - **amountPaid** (number)
        - **balanceDue** (number)
        - **paymentReference** (string)
        - **taxAmount** (number)
        - **taxType** (string)
        - **taxRate** (number)
        - **subtotal** (number)
        - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
        - **parentExpenditureId** (string)
        - **nextOccurrence** (string)
        - **receiptUrl** (string)
        - **attachmentUrls** (string)
        - **notes** (string)
        - **internalNotes** (string)
        - **accountCode** (string)
        - **costCenter** (string)
        - **budgetId** (string)
        - **budgetApproved** (boolean)
        - **rejectionReason** (string)
        - **cancellationReason** (string)
        - **createdAt** (string)
        - **updatedAt** (string)
        - **createdBy** (string)
        - **updatedBy** (string)
      - **pageNumber** (integer)
      - **pageSize** (integer)
      - **totalElements** (integer)
      - **totalPages** (integer)
      - **last** (boolean)
      - **first** (boolean)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/expenditures
## POST
**Summary:** Create a new expenditure record

**Description:** N/A

### Parameters
None

### Request Body
- **Content-Type:** application/json
  - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
  - **title** (string)
  - **description** (string)
  - **amount** (number)
  - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
  - **expenseDate** (string)
  - **dueDate** (string)
  - **vendorName** (string)
  - **vendorContact** (string)
  - **vendorAddress** (string)
  - **invoiceNumber** (string)
  - **purchaseOrderNumber** (string)
  - **departmentId** (string)
  - **requestedBy** (string)
  - **taxAmount** (number)
  - **taxType** (string)
  - **taxRate** (number)
  - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
  - **nextOccurrence** (string)
  - **receiptUrl** (string)
  - **attachmentUrls** (string)
  - **notes** (string)
  - **accountCode** (string)
  - **costCenter** (string)
  - **budgetId** (string)

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **id** (string)
      - **referenceNumber** (string)
      - **hotelId** (string)
      - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
      - **title** (string)
      - **description** (string)
      - **amount** (number)
      - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
      - **status** (string) (Enum: PENDING, APPROVED, PAID, PARTIALLY_PAID, REJECTED, CANCELLED, REFUNDED, OVERDUE, DISPUTED)
      - **expenseDate** (string)
      - **dueDate** (string)
      - **paidDate** (string)
      - **vendorName** (string)
      - **vendorContact** (string)
      - **vendorAddress** (string)
      - **invoiceNumber** (string)
      - **purchaseOrderNumber** (string)
      - **departmentId** (string)
      - **requestedBy** (string)
      - **approvedBy** (string)
      - **approvedAt** (string)
      - **amountPaid** (number)
      - **balanceDue** (number)
      - **paymentReference** (string)
      - **taxAmount** (number)
      - **taxType** (string)
      - **taxRate** (number)
      - **subtotal** (number)
      - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
      - **parentExpenditureId** (string)
      - **nextOccurrence** (string)
      - **receiptUrl** (string)
      - **attachmentUrls** (string)
      - **notes** (string)
      - **internalNotes** (string)
      - **accountCode** (string)
      - **costCenter** (string)
      - **budgetId** (string)
      - **budgetApproved** (boolean)
      - **rejectionReason** (string)
      - **cancellationReason** (string)
      - **createdAt** (string)
      - **updatedAt** (string)
      - **createdBy** (string)
      - **updatedBy** (string)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/expenditures/overdue
## GET
**Summary:** Get all overdue expenditures

**Description:** N/A

### Parameters
None

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data** (array) (object[] )
      - **id** (string)
      - **referenceNumber** (string)
      - **hotelId** (string)
      - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
      - **title** (string)
      - **description** (string)
      - **amount** (number)
      - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
      - **status** (string) (Enum: PENDING, APPROVED, PAID, PARTIALLY_PAID, REJECTED, CANCELLED, REFUNDED, OVERDUE, DISPUTED)
      - **expenseDate** (string)
      - **dueDate** (string)
      - **paidDate** (string)
      - **vendorName** (string)
      - **vendorContact** (string)
      - **vendorAddress** (string)
      - **invoiceNumber** (string)
      - **purchaseOrderNumber** (string)
      - **departmentId** (string)
      - **requestedBy** (string)
      - **approvedBy** (string)
      - **approvedAt** (string)
      - **amountPaid** (number)
      - **balanceDue** (number)
      - **paymentReference** (string)
      - **taxAmount** (number)
      - **taxType** (string)
      - **taxRate** (number)
      - **subtotal** (number)
      - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
      - **parentExpenditureId** (string)
      - **nextOccurrence** (string)
      - **receiptUrl** (string)
      - **attachmentUrls** (string)
      - **notes** (string)
      - **internalNotes** (string)
      - **accountCode** (string)
      - **costCenter** (string)
      - **budgetId** (string)
      - **budgetApproved** (boolean)
      - **rejectionReason** (string)
      - **cancellationReason** (string)
      - **createdAt** (string)
      - **updatedAt** (string)
      - **createdBy** (string)
      - **updatedBy** (string)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/expenditures/{id}
## GET
**Summary:** Get expenditure details by ID

**Description:** N/A

### Parameters
- **id** (path): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **id** (string)
      - **referenceNumber** (string)
      - **hotelId** (string)
      - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
      - **title** (string)
      - **description** (string)
      - **amount** (number)
      - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
      - **status** (string) (Enum: PENDING, APPROVED, PAID, PARTIALLY_PAID, REJECTED, CANCELLED, REFUNDED, OVERDUE, DISPUTED)
      - **expenseDate** (string)
      - **dueDate** (string)
      - **paidDate** (string)
      - **vendorName** (string)
      - **vendorContact** (string)
      - **vendorAddress** (string)
      - **invoiceNumber** (string)
      - **purchaseOrderNumber** (string)
      - **departmentId** (string)
      - **requestedBy** (string)
      - **approvedBy** (string)
      - **approvedAt** (string)
      - **amountPaid** (number)
      - **balanceDue** (number)
      - **paymentReference** (string)
      - **taxAmount** (number)
      - **taxType** (string)
      - **taxRate** (number)
      - **subtotal** (number)
      - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
      - **parentExpenditureId** (string)
      - **nextOccurrence** (string)
      - **receiptUrl** (string)
      - **attachmentUrls** (string)
      - **notes** (string)
      - **internalNotes** (string)
      - **accountCode** (string)
      - **costCenter** (string)
      - **budgetId** (string)
      - **budgetApproved** (boolean)
      - **rejectionReason** (string)
      - **cancellationReason** (string)
      - **createdAt** (string)
      - **updatedAt** (string)
      - **createdBy** (string)
      - **updatedBy** (string)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/expenditures/{id}/status
## PATCH
**Summary:** Update expenditure status

**Description:** N/A

### Parameters
- **id** (path): No description [string]
- **status** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **id** (string)
      - **referenceNumber** (string)
      - **hotelId** (string)
      - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
      - **title** (string)
      - **description** (string)
      - **amount** (number)
      - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
      - **status** (string) (Enum: PENDING, APPROVED, PAID, PARTIALLY_PAID, REJECTED, CANCELLED, REFUNDED, OVERDUE, DISPUTED)
      - **expenseDate** (string)
      - **dueDate** (string)
      - **paidDate** (string)
      - **vendorName** (string)
      - **vendorContact** (string)
      - **vendorAddress** (string)
      - **invoiceNumber** (string)
      - **purchaseOrderNumber** (string)
      - **departmentId** (string)
      - **requestedBy** (string)
      - **approvedBy** (string)
      - **approvedAt** (string)
      - **amountPaid** (number)
      - **balanceDue** (number)
      - **paymentReference** (string)
      - **taxAmount** (number)
      - **taxType** (string)
      - **taxRate** (number)
      - **subtotal** (number)
      - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
      - **parentExpenditureId** (string)
      - **nextOccurrence** (string)
      - **receiptUrl** (string)
      - **attachmentUrls** (string)
      - **notes** (string)
      - **internalNotes** (string)
      - **accountCode** (string)
      - **costCenter** (string)
      - **budgetId** (string)
      - **budgetApproved** (boolean)
      - **rejectionReason** (string)
      - **cancellationReason** (string)
      - **createdAt** (string)
      - **updatedAt** (string)
      - **createdBy** (string)
      - **updatedBy** (string)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/expenses
## GET
**Summary:** Get consolidated expenses from all categories

**Description:** N/A

### Parameters
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **period** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **period** (string)
      - **totalExpenses** (number)
      - **totalPaidExpenses** (number)
      - **totalPendingExpenses** (number)
      - **totalOverdueExpenses** (number)
      - **staffCosts** (number)
      - **operationalCosts** (number)
      - **marketingCosts** (number)
      - **administrativeCosts** (number)
      - **financialCosts** (number)
      - **otherCosts** (number)
      - **totalExpenseTransactions** (integer)
      - **expensesByCategory** (array) (object[] )
        - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
        - **categoryDisplay** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageExpenseValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **overdueAmount** (number)
      - **expenseGrowthPercentage** (number)
      - **expenseGrowthAmount** (number)
      - **averageDailyExpense** (number)
      - **averageExpenseValue** (number)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/items/consumption-report
## GET
**Summary:** Get comprehensive item consumption report

**Description:** N/A

### Parameters
- **hotelId** (query): No description [string]
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **itemType** (query): No description [string]
- **page** (query): No description [integer]
- **size** (query): No description [integer]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **startDate** (string)
      - **endDate** (string)
      - **hotelId** (string)
      - **itemTypeFilter** (string) (Enum: DRINK, FOOD)
      - **summary**
        - **totalUniqueItems** (integer)
        - **totalFoodItems** (integer)
        - **totalDrinkItems** (integer)
        - **totalQuantityConsumed** (integer)
        - **totalRevenue** (number)
        - **totalOrders** (integer)
        - **topSellingItemByQuantity** (string)
        - **topSellingItemQuantity** (integer)
        - **topSellingItemByRevenue** (string)
        - **topSellingItemRevenue** (number)
        - **foodRevenue** (number)
        - **drinkRevenue** (number)
        - **foodPercentage** (number)
        - **drinkPercentage** (number)
      - **items** (array) (object[] )
        - **itemName** (string)
        - **itemType** (string) (Enum: DRINK, FOOD)
        - **totalQuantityConsumed** (integer)
        - **numberOfOrders** (integer)
        - **averageQuantityPerOrder** (number)
        - **totalRevenue** (number)
        - **averagePrice** (number)
        - **highestPrice** (number)
        - **lowestPrice** (number)
        - **consumptionByDestination** (array) (object[] )
          - **destination** (string)
          - **quantity** (integer)
          - **revenue** (number)
          - **orderCount** (integer)
          - **percentageOfTotal** (number)
        - **revenueRank** (integer)
        - **quantityRank** (integer)
      - **currentPage** (integer)
      - **pageSize** (integer)
      - **totalItems** (integer)
      - **totalPages** (integer)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/monthly-summary
## GET
**Summary:** Get current month financial summary

**Description:** N/A

### Parameters
None

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **period** (string)
      - **totalRevenue** (number)
      - **totalExpenses** (number)
      - **netProfit** (number)
      - **netProfitMargin** (number)
      - **cashBalance** (number)
      - **revenueGrowth** (number)
      - **expenseGrowth** (number)
      - **profitGrowth** (number)
      - **topRevenueStreams** (array) (object[] )
        - **source** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageTransactionValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **refundedAmount** (number)
      - **topExpenseCategories** (array) (object[] )
        - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
        - **categoryDisplay** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageExpenseValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **overdueAmount** (number)
      - **totalOutstandingReceivables** (number)
      - **totalOverduePayables** (number)
      - **overdueExpendituresCount** (integer)
      - **totalCustomerTransactions** (integer)
      - **averageRevenuePerTransaction** (number)
      - **occupancyRate** (number)
      - **averageDailyRate** (number)
      - **revenuePerAvailableRoom** (number)
      - **financialAlerts** (array) (string[] )
      - **trendData** (array) (object[] )
        - **periodStart** (string)
        - **periodEnd** (string)
        - **periodLabel** (string)
        - **revenue** (number)
        - **expenses** (number)
        - **profit** (number)
        - **cashFlow** (number)
        - **profitMargin** (number)
        - **transactionCount** (integer)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/other-income
## GET
**Summary:** Search and filter other income

**Description:** N/A

### Parameters
- **category** (query): No description [string]
- **status** (query): No description [string]
- **search** (query): No description [string]
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **pageable** (query): No description

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **content** (array) (object[] )
        - **id** (string)
        - **referenceNumber** (string)
        - **hotelId** (string)
        - **category** (string) (Enum: EVENT_HOSTING, MEETING_ROOM_RENTAL, BANQUET_SERVICES, VENUE_DECORATION, SPA_SERVICES, GYM_MEMBERSHIP, SWIMMING_POOL_ACCESS, YOGA_CLASSES, WELLNESS_PACKAGES, AIRPORT_SHUTTLE, TAXI_SERVICE, CAR_RENTAL, VALET_PARKING, PARKING_FEES, GIFT_SHOP_SALES, SOUVENIR_SALES, NEWSPAPER_SALES, SNACK_SALES, LIVE_ENTERTAINMENT, GAME_ROOM, MOVIE_NIGHTS, TOUR_PACKAGES, EXCURSION_BOOKING, BUSINESS_CENTER, PRINTING_AND_COPYING, FAX_SERVICES, INTERNET_ACCESS_FEES, SECRETARIAL_SERVICES, TELEPHONE_CHARGES, INTERNATIONAL_CALLS, MOBILE_CHARGING, PET_CARE, BABYSITTING, CONCIERGE_SERVICES, PERSONAL_SHOPPING, PHOTOGRAPHY_SERVICES, ADVERTISING_SPACE, ROOFTOP_ACCESS, TERRACE_RENTAL, STORAGE_RENTAL, GAMING_CONSOLE_RENTAL, LAPTOP_RENTAL, PROJECTOR_RENTAL, LUGGAGE_STORAGE, SAFE_DEPOSIT_BOX, LOST_AND_FOUND_FEES, EARLY_CHECKIN_FEES, LATE_CHECKOUT_FEES, KEY_REPLACEMENT, TOUR_OPERATOR_COMMISSION, TRAVEL_AGENT_COMMISSION, AFFILIATE_INCOME, REFERRAL_INCOME, INTEREST_INCOME, INVESTMENT_RETURNS, DIVIDEND_INCOME, INSURANCE_CLAIMS, DAMAGE_COMPENSATION, VENDOR_REBATES, OTHERS)
        - **title** (string)
        - **description** (string)
        - **amount** (number)
        - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
        - **status** (string) (Enum: PENDING, APPROVED, PAID, PARTIALLY_PAID, REJECTED, CANCELLED, REFUNDED, OVERDUE, DISPUTED)
        - **incomeDate** (string)
        - **receivedDate** (string)
        - **customerName** (string)
        - **customerContact** (string)
        - **customerAddress** (string)
        - **bookingId** (string)
        - **roomIdentifier** (string)
        - **organizationId** (string)
        - **organizationName** (string)
        - **invoiceNumber** (string)
        - **receiptNumber** (string)
        - **amountReceived** (number)
        - **balanceDue** (number)
        - **paymentReference** (string)
        - **taxAmount** (number)
        - **taxType** (string)
        - **taxRate** (number)
        - **subtotal** (number)
        - **commissionAmount** (number)
        - **commissionRate** (number)
        - **commissionPayee** (string)
        - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
        - **parentIncomeId** (string)
        - **nextOccurrence** (string)
        - **departmentId** (string)
        - **servedBy** (string)
        - **recordedBy** (string)
        - **invoiceUrl** (string)
        - **attachmentUrls** (string)
        - **notes** (string)
        - **internalNotes** (string)
        - **accountCode** (string)
        - **revenueCenter** (string)
        - **refunded** (boolean)
        - **refundAmount** (number)
        - **refundDate** (string)
        - **refundReason** (string)
        - **cancellationReason** (string)
        - **createdAt** (string)
        - **updatedAt** (string)
        - **createdBy** (string)
        - **updatedBy** (string)
      - **pageNumber** (integer)
      - **pageSize** (integer)
      - **totalElements** (integer)
      - **totalPages** (integer)
      - **last** (boolean)
      - **first** (boolean)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/other-income
## POST
**Summary:** Create a new other income record

**Description:** N/A

### Parameters
None

### Request Body
- **Content-Type:** application/json
  - **category** (string) (Enum: EVENT_HOSTING, MEETING_ROOM_RENTAL, BANQUET_SERVICES, VENUE_DECORATION, SPA_SERVICES, GYM_MEMBERSHIP, SWIMMING_POOL_ACCESS, YOGA_CLASSES, WELLNESS_PACKAGES, AIRPORT_SHUTTLE, TAXI_SERVICE, CAR_RENTAL, VALET_PARKING, PARKING_FEES, GIFT_SHOP_SALES, SOUVENIR_SALES, NEWSPAPER_SALES, SNACK_SALES, LIVE_ENTERTAINMENT, GAME_ROOM, MOVIE_NIGHTS, TOUR_PACKAGES, EXCURSION_BOOKING, BUSINESS_CENTER, PRINTING_AND_COPYING, FAX_SERVICES, INTERNET_ACCESS_FEES, SECRETARIAL_SERVICES, TELEPHONE_CHARGES, INTERNATIONAL_CALLS, MOBILE_CHARGING, PET_CARE, BABYSITTING, CONCIERGE_SERVICES, PERSONAL_SHOPPING, PHOTOGRAPHY_SERVICES, ADVERTISING_SPACE, ROOFTOP_ACCESS, TERRACE_RENTAL, STORAGE_RENTAL, GAMING_CONSOLE_RENTAL, LAPTOP_RENTAL, PROJECTOR_RENTAL, LUGGAGE_STORAGE, SAFE_DEPOSIT_BOX, LOST_AND_FOUND_FEES, EARLY_CHECKIN_FEES, LATE_CHECKOUT_FEES, KEY_REPLACEMENT, TOUR_OPERATOR_COMMISSION, TRAVEL_AGENT_COMMISSION, AFFILIATE_INCOME, REFERRAL_INCOME, INTEREST_INCOME, INVESTMENT_RETURNS, DIVIDEND_INCOME, INSURANCE_CLAIMS, DAMAGE_COMPENSATION, VENDOR_REBATES, OTHERS)
  - **title** (string)
  - **description** (string)
  - **amount** (number)
  - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
  - **incomeDate** (string)
  - **receivedDate** (string)
  - **customerName** (string)
  - **customerContact** (string)
  - **customerAddress** (string)
  - **bookingId** (string)
  - **roomIdentifier** (string)
  - **organizationId** (string)
  - **invoiceNumber** (string)
  - **receiptNumber** (string)
  - **taxAmount** (number)
  - **taxType** (string)
  - **taxRate** (number)
  - **commissionAmount** (number)
  - **commissionRate** (number)
  - **commissionPayee** (string)
  - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
  - **nextOccurrence** (string)
  - **departmentId** (string)
  - **servedBy** (string)
  - **invoiceUrl** (string)
  - **attachmentUrls** (string)
  - **notes** (string)
  - **accountCode** (string)
  - **revenueCenter** (string)

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **id** (string)
      - **referenceNumber** (string)
      - **hotelId** (string)
      - **category** (string) (Enum: EVENT_HOSTING, MEETING_ROOM_RENTAL, BANQUET_SERVICES, VENUE_DECORATION, SPA_SERVICES, GYM_MEMBERSHIP, SWIMMING_POOL_ACCESS, YOGA_CLASSES, WELLNESS_PACKAGES, AIRPORT_SHUTTLE, TAXI_SERVICE, CAR_RENTAL, VALET_PARKING, PARKING_FEES, GIFT_SHOP_SALES, SOUVENIR_SALES, NEWSPAPER_SALES, SNACK_SALES, LIVE_ENTERTAINMENT, GAME_ROOM, MOVIE_NIGHTS, TOUR_PACKAGES, EXCURSION_BOOKING, BUSINESS_CENTER, PRINTING_AND_COPYING, FAX_SERVICES, INTERNET_ACCESS_FEES, SECRETARIAL_SERVICES, TELEPHONE_CHARGES, INTERNATIONAL_CALLS, MOBILE_CHARGING, PET_CARE, BABYSITTING, CONCIERGE_SERVICES, PERSONAL_SHOPPING, PHOTOGRAPHY_SERVICES, ADVERTISING_SPACE, ROOFTOP_ACCESS, TERRACE_RENTAL, STORAGE_RENTAL, GAMING_CONSOLE_RENTAL, LAPTOP_RENTAL, PROJECTOR_RENTAL, LUGGAGE_STORAGE, SAFE_DEPOSIT_BOX, LOST_AND_FOUND_FEES, EARLY_CHECKIN_FEES, LATE_CHECKOUT_FEES, KEY_REPLACEMENT, TOUR_OPERATOR_COMMISSION, TRAVEL_AGENT_COMMISSION, AFFILIATE_INCOME, REFERRAL_INCOME, INTEREST_INCOME, INVESTMENT_RETURNS, DIVIDEND_INCOME, INSURANCE_CLAIMS, DAMAGE_COMPENSATION, VENDOR_REBATES, OTHERS)
      - **title** (string)
      - **description** (string)
      - **amount** (number)
      - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
      - **status** (string) (Enum: PENDING, APPROVED, PAID, PARTIALLY_PAID, REJECTED, CANCELLED, REFUNDED, OVERDUE, DISPUTED)
      - **incomeDate** (string)
      - **receivedDate** (string)
      - **customerName** (string)
      - **customerContact** (string)
      - **customerAddress** (string)
      - **bookingId** (string)
      - **roomIdentifier** (string)
      - **organizationId** (string)
      - **organizationName** (string)
      - **invoiceNumber** (string)
      - **receiptNumber** (string)
      - **amountReceived** (number)
      - **balanceDue** (number)
      - **paymentReference** (string)
      - **taxAmount** (number)
      - **taxType** (string)
      - **taxRate** (number)
      - **subtotal** (number)
      - **commissionAmount** (number)
      - **commissionRate** (number)
      - **commissionPayee** (string)
      - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
      - **parentIncomeId** (string)
      - **nextOccurrence** (string)
      - **departmentId** (string)
      - **servedBy** (string)
      - **recordedBy** (string)
      - **invoiceUrl** (string)
      - **attachmentUrls** (string)
      - **notes** (string)
      - **internalNotes** (string)
      - **accountCode** (string)
      - **revenueCenter** (string)
      - **refunded** (boolean)
      - **refundAmount** (number)
      - **refundDate** (string)
      - **refundReason** (string)
      - **cancellationReason** (string)
      - **createdAt** (string)
      - **updatedAt** (string)
      - **createdBy** (string)
      - **updatedBy** (string)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/other-income/booking/{bookingId}
## GET
**Summary:** Get other income associated with a booking

**Description:** N/A

### Parameters
- **bookingId** (path): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data** (array) (object[] )
      - **id** (string)
      - **referenceNumber** (string)
      - **hotelId** (string)
      - **category** (string) (Enum: EVENT_HOSTING, MEETING_ROOM_RENTAL, BANQUET_SERVICES, VENUE_DECORATION, SPA_SERVICES, GYM_MEMBERSHIP, SWIMMING_POOL_ACCESS, YOGA_CLASSES, WELLNESS_PACKAGES, AIRPORT_SHUTTLE, TAXI_SERVICE, CAR_RENTAL, VALET_PARKING, PARKING_FEES, GIFT_SHOP_SALES, SOUVENIR_SALES, NEWSPAPER_SALES, SNACK_SALES, LIVE_ENTERTAINMENT, GAME_ROOM, MOVIE_NIGHTS, TOUR_PACKAGES, EXCURSION_BOOKING, BUSINESS_CENTER, PRINTING_AND_COPYING, FAX_SERVICES, INTERNET_ACCESS_FEES, SECRETARIAL_SERVICES, TELEPHONE_CHARGES, INTERNATIONAL_CALLS, MOBILE_CHARGING, PET_CARE, BABYSITTING, CONCIERGE_SERVICES, PERSONAL_SHOPPING, PHOTOGRAPHY_SERVICES, ADVERTISING_SPACE, ROOFTOP_ACCESS, TERRACE_RENTAL, STORAGE_RENTAL, GAMING_CONSOLE_RENTAL, LAPTOP_RENTAL, PROJECTOR_RENTAL, LUGGAGE_STORAGE, SAFE_DEPOSIT_BOX, LOST_AND_FOUND_FEES, EARLY_CHECKIN_FEES, LATE_CHECKOUT_FEES, KEY_REPLACEMENT, TOUR_OPERATOR_COMMISSION, TRAVEL_AGENT_COMMISSION, AFFILIATE_INCOME, REFERRAL_INCOME, INTEREST_INCOME, INVESTMENT_RETURNS, DIVIDEND_INCOME, INSURANCE_CLAIMS, DAMAGE_COMPENSATION, VENDOR_REBATES, OTHERS)
      - **title** (string)
      - **description** (string)
      - **amount** (number)
      - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
      - **status** (string) (Enum: PENDING, APPROVED, PAID, PARTIALLY_PAID, REJECTED, CANCELLED, REFUNDED, OVERDUE, DISPUTED)
      - **incomeDate** (string)
      - **receivedDate** (string)
      - **customerName** (string)
      - **customerContact** (string)
      - **customerAddress** (string)
      - **bookingId** (string)
      - **roomIdentifier** (string)
      - **organizationId** (string)
      - **organizationName** (string)
      - **invoiceNumber** (string)
      - **receiptNumber** (string)
      - **amountReceived** (number)
      - **balanceDue** (number)
      - **paymentReference** (string)
      - **taxAmount** (number)
      - **taxType** (string)
      - **taxRate** (number)
      - **subtotal** (number)
      - **commissionAmount** (number)
      - **commissionRate** (number)
      - **commissionPayee** (string)
      - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
      - **parentIncomeId** (string)
      - **nextOccurrence** (string)
      - **departmentId** (string)
      - **servedBy** (string)
      - **recordedBy** (string)
      - **invoiceUrl** (string)
      - **attachmentUrls** (string)
      - **notes** (string)
      - **internalNotes** (string)
      - **accountCode** (string)
      - **revenueCenter** (string)
      - **refunded** (boolean)
      - **refundAmount** (number)
      - **refundDate** (string)
      - **refundReason** (string)
      - **cancellationReason** (string)
      - **createdAt** (string)
      - **updatedAt** (string)
      - **createdBy** (string)
      - **updatedBy** (string)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/other-income/{id}
## GET
**Summary:** Get other income details by ID

**Description:** N/A

### Parameters
- **id** (path): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **id** (string)
      - **referenceNumber** (string)
      - **hotelId** (string)
      - **category** (string) (Enum: EVENT_HOSTING, MEETING_ROOM_RENTAL, BANQUET_SERVICES, VENUE_DECORATION, SPA_SERVICES, GYM_MEMBERSHIP, SWIMMING_POOL_ACCESS, YOGA_CLASSES, WELLNESS_PACKAGES, AIRPORT_SHUTTLE, TAXI_SERVICE, CAR_RENTAL, VALET_PARKING, PARKING_FEES, GIFT_SHOP_SALES, SOUVENIR_SALES, NEWSPAPER_SALES, SNACK_SALES, LIVE_ENTERTAINMENT, GAME_ROOM, MOVIE_NIGHTS, TOUR_PACKAGES, EXCURSION_BOOKING, BUSINESS_CENTER, PRINTING_AND_COPYING, FAX_SERVICES, INTERNET_ACCESS_FEES, SECRETARIAL_SERVICES, TELEPHONE_CHARGES, INTERNATIONAL_CALLS, MOBILE_CHARGING, PET_CARE, BABYSITTING, CONCIERGE_SERVICES, PERSONAL_SHOPPING, PHOTOGRAPHY_SERVICES, ADVERTISING_SPACE, ROOFTOP_ACCESS, TERRACE_RENTAL, STORAGE_RENTAL, GAMING_CONSOLE_RENTAL, LAPTOP_RENTAL, PROJECTOR_RENTAL, LUGGAGE_STORAGE, SAFE_DEPOSIT_BOX, LOST_AND_FOUND_FEES, EARLY_CHECKIN_FEES, LATE_CHECKOUT_FEES, KEY_REPLACEMENT, TOUR_OPERATOR_COMMISSION, TRAVEL_AGENT_COMMISSION, AFFILIATE_INCOME, REFERRAL_INCOME, INTEREST_INCOME, INVESTMENT_RETURNS, DIVIDEND_INCOME, INSURANCE_CLAIMS, DAMAGE_COMPENSATION, VENDOR_REBATES, OTHERS)
      - **title** (string)
      - **description** (string)
      - **amount** (number)
      - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
      - **status** (string) (Enum: PENDING, APPROVED, PAID, PARTIALLY_PAID, REJECTED, CANCELLED, REFUNDED, OVERDUE, DISPUTED)
      - **incomeDate** (string)
      - **receivedDate** (string)
      - **customerName** (string)
      - **customerContact** (string)
      - **customerAddress** (string)
      - **bookingId** (string)
      - **roomIdentifier** (string)
      - **organizationId** (string)
      - **organizationName** (string)
      - **invoiceNumber** (string)
      - **receiptNumber** (string)
      - **amountReceived** (number)
      - **balanceDue** (number)
      - **paymentReference** (string)
      - **taxAmount** (number)
      - **taxType** (string)
      - **taxRate** (number)
      - **subtotal** (number)
      - **commissionAmount** (number)
      - **commissionRate** (number)
      - **commissionPayee** (string)
      - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
      - **parentIncomeId** (string)
      - **nextOccurrence** (string)
      - **departmentId** (string)
      - **servedBy** (string)
      - **recordedBy** (string)
      - **invoiceUrl** (string)
      - **attachmentUrls** (string)
      - **notes** (string)
      - **internalNotes** (string)
      - **accountCode** (string)
      - **revenueCenter** (string)
      - **refunded** (boolean)
      - **refundAmount** (number)
      - **refundDate** (string)
      - **refundReason** (string)
      - **cancellationReason** (string)
      - **createdAt** (string)
      - **updatedAt** (string)
      - **createdBy** (string)
      - **updatedBy** (string)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/other-income/{id}/status
## PATCH
**Summary:** Update other income status

**Description:** N/A

### Parameters
- **id** (path): No description [string]
- **status** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **id** (string)
      - **referenceNumber** (string)
      - **hotelId** (string)
      - **category** (string) (Enum: EVENT_HOSTING, MEETING_ROOM_RENTAL, BANQUET_SERVICES, VENUE_DECORATION, SPA_SERVICES, GYM_MEMBERSHIP, SWIMMING_POOL_ACCESS, YOGA_CLASSES, WELLNESS_PACKAGES, AIRPORT_SHUTTLE, TAXI_SERVICE, CAR_RENTAL, VALET_PARKING, PARKING_FEES, GIFT_SHOP_SALES, SOUVENIR_SALES, NEWSPAPER_SALES, SNACK_SALES, LIVE_ENTERTAINMENT, GAME_ROOM, MOVIE_NIGHTS, TOUR_PACKAGES, EXCURSION_BOOKING, BUSINESS_CENTER, PRINTING_AND_COPYING, FAX_SERVICES, INTERNET_ACCESS_FEES, SECRETARIAL_SERVICES, TELEPHONE_CHARGES, INTERNATIONAL_CALLS, MOBILE_CHARGING, PET_CARE, BABYSITTING, CONCIERGE_SERVICES, PERSONAL_SHOPPING, PHOTOGRAPHY_SERVICES, ADVERTISING_SPACE, ROOFTOP_ACCESS, TERRACE_RENTAL, STORAGE_RENTAL, GAMING_CONSOLE_RENTAL, LAPTOP_RENTAL, PROJECTOR_RENTAL, LUGGAGE_STORAGE, SAFE_DEPOSIT_BOX, LOST_AND_FOUND_FEES, EARLY_CHECKIN_FEES, LATE_CHECKOUT_FEES, KEY_REPLACEMENT, TOUR_OPERATOR_COMMISSION, TRAVEL_AGENT_COMMISSION, AFFILIATE_INCOME, REFERRAL_INCOME, INTEREST_INCOME, INVESTMENT_RETURNS, DIVIDEND_INCOME, INSURANCE_CLAIMS, DAMAGE_COMPENSATION, VENDOR_REBATES, OTHERS)
      - **title** (string)
      - **description** (string)
      - **amount** (number)
      - **paymentMethod** (string) (Enum: CASH, CARD, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, ONLINE_PAYMENT, PAYPAL, CRYPTOCURRENCY, DIRECT_DEBIT, PETTY_CASH, OTHERS)
      - **status** (string) (Enum: PENDING, APPROVED, PAID, PARTIALLY_PAID, REJECTED, CANCELLED, REFUNDED, OVERDUE, DISPUTED)
      - **incomeDate** (string)
      - **receivedDate** (string)
      - **customerName** (string)
      - **customerContact** (string)
      - **customerAddress** (string)
      - **bookingId** (string)
      - **roomIdentifier** (string)
      - **organizationId** (string)
      - **organizationName** (string)
      - **invoiceNumber** (string)
      - **receiptNumber** (string)
      - **amountReceived** (number)
      - **balanceDue** (number)
      - **paymentReference** (string)
      - **taxAmount** (number)
      - **taxType** (string)
      - **taxRate** (number)
      - **subtotal** (number)
      - **commissionAmount** (number)
      - **commissionRate** (number)
      - **commissionPayee** (string)
      - **recurrenceType** (string) (Enum: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
      - **parentIncomeId** (string)
      - **nextOccurrence** (string)
      - **departmentId** (string)
      - **servedBy** (string)
      - **recordedBy** (string)
      - **invoiceUrl** (string)
      - **attachmentUrls** (string)
      - **notes** (string)
      - **internalNotes** (string)
      - **accountCode** (string)
      - **revenueCenter** (string)
      - **refunded** (boolean)
      - **refundAmount** (number)
      - **refundDate** (string)
      - **refundReason** (string)
      - **cancellationReason** (string)
      - **createdAt** (string)
      - **updatedAt** (string)
      - **createdBy** (string)
      - **updatedBy** (string)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/profit-and-loss
## GET
**Summary:** Get comprehensive profit and loss statement

**Description:** N/A

### Parameters
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **period** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **period** (string)
      - **grossRevenue** (number)
      - **refunds** (number)
      - **netRevenue** (number)
      - **roomRevenue** (number)
      - **foodAndBeverageRevenue** (number)
      - **laundryRevenue** (number)
      - **rentalRevenue** (number)
      - **otherRevenue** (number)
      - **costOfGoodsSold** (number)
      - **grossProfit** (number)
      - **grossProfitMargin** (number)
      - **staffExpenses** (number)
      - **utilitiesExpenses** (number)
      - **maintenanceExpenses** (number)
      - **marketingExpenses** (number)
      - **administrativeExpenses** (number)
      - **depreciationExpenses** (number)
      - **insuranceExpenses** (number)
      - **otherOperatingExpenses** (number)
      - **totalOperatingExpenses** (number)
      - **operatingProfit** (number)
      - **operatingProfitMargin** (number)
      - **interestIncome** (number)
      - **interestExpense** (number)
      - **otherIncome** (number)
      - **otherExpenses** (number)
      - **netNonOperatingItems** (number)
      - **profitBeforeTax** (number)
      - **taxExpense** (number)
      - **netProfit** (number)
      - **netProfitMargin** (number)
      - **netProfitGrowthPercentage** (number)
      - **netProfitGrowthAmount** (number)
      - **revenuePerAvailableRoom** (number)
      - **expenseToRevenueRatio** (number)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/quarterly-summary
## GET
**Summary:** Get current quarter financial summary

**Description:** N/A

### Parameters
None

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **period** (string)
      - **totalRevenue** (number)
      - **totalExpenses** (number)
      - **netProfit** (number)
      - **netProfitMargin** (number)
      - **cashBalance** (number)
      - **revenueGrowth** (number)
      - **expenseGrowth** (number)
      - **profitGrowth** (number)
      - **topRevenueStreams** (array) (object[] )
        - **source** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageTransactionValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **refundedAmount** (number)
      - **topExpenseCategories** (array) (object[] )
        - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
        - **categoryDisplay** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageExpenseValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **overdueAmount** (number)
      - **totalOutstandingReceivables** (number)
      - **totalOverduePayables** (number)
      - **overdueExpendituresCount** (integer)
      - **totalCustomerTransactions** (integer)
      - **averageRevenuePerTransaction** (number)
      - **occupancyRate** (number)
      - **averageDailyRate** (number)
      - **revenuePerAvailableRoom** (number)
      - **financialAlerts** (array) (string[] )
      - **trendData** (array) (object[] )
        - **periodStart** (string)
        - **periodEnd** (string)
        - **periodLabel** (string)
        - **revenue** (number)
        - **expenses** (number)
        - **profit** (number)
        - **cashFlow** (number)
        - **profitMargin** (number)
        - **transactionCount** (integer)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/restaurant/daily-summary
## GET
**Summary:** Get enhanced restaurant daily summary with statistics

**Description:** N/A

### Parameters
- **hotelId** (query): No description [string]
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **destination** (query): No description [string]
- **search** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **startDate** (string)
      - **endDate** (string)
      - **totalDays** (integer)
      - **periodTotals**
        - **totalRevenue** (number)
        - **averageDailyRevenue** (number)
        - **highestDayRevenue** (number)
        - **lowestDayRevenue** (number)
        - **totalOrders** (integer)
        - **totalItemsSold** (integer)
      - **dailySummaries** (array) (object[] )
        - **date** (string)
        - **totalsByDestination** (array) (object[] )
          - **location** (string)
          - **amount** (number)
        - **dayTotal** (number)
      - **totalsByDestination** (array) (object[] )
        - **location** (string)
        - **amount** (number)
      - **statistics**
        - **peakRevenueDate** (string)
        - **peakRevenue** (number)
        - **lowestRevenueDate** (string)
        - **lowestRevenue** (number)
        - **mostPopularDestination** (string)
        - **mostPopularDestinationRevenue** (number)
        - **dayOfWeekPerformance** (array) (object[] )
          - **dayOfWeek** (string)
          - **averageRevenue** (number)
          - **orderCount** (integer)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/restaurant/daily-summary/paginated
## GET
**Summary:** Get restaurant daily summary (paginated, legacy)

**Description:** N/A

### Parameters
- **hotelId** (query): No description [string]
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **destination** (query): No description [string]
- **search** (query): No description [string]
- **page** (query): No description [integer]
- **size** (query): No description [integer]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **content** (array) (object[] )
        - **date** (string)
        - **totalsByDestination** (array) (object[] )
          - **location** (string)
          - **amount** (number)
        - **dayTotal** (number)
      - **pageNumber** (integer)
      - **pageSize** (integer)
      - **totalElements** (integer)
      - **totalPages** (integer)
      - **last** (boolean)
      - **first** (boolean)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/restaurant/detailed-report
## GET
**Summary:** Get detailed restaurant report with analytics

**Description:** N/A

### Parameters
- **hotelId** (query): No description [string]
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **startDate** (string)
      - **endDate** (string)
      - **totalKitchenSales** (number)
      - **totalBarSales** (number)
      - **totalRevenue** (number)
      - **totalOrders** (integer)
      - **totalItemsSold** (integer)
      - **salesByDestination** (array) (object[] )
        - **location** (string)
        - **amount** (number)
      - **dailySummary** (array) (object[] )
        - **date** (string)
        - **totalsByDestination** (array) (object[] )
          - **location** (string)
          - **amount** (number)
        - **dayTotal** (number)
      - **topKitchenItems** (array) (object[] )
        - **itemName** (string)
        - **quantitySold** (integer)
        - **totalRevenue** (number)
        - **averagePrice** (number)
        - **numberOfOrders** (integer)
      - **topBarItems** (array) (object[] )
        - **itemName** (string)
        - **quantitySold** (integer)
        - **totalRevenue** (number)
        - **averagePrice** (number)
        - **numberOfOrders** (integer)
      - **salesByTimeOfDay** (array) (object[] )
        - **timeSlot** (string)
        - **amount** (number)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/restaurant/item-sales-detail
## GET
**Summary:** Get item-level sales details with booking context

**Description:** N/A

### Parameters
- **hotelId** (query): No description [string]
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **search** (query): No description [string]
- **page** (query): No description [integer]
- **size** (query): No description [integer]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **content** (array) (object[] )
        - **saleId** (string)
        - **saleTime** (string)
        - **itemName** (string)
        - **quantity** (integer)
        - **unitPrice** (number)
        - **totalAmount** (number)
        - **destination** (string)
        - **bookingId** (string)
        - **roomIdentifier** (string)
        - **guestName** (string)
        - **organizationName** (string)
      - **pageNumber** (integer)
      - **pageSize** (integer)
      - **totalElements** (integer)
      - **totalPages** (integer)
      - **last** (boolean)
      - **first** (boolean)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/restaurant/room-food-sales
## GET
**Summary:** Get room food sales report

**Description:** N/A

### Parameters
- **hotelId** (query): No description [string]
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **search** (query): No description [string]
- **page** (query): No description [integer]
- **size** (query): No description [integer]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **content** (array) (object[] )
        - **bookingId** (string)
        - **roomIdentifier** (string)
        - **guestName** (string)
        - **guestPhoneNumber** (string)
        - **checkInDate** (string)
        - **checkOutDate** (string)
        - **numberOfAdults** (integer)
        - **numberOfChildren** (integer)
        - **daily** (array) (object[] )
          - **date** (string)
          - **totalAmount** (number)
        - **totalAmount** (number)
      - **pageNumber** (integer)
      - **pageSize** (integer)
      - **totalElements** (integer)
      - **totalPages** (integer)
      - **last** (boolean)
      - **first** (boolean)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/revenue
## GET
**Summary:** Get consolidated revenue from all sources

**Description:** N/A

### Parameters
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]
- **period** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **period** (string)
      - **totalRevenue** (number)
      - **totalReceivedRevenue** (number)
      - **totalPendingRevenue** (number)
      - **totalRefundedAmount** (number)
      - **netRevenue** (number)
      - **roomBookingsRevenue** (number)
      - **restaurantRevenue** (number)
      - **laundryRevenue** (number)
      - **rentalsRevenue** (number)
      - **otherIncomeRevenue** (number)
      - **totalTransactions** (integer)
      - **roomBookingTransactions** (integer)
      - **restaurantTransactions** (integer)
      - **laundryTransactions** (integer)
      - **rentalTransactions** (integer)
      - **otherIncomeTransactions** (integer)
      - **revenueBySource** (array) (object[] )
        - **source** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageTransactionValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **refundedAmount** (number)
      - **revenueGrowthPercentage** (number)
      - **revenueGrowthAmount** (number)
      - **averageDailyRevenue** (number)
      - **averageTransactionValue** (number)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/summary/comprehensive
## GET
**Summary:** Get comprehensive hotel financial summary (all revenue sources)

**Description:** N/A

### Parameters
- **hotelId** (query): No description [string]
- **startDate** (query): No description [string]
- **endDate** (query): No description [string]

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **hotelName** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **totalBookingRevenue** (number)
      - **totalBookings** (integer)
      - **checkIns** (integer)
      - **checkOuts** (integer)
      - **averageBookingValue** (number)
      - **totalKitchenRevenue** (number)
      - **totalBarRevenue** (number)
      - **totalRestaurantRevenue** (number)
      - **totalLaundryRevenue** (number)
      - **laundryOrdersCount** (integer)
      - **totalRentalRevenue** (number)
      - **rentalOrdersCount** (integer)
      - **totalOtherIncome** (number)
      - **otherIncomeCount** (integer)
      - **grandTotalRevenue** (number)
      - **bookingRevenuePercentage** (number)
      - **restaurantRevenuePercentage** (number)
      - **laundryRevenuePercentage** (number)
      - **rentalRevenuePercentage** (number)
      - **otherIncomePercentage** (number)
      - **dailyBreakdown** (array) (object[] )
        - **date** (string)
        - **roomRevenue** (number)
        - **kitchenRevenue** (number)
        - **barRevenue** (number)
        - **totalRevenue** (number)
      - **revenueGrowthPercentage** (number)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/this-week
## GET
**Summary:** Get this week's financial snapshot

**Description:** N/A

### Parameters
None

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **period** (string)
      - **totalRevenue** (number)
      - **totalExpenses** (number)
      - **netProfit** (number)
      - **netProfitMargin** (number)
      - **cashBalance** (number)
      - **revenueGrowth** (number)
      - **expenseGrowth** (number)
      - **profitGrowth** (number)
      - **topRevenueStreams** (array) (object[] )
        - **source** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageTransactionValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **refundedAmount** (number)
      - **topExpenseCategories** (array) (object[] )
        - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
        - **categoryDisplay** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageExpenseValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **overdueAmount** (number)
      - **totalOutstandingReceivables** (number)
      - **totalOverduePayables** (number)
      - **overdueExpendituresCount** (integer)
      - **totalCustomerTransactions** (integer)
      - **averageRevenuePerTransaction** (number)
      - **occupancyRate** (number)
      - **averageDailyRate** (number)
      - **revenuePerAvailableRoom** (number)
      - **financialAlerts** (array) (string[] )
      - **trendData** (array) (object[] )
        - **periodStart** (string)
        - **periodEnd** (string)
        - **periodLabel** (string)
        - **revenue** (number)
        - **expenses** (number)
        - **profit** (number)
        - **cashFlow** (number)
        - **profitMargin** (number)
        - **transactionCount** (integer)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/today
## GET
**Summary:** Get today's financial snapshot

**Description:** N/A

### Parameters
None

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **period** (string)
      - **totalRevenue** (number)
      - **totalExpenses** (number)
      - **netProfit** (number)
      - **netProfitMargin** (number)
      - **cashBalance** (number)
      - **revenueGrowth** (number)
      - **expenseGrowth** (number)
      - **profitGrowth** (number)
      - **topRevenueStreams** (array) (object[] )
        - **source** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageTransactionValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **refundedAmount** (number)
      - **topExpenseCategories** (array) (object[] )
        - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
        - **categoryDisplay** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageExpenseValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **overdueAmount** (number)
      - **totalOutstandingReceivables** (number)
      - **totalOverduePayables** (number)
      - **overdueExpendituresCount** (integer)
      - **totalCustomerTransactions** (integer)
      - **averageRevenuePerTransaction** (number)
      - **occupancyRate** (number)
      - **averageDailyRate** (number)
      - **revenuePerAvailableRoom** (number)
      - **financialAlerts** (array) (string[] )
      - **trendData** (array) (object[] )
        - **periodStart** (string)
        - **periodEnd** (string)
        - **periodLabel** (string)
        - **revenue** (number)
        - **expenses** (number)
        - **profit** (number)
        - **cashFlow** (number)
        - **profitMargin** (number)
        - **transactionCount** (integer)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---

# /api/financials/yearly-summary
## GET
**Summary:** Get current year financial summary

**Description:** N/A

### Parameters
None

### Responses
- **200**: OK
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
      - **hotelId** (string)
      - **startDate** (string)
      - **endDate** (string)
      - **period** (string)
      - **totalRevenue** (number)
      - **totalExpenses** (number)
      - **netProfit** (number)
      - **netProfitMargin** (number)
      - **cashBalance** (number)
      - **revenueGrowth** (number)
      - **expenseGrowth** (number)
      - **profitGrowth** (number)
      - **topRevenueStreams** (array) (object[] )
        - **source** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageTransactionValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **refundedAmount** (number)
      - **topExpenseCategories** (array) (object[] )
        - **category** (string) (Enum: SALARIES_AND_WAGES, STAFF_BENEFITS, STAFF_TRAINING, STAFF_UNIFORMS, STAFF_MEALS, RECRUITMENT, ELECTRICITY, WATER, GAS, INTERNET_AND_PHONE, WASTE_MANAGEMENT, BUILDING_MAINTENANCE, ROOM_MAINTENANCE, EQUIPMENT_REPAIR, HVAC_MAINTENANCE, PLUMBING, ELECTRICAL_WORK, PAINTING_AND_DECORATION, LANDSCAPING, POOL_MAINTENANCE, CLEANING_SUPPLIES, GUEST_AMENITIES, KITCHEN_SUPPLIES, OFFICE_SUPPLIES, FOOD_AND_BEVERAGE, LAUNDRY_SUPPLIES, DIGITAL_MARKETING, PRINT_ADVERTISING, SOCIAL_MEDIA_MARKETING, WEBSITE_MAINTENANCE, PROMOTIONS, PHOTOGRAPHY, SOFTWARE_LICENSES, HARDWARE_PURCHASE, IT_SERVICES, POS_SYSTEM, BOOKING_SYSTEM, PROPERTY_INSURANCE, LIABILITY_INSURANCE, EMPLOYEE_INSURANCE, VEHICLE_INSURANCE, LEGAL_FEES, ACCOUNTING_FEES, CONSULTING_FEES, AUDIT_FEES, PROPERTY_TAX, BUSINESS_LICENSE, REGULATORY_FEES, SECURITY_SERVICES, PEST_CONTROL, ELEVATOR_MAINTENANCE, FIRE_SAFETY, VEHICLE_FUEL, VEHICLE_MAINTENANCE, SHUTTLE_SERVICE, DELIVERY_CHARGES, COMPLIMENTARY_SERVICES, GUEST_ENTERTAINMENT, GUEST_TRANSPORTATION, BANK_CHARGES, LOAN_INTEREST, CREDIT_CARD_FEES, CHARITABLE_DONATIONS, SUBSCRIPTIONS, MEMBERSHIPS, CONTINGENCY, OTHERS)
        - **categoryDisplay** (string)
        - **amount** (number)
        - **percentage** (number)
        - **transactionCount** (integer)
        - **averageExpenseValue** (number)
        - **paidAmount** (number)
        - **pendingAmount** (number)
        - **overdueAmount** (number)
      - **totalOutstandingReceivables** (number)
      - **totalOverduePayables** (number)
      - **overdueExpendituresCount** (integer)
      - **totalCustomerTransactions** (integer)
      - **averageRevenuePerTransaction** (number)
      - **occupancyRate** (number)
      - **averageDailyRate** (number)
      - **revenuePerAvailableRoom** (number)
      - **financialAlerts** (array) (string[] )
      - **trendData** (array) (object[] )
        - **periodStart** (string)
        - **periodEnd** (string)
        - **periodLabel** (string)
        - **revenue** (number)
        - **expenses** (number)
        - **profit** (number)
        - **cashFlow** (number)
        - **profitMargin** (number)
        - **transactionCount** (integer)
- **400**: Bad Request
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **402**: Payment Required
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**
- **500**: Internal Server Error
  - Content-Type: */*
    - **requestTime** (string)
    - **requestType** (string)
    - **referenceId** (string)
    - **status** (boolean)
    - **message** (string)
    - **data**

---


# Schemas Reference


## ActionReason
```json
{"type":"object","properties":{"reason":{"type":"string"},"fromDate":{"type":"string","format":"date"},"toDate":{"type":"string","format":"date"}}}
```

## AddSupplierRequest
```json
{"type":"object","properties":{"name":{"type":"string","maxLength":200,"minLength":0},"email":{"type":"string","maxLength":200,"minLength":0},"phone":{"type":"string","maxLength":20,"minLength":0},"productIds":{"type":"array","items":{"type":"string"}}},"required":["name"]}
```

## ApiResponseApprovalRequestResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ApprovalRequestResponse"}}}
```

## ApiResponseBankAccountResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/BankAccountResponse"}}}
```

## ApiResponseBarItemResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/BarItemResponse"}}}
```

## ApiResponseBookingAssignmentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/BookingAssignmentResponse"}}}
```

## ApiResponseBookingFinancialDetail
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/BookingFinancialDetail"}}}
```

## ApiResponseBookingPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/BookingPaymentResponse"}}}
```

## ApiResponseBoolean
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"boolean"}}}
```

## ApiResponseBulkProductUploadResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/BulkProductUploadResponse"}}}
```

## ApiResponseBulkRoomUploadResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/BulkRoomUploadResponse"}}}
```

## ApiResponseCancelReservationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CancelReservationResponse"}}}
```

## ApiResponseCashFlowSummaryResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CashFlowSummaryResponse"}}}
```

## ApiResponseChatConversationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ChatConversationResponse"}}}
```

## ApiResponseChatMessageResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ChatMessageResponse"}}}
```

## ApiResponseCheckInResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CheckInResponse"}}}
```

## ApiResponseCheckOutResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CheckOutResponse"}}}
```

## ApiResponseCollectPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CollectPaymentResponse"}}}
```

## ApiResponseComprehensiveFinancialSummary
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ComprehensiveFinancialSummary"}}}
```

## ApiResponseConsolidatedExpenseResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ConsolidatedExpenseResponse"}}}
```

## ApiResponseConsolidatedRevenueResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ConsolidatedRevenueResponse"}}}
```

## ApiResponseCorporateReportResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CorporateReportResponse"}}}
```

## ApiResponseCustomPageApprovalRequestResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageApprovalRequestResponse"}}}
```

## ApiResponseCustomPageAuditLogResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageAuditLogResponse"}}}
```

## ApiResponseCustomPageBarItemAvailabilityResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageBarItemAvailabilityResponse"}}}
```

## ApiResponseCustomPageBarRestockRequestResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageBarRestockRequestResponse"}}}
```

## ApiResponseCustomPageBookingPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageBookingPaymentResponse"}}}
```

## ApiResponseCustomPageBookingViewResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageBookingViewResponse"}}}
```

## ApiResponseCustomPageChatConversationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageChatConversationResponse"}}}
```

## ApiResponseCustomPageChatMessageResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageChatMessageResponse"}}}
```

## ApiResponseCustomPageExpenditureResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageExpenditureResponse"}}}
```

## ApiResponseCustomPageGetHotelResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageGetHotelResponse"}}}
```

## ApiResponseCustomPageGoodsReceiptNoteResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageGoodsReceiptNoteResponse"}}}
```

## ApiResponseCustomPageGuestSpendingDetails
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageGuestSpendingDetails"}}}
```

## ApiResponseCustomPageHotelBizResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageHotelBizResponse"}}}
```

## ApiResponseCustomPageHotelSummary
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageHotelSummary"}}}
```

## ApiResponseCustomPageKitchenPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageKitchenPaymentResponse"}}}
```

## ApiResponseCustomPageKitchenSaleResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageKitchenSaleResponse"}}}
```

## ApiResponseCustomPageLaundryOrderSummaryResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageLaundryOrderSummaryResponse"}}}
```

## ApiResponseCustomPageLostAndFoundItemResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageLostAndFoundItemResponse"}}}
```

## ApiResponseCustomPageOrganizationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageOrganizationResponse"}}}
```

## ApiResponseCustomPageOtherIncomeResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageOtherIncomeResponse"}}}
```

## ApiResponseCustomPagePaymentLinkResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPagePaymentLinkResponse"}}}
```

## ApiResponseCustomPagePaymentLinkTransactionResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPagePaymentLinkTransactionResponse"}}}
```

## ApiResponseCustomPagePayoutTransactionResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPagePayoutTransactionResponse"}}}
```

## ApiResponseCustomPageProductResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageProductResponse"}}}
```

## ApiResponseCustomPagePurchaseOrderResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPagePurchaseOrderResponse"}}}
```

## ApiResponseCustomPageRentalCustomerLogResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageRentalCustomerLogResponse"}}}
```

## ApiResponseCustomPageRentalOrderSummaryResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageRentalOrderSummaryResponse"}}}
```

## ApiResponseCustomPageRentalPaymentHistoryResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageRentalPaymentHistoryResponse"}}}
```

## ApiResponseCustomPageRestaurantDailySummary
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageRestaurantDailySummary"}}}
```

## ApiResponseCustomPageRestaurantItemSalesDetail
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageRestaurantItemSalesDetail"}}}
```

## ApiResponseCustomPageRestaurantStockResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageRestaurantStockResponse"}}}
```

## ApiResponseCustomPageRoomFoodSalesBookingBreakdown
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageRoomFoodSalesBookingBreakdown"}}}
```

## ApiResponseCustomPageRoomResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageRoomResponse"}}}
```

## ApiResponseCustomPageStaffResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageStaffResponse"}}}
```

## ApiResponseCustomPageStockAdjustmentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageStockAdjustmentResponse"}}}
```

## ApiResponseCustomPageStockLevelResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageStockLevelResponse"}}}
```

## ApiResponseCustomPageStockMovementResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageStockMovementResponse"}}}
```

## ApiResponseCustomPageStockRequisitionResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageStockRequisitionResponse"}}}
```

## ApiResponseCustomPageStockTakeResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageStockTakeResponse"}}}
```

## ApiResponseCustomPageStorageLocationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageStorageLocationResponse"}}}
```

## ApiResponseCustomPageSupplierResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageSupplierResponse"}}}
```

## ApiResponseCustomPageUserModelResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomPageUserModelResponse"}}}
```

## ApiResponseCustomerRentalDetailsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/CustomerRentalDetailsResponse"}}}
```

## ApiResponseDestinationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/DestinationResponse"}}}
```

## ApiResponseEnhancedRestaurantDailySummaryResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/EnhancedRestaurantDailySummaryResponse"}}}
```

## ApiResponseExpenditureResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ExpenditureResponse"}}}
```

## ApiResponseFeedbackResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/FeedbackResponse"}}}
```

## ApiResponseFileUploadResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/FileUploadResponse"}}}
```

## ApiResponseFinancialDashboardResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/FinancialDashboardResponse"}}}
```

## ApiResponseGRNDashboardStatsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/GRNDashboardStatsResponse"}}}
```

## ApiResponseGetHotelResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/GetHotelResponse"}}}
```

## ApiResponseGoodsReceiptNoteResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/GoodsReceiptNoteResponse"}}}
```

## ApiResponseHotelDashboardResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/HotelDashboardResponse"}}}
```

## ApiResponseHotelFrontDeskDashboardCardResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/HotelFrontDeskDashboardCardResponse"}}}
```

## ApiResponseHotelSummaryResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/HotelSummaryResponse"}}}
```

## ApiResponseHotelTerminal
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/HotelTerminal"}}}
```

## ApiResponseInventoryDashboardResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/InventoryDashboardResponse"}}}
```

## ApiResponseItemConsumptionReport
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ItemConsumptionReport"}}}
```

## ApiResponseKitchenPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/KitchenPaymentResponse"}}}
```

## ApiResponseKitchenSaleResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/KitchenSaleResponse"}}}
```

## ApiResponseLaundryDashboardStatsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/LaundryDashboardStatsResponse"}}}
```

## ApiResponseLaundryItemResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/LaundryItemResponse"}}}
```

## ApiResponseLaundryOrderResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/LaundryOrderResponse"}}}
```

## ApiResponseLaundryPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/LaundryPaymentResponse"}}}
```

## ApiResponseListBank
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/Bank"}}}}
```

## ApiResponseListBankAccountResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/BankAccountResponse"}}}}
```

## ApiResponseListBookingPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/BookingPaymentResponse"}}}}
```

## ApiResponseListDestinationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/DestinationResponse"}}}}
```

## ApiResponseListExpenditureResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/ExpenditureResponse"}}}}
```

## ApiResponseListHotelPerformanceResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/HotelPerformanceResponse"}}}}
```

## ApiResponseListHotelTerminal
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/HotelTerminal"}}}}
```

## ApiResponseListKitchenPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/KitchenPaymentResponse"}}}}
```

## ApiResponseListLaundryItemResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/LaundryItemResponse"}}}}
```

## ApiResponseListLaundryOrderSummaryResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/LaundryOrderSummaryResponse"}}}}
```

## ApiResponseListLaundryPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/LaundryPaymentResponse"}}}}
```

## ApiResponseListLocationProductResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/LocationProductResponse"}}}}
```

## ApiResponseListMonthlyEarningsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/MonthlyEarningsResponse"}}}}
```

## ApiResponseListNotificationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/NotificationResponse"}}}}
```

## ApiResponseListOtherIncomeResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/OtherIncomeResponse"}}}}
```

## ApiResponseListPendingReconciliationDto
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/PendingReconciliationDto"}}}}
```

## ApiResponseListRentalAvailabilityResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/RentalAvailabilityResponse"}}}}
```

## ApiResponseListRentalItemMiniResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/RentalItemMiniResponse"}}}}
```

## ApiResponseListRentalItemResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/RentalItemResponse"}}}}
```

## ApiResponseListRentalMaintenanceLogResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/RentalMaintenanceLogResponse"}}}}
```

## ApiResponseListRentalOrderSummaryResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/RentalOrderSummaryResponse"}}}}
```

## ApiResponseListRentalPaymentHistoryResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/RentalPaymentHistoryResponse"}}}}
```

## ApiResponseListRentalPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/RentalPaymentResponse"}}}}
```

## ApiResponseListRestaurantItemResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/RestaurantItemResponse"}}}}
```

## ApiResponseListRoomByTypeResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/RoomByTypeResponse"}}}}
```

## ApiResponseListRoomTypeResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/RoomTypeResponse"}}}}
```

## ApiResponseListSimpleProductResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/SimpleProductResponse"}}}}
```

## ApiResponseListSimplePurchaseOrderResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/SimplePurchaseOrderResponse"}}}}
```

## ApiResponseListSimpleStorageLocationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/SimpleStorageLocationResponse"}}}}
```

## ApiResponseListSimpleSupplierResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/SimpleSupplierResponse"}}}}
```

## ApiResponseListStockLevelResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/StockLevelResponse"}}}}
```

## ApiResponseListStockMovementResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/StockMovementResponse"}}}}
```

## ApiResponseListTerminalStatusResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/TerminalStatusResponse"}}}}
```

## ApiResponseListUserPresenceResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"$ref":"#/components/schemas/UserPresenceResponse"}}}}
```

## ApiResponseLocationStatisticsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/LocationStatisticsResponse"}}}
```

## ApiResponseLoginResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/LoginResponse"}}}
```

## ApiResponseLong
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"integer","format":"int64"}}}
```

## ApiResponseLostAndFoundItemResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/LostAndFoundItemResponse"}}}
```

## ApiResponseLostAndFoundStatsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/LostAndFoundStatsResponse"}}}
```

## ApiResponseMapStringObject
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"object","additionalProperties":{}}}}
```

## ApiResponseNotificationPageResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/NotificationPageResponse"}}}
```

## ApiResponseObject
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{}}}
```

## ApiResponseOnboardHotelResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/OnboardHotelResponse"}}}
```

## ApiResponseOrgTransactionListResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/OrgTransactionListResponse"}}}
```

## ApiResponseOrganizationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/OrganizationResponse"}}}
```

## ApiResponseOtherIncomeResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/OtherIncomeResponse"}}}
```

## ApiResponseOwnerOverviewResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/OwnerOverviewResponse"}}}
```

## ApiResponsePageFeedbackResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PageFeedbackResponse"}}}
```

## ApiResponsePageGuestLogResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PageGuestLogResponse"}}}
```

## ApiResponsePaymentCallbackResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PaymentCallbackResponse"}}}
```

## ApiResponsePaymentInitializationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PaymentInitializationResponse"}}}
```

## ApiResponsePaymentLinkResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PaymentLinkResponse"}}}
```

## ApiResponsePaymentLinkTransactionResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PaymentLinkTransactionResponse"}}}
```

## ApiResponsePaymentSettingsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PaymentSettingsResponse"}}}
```

## ApiResponsePayoutTransactionResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PayoutTransactionResponse"}}}
```

## ApiResponsePendingApprovalSummary
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PendingApprovalSummary"}}}
```

## ApiResponseProductResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ProductResponse"}}}
```

## ApiResponseProductStatisticsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ProductStatisticsResponse"}}}
```

## ApiResponseProfitAndLossResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ProfitAndLossResponse"}}}
```

## ApiResponsePurchaseOrderResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PurchaseOrderResponse"}}}
```

## ApiResponsePurchaseOrderStatisticsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/PurchaseOrderStatisticsResponse"}}}
```

## ApiResponseReconciliationStatsDto
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ReconciliationStatsDto"}}}
```

## ApiResponseRentalAvailabilityResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RentalAvailabilityResponse"}}}
```

## ApiResponseRentalDashboardStatsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RentalDashboardStatsResponse"}}}
```

## ApiResponseRentalItemResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RentalItemResponse"}}}
```

## ApiResponseRentalOrderResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RentalOrderResponse"}}}
```

## ApiResponseRentalPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RentalPaymentResponse"}}}
```

## ApiResponseRentalReportResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RentalReportResponse"}}}
```

## ApiResponseReservationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ReservationResponse"}}}
```

## ApiResponseRestaurantDetailedReport
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RestaurantDetailedReport"}}}
```

## ApiResponseRestaurantFoodItemResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RestaurantFoodItemResponse"}}}
```

## ApiResponseRestaurantItemStatisticsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RestaurantItemStatisticsResponse"}}}
```

## ApiResponseRestaurantStockResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RestaurantStockResponse"}}}
```

## ApiResponseRoomGuestDetailsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RoomGuestDetailsResponse"}}}
```

## ApiResponseRoomResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RoomResponse"}}}
```

## ApiResponseRoomTypeResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/RoomTypeResponse"}}}
```

## ApiResponseSendPaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/SendPaymentResponse"}}}
```

## ApiResponseServicePaymentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/ServicePaymentResponse"}}}
```

## ApiResponseSetString
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"array","items":{"type":"string"},"uniqueItems":true}}}
```

## ApiResponseStockAdjustmentResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/StockAdjustmentResponse"}}}
```

## ApiResponseStockLevelResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/StockLevelResponse"}}}
```

## ApiResponseStockLevelStatisticsResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/StockLevelStatisticsResponse"}}}
```

## ApiResponseStockMovementResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/StockMovementResponse"}}}
```

## ApiResponseStockRequisitionResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/StockRequisitionResponse"}}}
```

## ApiResponseStockTakeResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/StockTakeResponse"}}}
```

## ApiResponseStorageLocationResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/StorageLocationResponse"}}}
```

## ApiResponseString
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"type":"string"}}}
```

## ApiResponseSupplierResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/SupplierResponse"}}}
```

## ApiResponseTerminalStatusResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/TerminalStatusResponse"}}}
```

## ApiResponseUserInfoResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/UserInfoResponse"}}}
```

## ApiResponseUserModelResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/UserModelResponse"}}}
```

## ApiResponseVerifyOtpResponse
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{"$ref":"#/components/schemas/VerifyOtpResponse"}}}
```

## ApiResponseVoid
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{}}}
```

## AppExceptionResponseObject
```json
{"type":"object","properties":{"requestTime":{"type":"string","format":"date-time"},"requestType":{"type":"string"},"referenceId":{"type":"string"},"status":{"type":"boolean"},"message":{"type":"string"},"data":{}}}
```

## ApprovalDecisionRequest
```json
{"type":"object","properties":{"comments":{"type":"string","maxLength":1000,"minLength":0}}}
```

## ApprovalRequestResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"entityType":{"type":"string","enum":["PURCHASE_ORDER","GOODS_RECEIPT_NOTE","STOCK_TAKE"]},"entityId":{"type":"string"},"entityReference":{"type":"string"},"actionType":{"type":"string","enum":["UPDATE","DELETE","APPROVE"]},"status":{"type":"string","enum":["PENDING","APPROVED","REJECTED"]},"requestPayload":{"type":"string"},"previousState":{"type":"string"},"reason":{"type":"string"},"requestedBy":{"type":"string"},"requestedByName":{"type":"string"},"requestedByEmail":{"type":"string"},"requestedAt":{"type":"string","format":"date-time"},"reviewedBy":{"type":"string"},"reviewedByName":{"type":"string"},"reviewedByEmail":{"type":"string"},"reviewedAt":{"type":"string","format":"date-time"},"reviewerComments":{"type":"string"},"executed":{"type":"boolean"},"executedAt":{"type":"string","format":"date-time"},"executionError":{"type":"string"},"priority":{"type":"integer","format":"int32"},"expiresAt":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## ApproveRequisitionRequest
```json
{"type":"object","properties":{"approvalNotes":{"type":"string","maxLength":500,"minLength":0},"itemApprovals":{"type":"array","items":{"$ref":"#/components/schemas/RequisitionItemApproval"},"minItems":1}},"required":["itemApprovals"]}
```

## AssignBookingRequest
```json
{"type":"object","properties":{"hotelId":{"type":"string","minLength":1},"bookingId":{"type":"string","minLength":1},"organizationId":{"type":"string","minLength":1},"dailySpendingCap":{"type":"number","minimum":0.0}},"required":["bookingId","dailySpendingCap","hotelId","organizationId"]}
```

## AssignHotelBizRequest
```json
{"type":"object","properties":{"hotelBizId":{"type":"string","minLength":1},"userId":{"type":"string","minLength":1}},"required":["hotelBizId","userId"]}
```

## AuditLogResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"staffId":{"type":"string"},"staffEmail":{"type":"string"},"staffName":{"type":"string"},"role":{"type":"string"},"activity":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"hotelId":{"type":"string"},"hotelName":{"type":"string"}}}
```

## Authorization
```json
{"type":"object","properties":{"authorization_code":{"type":"string"},"bin":{"type":"string"},"last4":{"type":"string"},"card_type":{"type":"string"},"bank":{"type":"string"},"brand":{"type":"string"}}}
```

## Bank
```json
{"type":"object","properties":{"id":{"type":"integer","format":"int64"},"name":{"type":"string"},"slug":{"type":"string"},"code":{"type":"string"},"longcode":{"type":"string"},"gateway":{"type":"string"},"pay_with_bank":{"type":"boolean"},"active":{"type":"boolean"},"country":{"type":"string"},"currency":{"type":"string"},"type":{"type":"string"},"is_deleted":{"type":"boolean"}}}
```

## BankAccountResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"accountName":{"type":"string"},"accountNumber":{"type":"string"},"bankCode":{"type":"string"},"bankName":{"type":"string"},"currency":{"type":"string"},"paystackRecipientCode":{"type":"string"},"paystackVerified":{"type":"boolean"},"paystackVerificationDate":{"type":"string","format":"date-time"},"status":{"type":"string"},"isDefault":{"type":"boolean"},"lastUsedAt":{"type":"string","format":"date-time"},"totalPayouts":{"type":"integer","format":"int32"},"createdAt":{"type":"string","format":"date-time"}}}
```

## BarItemAvailabilityResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"name":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"price":{"type":"number"},"availability":{"type":"string","enum":["AVAILABLE","LOW_IN_STOCK","OUT_OF_STOCK"]}}}
```

## BarItemRequest
```json
{"type":"object","properties":{"name":{"type":"string","minLength":1},"quantity":{"type":"integer","format":"int32","deprecated":true},"price":{"type":"number","minimum":0.0},"productId":{"type":"string"},"portionSize":{"type":"number","minimum":0.001},"notes":{"type":"string"}},"required":["name","price"]}
```

## BarItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"name":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"createdAt":{"type":"string","format":"date-time"}}}
```

## BarRestockRequestResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"barItemId":{"type":"string"},"barItemCustomId":{"type":"string"},"barItemName":{"type":"string"},"requestedQuantity":{"type":"integer","format":"int32"},"status":{"type":"string","enum":["PENDING","APPROVED","REJECTED"]},"requestedBy":{"type":"string"},"requestedAt":{"type":"string","format":"date-time"}}}
```

## BookingAssignmentResponse
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"guestName":{"type":"string"},"roomIdentifier":{"type":"string"},"roomType":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"checkOutDate":{"type":"string","format":"date-time"},"amountPaid":{"type":"number"},"dailySpendingCap":{"type":"number"},"organizationId":{"type":"string"},"organizationName":{"type":"string"},"assignedAt":{"type":"string","format":"date-time"}}}
```

## BookingFinancialDetail
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"customId":{"type":"string"},"roomIdentifier":{"type":"string"},"guestName":{"type":"string"},"guestPhoneNumber":{"type":"string"},"roomType":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"checkOutDate":{"type":"string","format":"date-time"},"bookingStatus":{"type":"string"},"nightlyRate":{"type":"number"},"totalRoomRevenue":{"type":"number"},"amountPaid":{"type":"number"},"amountDue":{"type":"number"},"amountRemaining":{"type":"number"},"totalKitchenSales":{"type":"number"},"totalBarSales":{"type":"number"},"totalRestaurantRevenue":{"type":"number"},"totalLaundryCharges":{"type":"number"},"laundryOrdersCount":{"type":"integer","format":"int32"},"totalRentalCharges":{"type":"number"},"rentalOrdersCount":{"type":"integer","format":"int32"},"totalManualCharges":{"type":"number"},"manualChargesCount":{"type":"integer","format":"int32"},"grandTotal":{"type":"number"},"dailyBreakdown":{"type":"array","items":{"$ref":"#/components/schemas/DailyFinancialBreakdown"}},"kitchenItems":{"type":"array","items":{"$ref":"#/components/schemas/SaleItemDetail"}},"barItems":{"type":"array","items":{"$ref":"#/components/schemas/SaleItemDetail"}},"organizationName":{"type":"string"},"dailySpendingCap":{"type":"number"}}}
```

## BookingPaymentResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"method":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"reference":{"type":"string"},"status":{"type":"string","enum":["SUCCESS","FAILED","PENDING","CANCELLED","REFUNDED","PARTLY_PAID","FULLY_PAID"]},"type":{"type":"string","enum":["DEPOSIT","INSTALLMENT","FINAL","REFUND","OTHER"]},"paymentDate":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"},"bookingId":{"type":"string"},"guestName":{"type":"string"},"roomIdentifier":{"type":"string"},"roomType":{"type":"string"}}}
```

## BookingViewResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"title":{"type":"string"},"guestName":{"type":"string"},"noOfAdults":{"type":"integer","format":"int32"},"noOfChildren":{"type":"integer","format":"int32"},"guestPhoneNumber":{"type":"string"},"roomIdentifier":{"type":"string"},"branchName":{"type":"string"},"roomType":{"type":"string"},"bookingStatus":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"checkOutDate":{"type":"string","format":"date-time"},"nightlyRate":{"type":"number"},"numberOfNights":{"type":"integer","format":"int32"},"accommodationCost":{"type":"number"},"restaurantOrdersTotal":{"type":"number"},"totalAmountDue":{"type":"number"},"amountPaid":{"type":"number"},"amountRemaining":{"type":"number"},"discountValue":{"type":"number"},"discountType":{"type":"string","enum":["PERCENTAGE","FIXED"]},"effectiveNightlyRate":{"type":"number"},"restaurantOrders":{"type":"array","items":{"$ref":"#/components/schemas/KitchenSaleResponse"}},"payments":{"type":"array","items":{"$ref":"#/components/schemas/BookingPaymentResponse"}}}}
```

## BulkProductUploadResponse
```json
{"type":"object","properties":{"summary":{"$ref":"#/components/schemas/BulkUploadSummary"},"results":{"type":"array","items":{"$ref":"#/components/schemas/ProductUploadResultResponse"}}}}
```

## BulkRoomUploadResponse
```json
{"type":"object","properties":{"summary":{"$ref":"#/components/schemas/BulkUploadSummary"},"results":{"type":"array","items":{"$ref":"#/components/schemas/RoomUploadResultResponse"}}}}
```

## BulkUploadSummary
```json
{"type":"object","properties":{"totalRows":{"type":"integer","format":"int32"},"successCount":{"type":"integer","format":"int32"},"failedCount":{"type":"integer","format":"int32"},"processingTimeMs":{"type":"integer","format":"int64"},"fileName":{"type":"string"},"uploadedBy":{"type":"string"},"uploadedAt":{"type":"string","format":"date-time"}}}
```

## CancelReservationResponse
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"guestName":{"type":"string"},"roomIdentifier":{"type":"string"},"roomType":{"type":"string"},"status":{"type":"string","enum":["CHECKED_IN","CHECKED_OUT","RESERVED","CANCELLED","AVAILABLE"]},"message":{"type":"string"}}}
```

## CardDetails
```json
{"type":"object","properties":{"last4":{"type":"string"},"cardType":{"type":"string"},"bank":{"type":"string"},"brand":{"type":"string"}}}
```

## CashFlowSummaryResponse
```json
{"type":"object","properties":{"hotelId":{"type":"string"},"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"period":{"type":"string"},"cashFromOperations":{"type":"number"},"cashReceivedFromCustomers":{"type":"number"},"cashPaidToSuppliers":{"type":"number"},"cashPaidToEmployees":{"type":"number"},"cashPaidForOperatingExpenses":{"type":"number"},"netCashFromOperatingActivities":{"type":"number"},"cashFromRoomBookings":{"type":"number"},"cashFromRestaurants":{"type":"number"},"cashFromLaundry":{"type":"number"},"cashFromRentals":{"type":"number"},"cashFromOtherIncome":{"type":"number"},"cashForStaffCosts":{"type":"number"},"cashForUtilities":{"type":"number"},"cashForSupplies":{"type":"number"},"cashForMaintenance":{"type":"number"},"cashForMarketing":{"type":"number"},"cashForOtherExpenses":{"type":"number"},"accountsReceivable":{"type":"number"},"accountsPayable":{"type":"number"},"netReceivablesPayables":{"type":"number"},"openingCashBalance":{"type":"number"},"totalCashInflow":{"type":"number"},"totalCashOutflow":{"type":"number"},"netCashFlow":{"type":"number"},"closingCashBalance":{"type":"number"},"cashInHand":{"type":"number"},"bankBalance":{"type":"number"},"cardPayments":{"type":"number"},"mobileMoneyBalance":{"type":"number"},"otherPaymentMethods":{"type":"number"},"cashFlowFromRevenueRatio":{"type":"number"},"daysOfCashOnHand":{"type":"number"}}}
```

## CategoryStats
```json
{"type":"object","properties":{"category":{"type":"string"},"orderCount":{"type":"integer","format":"int64"},"itemCount":{"type":"integer","format":"int32"},"revenue":{"type":"number"},"percentageOfTotal":{"type":"number","format":"double"}}}
```

## ChangePasswordRequest
```json
{"type":"object","properties":{"oldPassword":{"type":"string"},"newPassword":{"type":"string"},"confirmPassword":{"type":"string"}}}
```

## ChangeResetPasswordRequest
```json
{"type":"object","properties":{"newPassword":{"type":"string"},"confirmPassword":{"type":"string"}}}
```

## ChatConversationResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"conversationType":{"type":"string"},"conversationName":{"type":"string"},"conversationAvatar":{"type":"string"},"isActive":{"type":"boolean"},"lastMessageAt":{"type":"string","format":"date-time"},"lastMessagePreview":{"type":"string"},"totalMessages":{"type":"integer","format":"int32"},"unreadCount":{"type":"integer","format":"int32"},"participants":{"type":"array","items":{"$ref":"#/components/schemas/ChatParticipantSummary"}},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## ChatMessageResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"conversationId":{"type":"string"},"senderId":{"type":"string"},"senderName":{"type":"string"},"senderAvatar":{"type":"string"},"content":{"type":"string"},"messageType":{"type":"string"},"attachmentUrl":{"type":"string"},"attachmentName":{"type":"string"},"attachmentType":{"type":"string"},"attachmentSize":{"type":"integer","format":"int64"},"isDeleted":{"type":"boolean"},"isEdited":{"type":"boolean"},"editedAt":{"type":"string","format":"date-time"},"readByCount":{"type":"integer","format":"int32"},"deliveryStatus":{"type":"string","enum":["SENT","DELIVERED","READ"]},"deliveredAt":{"type":"string","format":"date-time"},"replyToMessage":{"$ref":"#/components/schemas/ReplyToMessageSummary"},"createdAt":{"type":"string","format":"date-time"},"deleteAt":{"type":"string","format":"date-time"}}}
```

## ChatParticipantSummary
```json
{"type":"object","properties":{"userId":{"type":"string"},"userName":{"type":"string"},"userAvatar":{"type":"string"},"role":{"type":"string"},"unreadCount":{"type":"integer","format":"int32"},"isMuted":{"type":"boolean"},"isActive":{"type":"boolean"},"lastReadAt":{"type":"string","format":"date-time"},"joinedAt":{"type":"string","format":"date-time"}}}
```

## CheckInRequest
```json
{"type":"object","properties":{"title":{"type":"string"},"guestName":{"type":"string"},"guestEmail":{"type":"string"},"phoneNumber":{"type":"string"},"noOfAdults":{"type":"integer","format":"int32"},"noOfChildren":{"type":"integer","format":"int32"},"nightlyRate":{"type":"number"},"dailySpendingCap":{"type":"number"},"checkInDate":{"type":"string"},"checkOutDate":{"type":"string"},"discountValue":{"type":"number"},"discountType":{"type":"string","enum":["PERCENTAGE","FIXED"]},"initialPayment":{"$ref":"#/components/schemas/RecordBookingPaymentRequest"}}}
```

## CheckInResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"title":{"type":"string"},"guestName":{"type":"string"},"noOfAdults":{"type":"integer","format":"int32"},"noOfChildren":{"type":"integer","format":"int32"},"roomIdentifier":{"type":"string"},"branchName":{"type":"string"},"roomType":{"type":"string"},"bookingStatus":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"checkOutDate":{"type":"string","format":"date-time"},"amountPaid":{"type":"number"},"checkIn":{"type":"string","format":"date-time"},"checkOut":{"type":"string","format":"date-time"},"discountValue":{"type":"number"},"discountType":{"type":"string","enum":["PERCENTAGE","FIXED"]},"nightlyRate":{"type":"number"},"effectiveNightlyRate":{"type":"number"},"initialPayment":{"$ref":"#/components/schemas/BookingPaymentResponse"}}}
```

## CheckOutRequest
```json
{}
```

## CheckOutResponse
```json
{"type":"object","properties":{"guestName":{"type":"string"},"roomIdentifier":{"type":"string"},"roomType":{"type":"string"},"branchName":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"checkOutDate":{"type":"string","format":"date-time"},"totalAmountPaid":{"type":"number"},"bookingStatus":{"type":"string","enum":["CHECKED_IN","CHECKED_OUT","RESERVED","CANCELLED","AVAILABLE"]}}}
```

## CheckRentalAvailabilityRequest
```json
{"type":"object","properties":{"itemId":{"type":"string"},"startTime":{"type":"string","format":"date-time"},"endTime":{"type":"string","format":"date-time"},"quantity":{"type":"integer","format":"int32","minimum":1},"excludeOrderId":{"type":"string"}},"required":["endTime","itemId","quantity","startTime"]}
```

## ClaimItemRequest
```json
{"type":"object","properties":{"claimedBy":{"type":"string","minLength":1},"claimNotes":{"type":"string"}},"required":["claimedBy"]}
```

## CollectPaymentRequest
```json
{"type":"object","properties":{"hotelId":{"type":"string","minLength":1},"serviceType":{"type":"string","enum":["GENERAL","BOOKING","LAUNDRY","RENTAL","KITCHEN"]},"serviceId":{"type":"string","minLength":1},"amount":{"type":"number","minimum":100.00},"currency":{"type":"string"},"description":{"type":"string"},"paymentChannel":{"type":"string","enum":["CARD","BANK_TRANSFER","POS_TERMINAL","CASH","USSD"]},"terminalId":{"type":"string"},"customerName":{"type":"string"},"customerPhone":{"type":"string"},"customerEmail":{"type":"string"},"createdBy":{"type":"string"}},"required":["amount","hotelId","paymentChannel","serviceId","serviceType"]}
```

## CollectPaymentResponse
```json
{"type":"object","properties":{"paymentLinkId":{"type":"string"},"reference":{"type":"string"},"channel":{"type":"string","enum":["CARD","BANK_TRANSFER","POS_TERMINAL","CASH","USSD"]},"status":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"virtualAccountNumber":{"type":"string"},"virtualAccountBank":{"type":"string"},"virtualAccountExpiry":{"type":"string","format":"date-time"},"terminalStatus":{"type":"string"},"message":{"type":"string"},"paymentUrl":{"type":"string"},"authorizationUrl":{"type":"string"}}}
```

## ComprehensiveFinancialSummary
```json
{"type":"object","properties":{"hotelId":{"type":"string"},"hotelName":{"type":"string"},"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"totalBookingRevenue":{"type":"number"},"totalBookings":{"type":"integer","format":"int32"},"checkIns":{"type":"integer","format":"int32"},"checkOuts":{"type":"integer","format":"int32"},"averageBookingValue":{"type":"number"},"totalKitchenRevenue":{"type":"number"},"totalBarRevenue":{"type":"number"},"totalRestaurantRevenue":{"type":"number"},"totalLaundryRevenue":{"type":"number"},"laundryOrdersCount":{"type":"integer","format":"int32"},"totalRentalRevenue":{"type":"number"},"rentalOrdersCount":{"type":"integer","format":"int32"},"totalOtherIncome":{"type":"number"},"otherIncomeCount":{"type":"integer","format":"int32"},"grandTotalRevenue":{"type":"number"},"bookingRevenuePercentage":{"type":"number"},"restaurantRevenuePercentage":{"type":"number"},"laundryRevenuePercentage":{"type":"number"},"rentalRevenuePercentage":{"type":"number"},"otherIncomePercentage":{"type":"number"},"dailyBreakdown":{"type":"array","items":{"$ref":"#/components/schemas/DailyFinancialBreakdown"}},"revenueGrowthPercentage":{"type":"number"}}}
```

## ConsolidatedExpenseResponse
```json
{"type":"object","properties":{"hotelId":{"type":"string"},"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"period":{"type":"string"},"totalExpenses":{"type":"number"},"totalPaidExpenses":{"type":"number"},"totalPendingExpenses":{"type":"number"},"totalOverdueExpenses":{"type":"number"},"staffCosts":{"type":"number"},"operationalCosts":{"type":"number"},"marketingCosts":{"type":"number"},"administrativeCosts":{"type":"number"},"financialCosts":{"type":"number"},"otherCosts":{"type":"number"},"totalExpenseTransactions":{"type":"integer","format":"int64"},"expensesByCategory":{"type":"array","items":{"$ref":"#/components/schemas/ExpenseSourceBreakdown"}},"expenseGrowthPercentage":{"type":"number"},"expenseGrowthAmount":{"type":"number"},"averageDailyExpense":{"type":"number"},"averageExpenseValue":{"type":"number"}}}
```

## ConsolidatedRevenueResponse
```json
{"type":"object","properties":{"hotelId":{"type":"string"},"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"period":{"type":"string"},"totalRevenue":{"type":"number"},"totalReceivedRevenue":{"type":"number"},"totalPendingRevenue":{"type":"number"},"totalRefundedAmount":{"type":"number"},"netRevenue":{"type":"number"},"roomBookingsRevenue":{"type":"number"},"restaurantRevenue":{"type":"number"},"laundryRevenue":{"type":"number"},"rentalsRevenue":{"type":"number"},"otherIncomeRevenue":{"type":"number"},"totalTransactions":{"type":"integer","format":"int64"},"roomBookingTransactions":{"type":"integer","format":"int64"},"restaurantTransactions":{"type":"integer","format":"int64"},"laundryTransactions":{"type":"integer","format":"int64"},"rentalTransactions":{"type":"integer","format":"int64"},"otherIncomeTransactions":{"type":"integer","format":"int64"},"revenueBySource":{"type":"array","items":{"$ref":"#/components/schemas/RevenueSourceBreakdown"}},"revenueGrowthPercentage":{"type":"number"},"revenueGrowthAmount":{"type":"number"},"averageDailyRevenue":{"type":"number"},"averageTransactionValue":{"type":"number"}}}
```

## CorporateReportResponse
```json
{"type":"object","properties":{"organizationId":{"type":"string"},"organizationName":{"type":"string"},"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"totalRoomCharges":{"type":"number"},"totalRestaurantCharges":{"type":"number"},"totalBarCharges":{"type":"number"},"totalManualCharges":{"type":"number"},"grandTotal":{"type":"number"},"staffBreakdowns":{"type":"array","items":{"$ref":"#/components/schemas/StaffBreakdown"}}}}
```

## CreateBankAccountRequest
```json
{"type":"object","properties":{"hotelId":{"type":"string","minLength":1},"accountNumber":{"type":"string","minLength":1,"pattern":"^\\d{10}$"},"bankCode":{"type":"string","maxLength":10,"minLength":3},"currency":{"type":"string","maxLength":3,"minLength":0},"setAsDefault":{"type":"boolean"}},"required":["accountNumber","bankCode","currency","hotelId"]}
```

## CreateDestinationRequest
```json
{"type":"object","properties":{"name":{"type":"string","minLength":1}},"required":["name"]}
```

## CreateExpenditureRequest
```json
{"type":"object","properties":{"category":{"type":"string","enum":["SALARIES_AND_WAGES","STAFF_BENEFITS","STAFF_TRAINING","STAFF_UNIFORMS","STAFF_MEALS","RECRUITMENT","ELECTRICITY","WATER","GAS","INTERNET_AND_PHONE","WASTE_MANAGEMENT","BUILDING_MAINTENANCE","ROOM_MAINTENANCE","EQUIPMENT_REPAIR","HVAC_MAINTENANCE","PLUMBING","ELECTRICAL_WORK","PAINTING_AND_DECORATION","LANDSCAPING","POOL_MAINTENANCE","CLEANING_SUPPLIES","GUEST_AMENITIES","KITCHEN_SUPPLIES","OFFICE_SUPPLIES","FOOD_AND_BEVERAGE","LAUNDRY_SUPPLIES","DIGITAL_MARKETING","PRINT_ADVERTISING","SOCIAL_MEDIA_MARKETING","WEBSITE_MAINTENANCE","PROMOTIONS","PHOTOGRAPHY","SOFTWARE_LICENSES","HARDWARE_PURCHASE","IT_SERVICES","POS_SYSTEM","BOOKING_SYSTEM","PROPERTY_INSURANCE","LIABILITY_INSURANCE","EMPLOYEE_INSURANCE","VEHICLE_INSURANCE","LEGAL_FEES","ACCOUNTING_FEES","CONSULTING_FEES","AUDIT_FEES","PROPERTY_TAX","BUSINESS_LICENSE","REGULATORY_FEES","SECURITY_SERVICES","PEST_CONTROL","ELEVATOR_MAINTENANCE","FIRE_SAFETY","VEHICLE_FUEL","VEHICLE_MAINTENANCE","SHUTTLE_SERVICE","DELIVERY_CHARGES","COMPLIMENTARY_SERVICES","GUEST_ENTERTAINMENT","GUEST_TRANSPORTATION","BANK_CHARGES","LOAN_INTEREST","CREDIT_CARD_FEES","CHARITABLE_DONATIONS","SUBSCRIPTIONS","MEMBERSHIPS","CONTINGENCY","OTHERS"]},"title":{"type":"string","minLength":1},"description":{"type":"string"},"amount":{"type":"number"},"paymentMethod":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"expenseDate":{"type":"string","format":"date"},"dueDate":{"type":"string","format":"date"},"vendorName":{"type":"string"},"vendorContact":{"type":"string"},"vendorAddress":{"type":"string"},"invoiceNumber":{"type":"string"},"purchaseOrderNumber":{"type":"string"},"departmentId":{"type":"string"},"requestedBy":{"type":"string"},"taxAmount":{"type":"number"},"taxType":{"type":"string"},"taxRate":{"type":"number","format":"double"},"recurrenceType":{"type":"string","enum":["ONE_TIME","DAILY","WEEKLY","MONTHLY","QUARTERLY","YEARLY"]},"nextOccurrence":{"type":"string","format":"date"},"receiptUrl":{"type":"string"},"attachmentUrls":{"type":"string"},"notes":{"type":"string"},"accountCode":{"type":"string"},"costCenter":{"type":"string"},"budgetId":{"type":"string"}},"required":["amount","category","expenseDate","paymentMethod","title"]}
```

## CreateGRNRequest
```json
{"type":"object","properties":{"purchaseOrderId":{"type":"string"},"supplierId":{"type":"string","minLength":1},"supplierInvoiceNumber":{"type":"string","maxLength":100,"minLength":0},"supplierInvoiceDate":{"type":"string","format":"date"},"supplierDeliveryNote":{"type":"string","maxLength":100,"minLength":0},"storageLocationId":{"type":"string","minLength":1},"receiptDate":{"type":"string","format":"date"},"receiptTime":{"type":"string","format":"date-time"},"deliveredBy":{"type":"string","maxLength":200,"minLength":0},"vehicleNumber":{"type":"string","maxLength":100,"minLength":0},"inspectionRequired":{"type":"boolean"},"items":{"type":"array","items":{"$ref":"#/components/schemas/GRNItemRequest"},"minItems":1},"notes":{"type":"string","maxLength":2000,"minLength":0},"discrepancies":{"type":"string","maxLength":1000,"minLength":0},"packagingCondition":{"type":"string","maxLength":500,"minLength":0}},"required":["items","receiptDate","storageLocationId","supplierId"]}
```

## CreateLaundryItemRequest
```json
{"type":"object","properties":{"name":{"type":"string","minLength":1},"description":{"type":"string"},"category":{"type":"string","enum":["CLOTHING","BEDDING","TOWELS","CURTAINS","UNIFORMS","TABLE_LINEN","DELICATES","ACCESSORIES","OUTERWEAR","OTHERS"]},"washOnlyPrice":{"type":"number","format":"double"},"washAndIronPrice":{"type":"number","format":"double"},"washAndFoldPrice":{"type":"number","format":"double"},"dryCleanPrice":{"type":"number","format":"double"},"ironOnlyPrice":{"type":"number","format":"double"},"steamPressPrice":{"type":"number","format":"double"},"stainRemovalPrice":{"type":"number","format":"double"},"handWashPrice":{"type":"number","format":"double"},"washIronAndPackPrice":{"type":"number","format":"double"},"expressMultiplier":{"type":"number","format":"double"},"sameDayMultiplier":{"type":"number","format":"double"},"urgentMultiplier":{"type":"number","format":"double"},"specialInstructions":{"type":"string"}},"required":["category","name"]}
```

## CreateLaundryOrderRequest
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"customerName":{"type":"string","minLength":1},"customerPhone":{"type":"string"},"customerEmail":{"type":"string"},"roomIdentifier":{"type":"string"},"organizationId":{"type":"string"},"urgency":{"type":"string","enum":["STANDARD","EXPRESS","SAME_DAY","URGENT"]},"items":{"type":"array","items":{"$ref":"#/components/schemas/LaundryOrderItemRequest"},"minItems":1},"pickupRequestedTime":{"type":"string","format":"date-time"},"expectedDeliveryTime":{"type":"string","format":"date-time"},"specialInstructions":{"type":"string"},"customerNotes":{"type":"string"}},"required":["customerName","items","urgency"]}
```

## CreateLaundryPaymentRequest
```json
{"type":"object","properties":{"laundryOrderId":{"type":"string","minLength":1},"amount":{"type":"number"},"currency":{"type":"string"},"method":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"reference":{"type":"string"},"status":{"type":"string","enum":["SUCCESS","FAILED","PENDING","CANCELLED","REFUNDED","PARTLY_PAID","FULLY_PAID"]},"type":{"type":"string","enum":["DEPOSIT","INSTALLMENT","FULL_PAYMENT","FINAL","REFUND","OTHER"]},"paymentDate":{"type":"string","format":"date-time"},"notes":{"type":"string"}},"required":["amount","laundryOrderId","method","type"]}
```

## CreateLostAndFoundItemRequest
```json
{"type":"object","properties":{"itemName":{"type":"string","minLength":1},"description":{"type":"string"},"imageUrl":{"type":"string"},"location":{"type":"string"},"dateFound":{"type":"string","format":"date"}},"required":["itemName"]}
```

## CreateOtherIncomeRequest
```json
{"type":"object","properties":{"category":{"type":"string","enum":["EVENT_HOSTING","MEETING_ROOM_RENTAL","BANQUET_SERVICES","VENUE_DECORATION","SPA_SERVICES","GYM_MEMBERSHIP","SWIMMING_POOL_ACCESS","YOGA_CLASSES","WELLNESS_PACKAGES","AIRPORT_SHUTTLE","TAXI_SERVICE","CAR_RENTAL","VALET_PARKING","PARKING_FEES","GIFT_SHOP_SALES","SOUVENIR_SALES","NEWSPAPER_SALES","SNACK_SALES","LIVE_ENTERTAINMENT","GAME_ROOM","MOVIE_NIGHTS","TOUR_PACKAGES","EXCURSION_BOOKING","BUSINESS_CENTER","PRINTING_AND_COPYING","FAX_SERVICES","INTERNET_ACCESS_FEES","SECRETARIAL_SERVICES","TELEPHONE_CHARGES","INTERNATIONAL_CALLS","MOBILE_CHARGING","PET_CARE","BABYSITTING","CONCIERGE_SERVICES","PERSONAL_SHOPPING","PHOTOGRAPHY_SERVICES","ADVERTISING_SPACE","ROOFTOP_ACCESS","TERRACE_RENTAL","STORAGE_RENTAL","GAMING_CONSOLE_RENTAL","LAPTOP_RENTAL","PROJECTOR_RENTAL","LUGGAGE_STORAGE","SAFE_DEPOSIT_BOX","LOST_AND_FOUND_FEES","EARLY_CHECKIN_FEES","LATE_CHECKOUT_FEES","KEY_REPLACEMENT","TOUR_OPERATOR_COMMISSION","TRAVEL_AGENT_COMMISSION","AFFILIATE_INCOME","REFERRAL_INCOME","INTEREST_INCOME","INVESTMENT_RETURNS","DIVIDEND_INCOME","INSURANCE_CLAIMS","DAMAGE_COMPENSATION","VENDOR_REBATES","OTHERS"]},"title":{"type":"string","minLength":1},"description":{"type":"string"},"amount":{"type":"number"},"paymentMethod":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"incomeDate":{"type":"string","format":"date"},"receivedDate":{"type":"string","format":"date"},"customerName":{"type":"string"},"customerContact":{"type":"string"},"customerAddress":{"type":"string"},"bookingId":{"type":"string"},"roomIdentifier":{"type":"string"},"organizationId":{"type":"string"},"invoiceNumber":{"type":"string"},"receiptNumber":{"type":"string"},"taxAmount":{"type":"number"},"taxType":{"type":"string"},"taxRate":{"type":"number","format":"double"},"commissionAmount":{"type":"number"},"commissionRate":{"type":"number","format":"double"},"commissionPayee":{"type":"string"},"recurrenceType":{"type":"string","enum":["ONE_TIME","DAILY","WEEKLY","MONTHLY","QUARTERLY","YEARLY"]},"nextOccurrence":{"type":"string","format":"date"},"departmentId":{"type":"string"},"servedBy":{"type":"string"},"invoiceUrl":{"type":"string"},"attachmentUrls":{"type":"string"},"notes":{"type":"string"},"accountCode":{"type":"string"},"revenueCenter":{"type":"string"}},"required":["amount","category","incomeDate","paymentMethod","title"]}
```

## CreateProductRequest
```json
{"type":"object","properties":{"sku":{"type":"string","maxLength":50,"minLength":0},"barcode":{"type":"string","maxLength":100,"minLength":0},"name":{"type":"string","maxLength":200,"minLength":0},"description":{"type":"string","maxLength":1000,"minLength":0},"brand":{"type":"string","maxLength":200,"minLength":0},"manufacturer":{"type":"string","maxLength":100,"minLength":0},"category":{"type":"string","enum":["FOOD_FRESH","FOOD_FROZEN","FOOD_DRY_GOODS","BEVERAGES_ALCOHOLIC","BEVERAGES_NON_ALCOHOLIC","BEVERAGES_HOT","BEVERAGES","FOOD","CLEANING_SUPPLIES","LAUNDRY_SUPPLIES","GUEST_AMENITIES","LINENS_TOWELS","MAINTENANCE_SUPPLIES","ELECTRICAL_SUPPLIES","PLUMBING_SUPPLIES","HVAC_SUPPLIES","STATIONERY","OFFICE_EQUIPMENT","PRINTING_SUPPLIES","MINIBAR_ITEMS","ROOM_SUPPLIES","WELCOME_ITEMS","KITCHEN_EQUIPMENT","TABLEWARE","DISPOSABLES","UNIFORMS","SAFETY_EQUIPMENT","MARKETING_MATERIALS","GENERAL_SUPPLIES","OTHER"]},"subcategory":{"type":"string","maxLength":100,"minLength":0},"baseUnit":{"type":"string","minLength":1},"purchaseUnit":{"type":"string"},"consumptionUnit":{"type":"string"},"conversionFactor":{"type":"number","format":"double","minimum":0.0},"standardCost":{"type":"number","minimum":0.0},"lastPurchasePrice":{"type":"number","minimum":0.0},"sellingPrice":{"type":"number","minimum":0.0},"valuationMethod":{"type":"string","enum":["FIFO","LIFO","WEIGHTED_AVERAGE","STANDARD_COST","SPECIFIC_IDENTIFICATION"]},"reorderLevel":{"type":"number","format":"double","minimum":0.0},"reorderQuantity":{"type":"number","format":"double","minimum":0.0},"minStockLevel":{"type":"number","format":"double","minimum":0.0},"maxStockLevel":{"type":"number","format":"double","minimum":0.0},"safetyStock":{"type":"number","format":"double","minimum":0.0},"leadTimeDays":{"type":"integer","format":"int32","minimum":0},"trackBatches":{"type":"boolean"},"trackExpiry":{"type":"boolean"},"trackSerialNumbers":{"type":"boolean"},"perishable":{"type":"boolean"},"storageRequirements":{"type":"string","maxLength":500,"minLength":0},"temperatureMin":{"type":"number","format":"double"},"temperatureMax":{"type":"number","format":"double"},"shelfLifeDays":{"type":"integer","format":"int32","minimum":0},"weight":{"type":"number","format":"double"},"length":{"type":"number","format":"double"},"width":{"type":"number","format":"double"},"height":{"type":"number","format":"double"},"preferredSupplierId":{"type":"string","maxLength":200,"minLength":0},"supplierPartNumber":{"type":"string","maxLength":100,"minLength":0},"imageUrl":{"type":"string","maxLength":500,"minLength":0},"notes":{"type":"string","maxLength":1000,"minLength":0},"internalNotes":{"type":"string","maxLength":1000,"minLength":0},"tags":{"type":"string","maxLength":200,"minLength":0},"taxRate":{"type":"number"},"taxCategory":{"type":"string","maxLength":50,"minLength":0},"accountCode":{"type":"string","maxLength":50,"minLength":0},"costCenter":{"type":"string","maxLength":100,"minLength":0}},"required":["baseUnit","category","name","sku"]}
```

## CreatePurchaseOrderRequest
```json
{"type":"object","properties":{"supplierId":{"type":"string","minLength":1},"supplierContactPerson":{"type":"string","maxLength":200,"minLength":0},"supplierContactPhone":{"type":"string","maxLength":100,"minLength":0},"supplierContactEmail":{"type":"string","maxLength":200,"minLength":0},"deliveryLocationId":{"type":"string"},"deliveryAddress":{"type":"string","maxLength":500,"minLength":0},"orderDate":{"type":"string","format":"date"},"expectedDeliveryDate":{"type":"string","format":"date"},"items":{"type":"array","items":{"$ref":"#/components/schemas/PurchaseOrderItemRequest"},"minItems":1},"taxRate":{"type":"number"},"shippingCost":{"type":"number"},"otherCharges":{"type":"number"},"discountPercent":{"type":"number"},"currency":{"type":"string","maxLength":10,"minLength":0},"exchangeRate":{"type":"number","format":"double"},"paymentTerms":{"type":"string","maxLength":200,"minLength":0},"paymentDueDays":{"type":"integer","format":"int32","minimum":0},"paymentMethod":{"type":"string","maxLength":100,"minLength":0},"notes":{"type":"string","maxLength":2000,"minLength":0},"termsAndConditions":{"type":"string","maxLength":1000,"minLength":0},"deliveryInstructions":{"type":"string","maxLength":1000,"minLength":0},"internalNotes":{"type":"string","maxLength":1000,"minLength":0},"requisitionNumber":{"type":"string","maxLength":100,"minLength":0},"quotationNumber":{"type":"string","maxLength":100,"minLength":0}},"required":["items","supplierId"]}
```

## CreateRentalItemRequest
```json
{"type":"object","properties":{"name":{"type":"string","minLength":1},"description":{"type":"string"},"category":{"type":"string","enum":["BICYCLES","BEACH_EQUIPMENT","SPORTS_EQUIPMENT","BABY_EQUIPMENT","CONFERENCE_EQUIPMENT","ENTERTAINMENT","MOBILITY_AIDS","WATER_SPORTS","WINTER_SPORTS","ELECTRONICS","VEHICLES","PARTY_SUPPLIES","CAMPING_GEAR","KITCHEN_APPLIANCES","OTHERS"]},"brand":{"type":"string"},"model":{"type":"string"},"serialNumber":{"type":"string"},"totalQuantity":{"type":"integer","format":"int32","minimum":0},"pricingType":{"type":"string","enum":["HOURLY","DAILY","WEEKLY","MONTHLY","FLAT_RATE"]},"hourlyRate":{"type":"number"},"dailyRate":{"type":"number"},"weeklyRate":{"type":"number"},"monthlyRate":{"type":"number"},"flatRate":{"type":"number"},"depositAmount":{"type":"number"},"replacementValue":{"type":"number"},"lateReturnPenaltyPerHour":{"type":"number"},"lateReturnPenaltyPerDay":{"type":"number"},"size":{"type":"string"},"color":{"type":"string"},"specifications":{"type":"string"},"requiresDeposit":{"type":"boolean"},"requiresIdentification":{"type":"boolean"},"requiresSignedAgreement":{"type":"boolean"},"minimumAge":{"type":"integer","format":"int32"},"usageInstructions":{"type":"string"},"safetyInstructions":{"type":"string"},"maintenanceNotes":{"type":"string"},"condition":{"type":"string","enum":["EXCELLENT","GOOD","FAIR","POOR","DAMAGED","OUT_OF_SERVICE"]}},"required":["category","condition","name","pricingType","totalQuantity"]}
```

## CreateRentalOrderRequest
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"customerName":{"type":"string","minLength":1},"customerPhone":{"type":"string"},"customerEmail":{"type":"string"},"organizationId":{"type":"string"},"identificationNumber":{"type":"string"},"identificationType":{"type":"string"},"rentalStartTime":{"type":"string","format":"date-time"},"rentalEndTime":{"type":"string","format":"date-time"},"items":{"type":"array","items":{"$ref":"#/components/schemas/RentalOrderItemRequest"},"minItems":1},"specialInstructions":{"type":"string"},"customerNotes":{"type":"string"},"chargeOverduePenalty":{"type":"boolean"},"sendOverdueNotice":{"type":"boolean"},"sendReminders":{"type":"boolean"},"requireDeposit":{"type":"boolean"},"requireAgreement":{"type":"boolean"}},"required":["customerName","items","rentalEndTime","rentalStartTime"]}
```

## CreateRentalPaymentRequest
```json
{"type":"object","properties":{"rentalOrderId":{"type":"string","minLength":1},"amount":{"type":"number"},"currency":{"type":"string"},"method":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"reference":{"type":"string"},"status":{"type":"string","enum":["SUCCESS","FAILED","PENDING","CANCELLED","REFUNDED","PARTLY_PAID","FULLY_PAID"]},"type":{"type":"string","enum":["DEPOSIT","INSTALLMENT","RENTAL_FEE","FULL_PAYMENT","FINAL","DAMAGE_FEE","LATE_PENALTY","EXTENSION_FEE","DEPOSIT_REFUND","REFUND","OTHER"]},"paymentDate":{"type":"string","format":"date-time"},"notes":{"type":"string"}},"required":["amount","method","rentalOrderId","type"]}
```

## CreateRequisitionRequest
```json
{"type":"object","properties":{"department":{"type":"string","enum":["BAR","KITCHEN","HOUSEKEEPING","FRONT_DESK","MAINTENANCE","MANAGEMENT","INVENTORY","OTHER"]},"storageLocationId":{"type":"string","minLength":1},"requisitionDate":{"type":"string","format":"date"},"requiredByDate":{"type":"string","format":"date"},"purpose":{"type":"string","maxLength":500,"minLength":0},"notes":{"type":"string","maxLength":1000,"minLength":0},"items":{"type":"array","items":{"$ref":"#/components/schemas/RequisitionItemRequest"},"minItems":1}},"required":["department","items","storageLocationId"]}
```

## CreateRoomRequest
```json
{"type":"object","properties":{"roomIdentifier":{"type":"string"},"roomType":{"type":"string"},"roomPrice":{"type":"number"},"roomFacility":{"type":"array","items":{"type":"string"}}}}
```

## CreateServicePaymentLinkRequest
```json
{"type":"object","description":"Request to create a payment link for a service (booking, laundry, rental, kitchen)","properties":{"amount":{"type":"number","description":"Payment amount","example":5000.0,"minimum":100.0},"currency":{"type":"string","default":"NGN","description":"Currency code","example":"NGN"},"description":{"type":"string","description":"Payment description/purpose","example":"Payment for Room 101 booking"},"customerName":{"type":"string","description":"Customer name (auto-extracted from order if not provided)","example":"John Doe"},"customerPhone":{"type":"string","description":"Customer phone (auto-extracted from order if not provided)","example":"+2348012345678"},"customerEmail":{"type":"string","description":"Customer email (auto-extracted from order if not provided)","example":"john@example.com"},"expiryHours":{"type":"integer","format":"int32","description":"Payment link expiry in hours","example":24},"sendViaWhatsApp":{"type":"boolean","default":false,"description":"Send payment link via WhatsApp","example":true}},"required":["amount","description"]}
```

## CreateStockAdjustmentRequest
```json
{"type":"object","properties":{"productId":{"type":"string","minLength":1},"locationId":{"type":"string","minLength":1},"batchId":{"type":"string"},"adjustmentDate":{"type":"string","format":"date-time"},"reason":{"type":"string","enum":["DAMAGED","EXPIRED","STOLEN","LOST","QUALITY_ISSUE","STOCK_COUNT_VARIANCE","SPILLAGE","BREAKAGE","OBSOLETE","DATA_ENTRY_ERROR","RETURNED_TO_SUPPLIER","FOUND","OTHER"]},"adjustmentType":{"type":"string","minLength":1,"pattern":"INCREASE|DECREASE"},"adjustmentQuantity":{"type":"number","minimum":0.0},"unitCost":{"type":"number","minimum":0.0},"stockTakeId":{"type":"string"},"requiresApproval":{"type":"boolean"},"description":{"type":"string","maxLength":2000,"minLength":0},"notes":{"type":"string","maxLength":1000,"minLength":0},"responsiblePerson":{"type":"string","maxLength":200,"minLength":0},"incidentNumber":{"type":"string","maxLength":100,"minLength":0},"insuranceClaim":{"type":"boolean"},"claimNumber":{"type":"string","maxLength":100,"minLength":0},"claimAmount":{"type":"number","minimum":0.0}},"required":["adjustmentDate","adjustmentQuantity","adjustmentType","description","locationId","productId","reason"]}
```

## CreateStockTakeRequest
```json
{"type":"object","properties":{"locationId":{"type":"string","minLength":1},"stockTakeType":{"type":"string","enum":["FULL","PARTIAL"]},"scheduledDate":{"type":"string","format":"date"},"supervisorName":{"type":"string","maxLength":200,"minLength":0},"countedBy":{"type":"string","maxLength":500,"minLength":0},"acceptableVariancePercent":{"type":"number","maximum":100.0,"minimum":0.0},"stockFrozen":{"type":"boolean"},"productIds":{"type":"array","items":{"type":"string"}},"notes":{"type":"string","maxLength":2000,"minLength":0}},"required":["locationId","scheduledDate","stockTakeType"]}
```

## CreateStorageLocationRequest
```json
{"type":"object","properties":{"locationCode":{"type":"string","maxLength":50,"minLength":0},"locationName":{"type":"string","maxLength":200,"minLength":0},"locationType":{"type":"string","enum":["MAIN_WAREHOUSE","KITCHEN_STORE","BAR_STORE","HOUSEKEEPING_STORE","MAINTENANCE_STORE","OFFICE_STORE","COLD_STORAGE","FREEZER","DRY_STORE","CELLAR","EXTERNAL_WAREHOUSE","MOBILE_STORAGE","OTHER"]},"description":{"type":"string","maxLength":500,"minLength":0},"building":{"type":"string","maxLength":200,"minLength":0},"floor":{"type":"string","maxLength":100,"minLength":0},"room":{"type":"string","maxLength":100,"minLength":0},"physicalAddress":{"type":"string","maxLength":500,"minLength":0},"totalCapacity":{"type":"number","format":"double","minimum":0.0},"capacityUnit":{"type":"string"},"temperatureControlled":{"type":"boolean"},"minTemperature":{"type":"number","format":"double"},"maxTemperature":{"type":"number","format":"double"},"humidityControlled":{"type":"boolean"},"minHumidity":{"type":"number","format":"double"},"maxHumidity":{"type":"number","format":"double"},"accessRestrictions":{"type":"string","maxLength":200,"minLength":0},"managerUserId":{"type":"string","maxLength":200,"minLength":0},"contactPerson":{"type":"string","maxLength":200,"minLength":0},"contactPhone":{"type":"string","maxLength":50,"minLength":0},"isPrimary":{"type":"boolean"},"allowNegativeStock":{"type":"boolean"},"operatingHours":{"type":"string","maxLength":1000,"minLength":0},"specialInstructions":{"type":"string","maxLength":1000,"minLength":0},"notes":{"type":"string","maxLength":1000,"minLength":0}},"required":["locationCode","locationName","locationType"]}
```

## CustomPageApprovalRequestResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/ApprovalRequestResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageAuditLogResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/AuditLogResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageBarItemAvailabilityResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/BarItemAvailabilityResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageBarRestockRequestResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/BarRestockRequestResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageBookingPaymentResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/BookingPaymentResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageBookingViewResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/BookingViewResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageChatConversationResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/ChatConversationResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageChatMessageResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/ChatMessageResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageExpenditureResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/ExpenditureResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageGetHotelResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/GetHotelResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageGoodsReceiptNoteResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/GoodsReceiptNoteResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageGuestSpendingDetails
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/GuestSpendingDetails"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageHotelBizResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/HotelBizResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageHotelSummary
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/HotelSummary"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageKitchenPaymentResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/KitchenPaymentResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageKitchenSaleResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/KitchenSaleResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageLaundryOrderSummaryResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/LaundryOrderSummaryResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageLostAndFoundItemResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/LostAndFoundItemResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageOrganizationResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/OrganizationResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageOtherIncomeResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/OtherIncomeResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPagePaymentLinkResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/PaymentLinkResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPagePaymentLinkTransactionResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/PaymentLinkTransactionResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPagePayoutTransactionResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/PayoutTransactionResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageProductResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/ProductResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPagePurchaseOrderResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/PurchaseOrderResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageRentalCustomerLogResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/RentalCustomerLogResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageRentalOrderSummaryResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/RentalOrderSummaryResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageRentalPaymentHistoryResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/RentalPaymentHistoryResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageRestaurantDailySummary
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/RestaurantDailySummary"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageRestaurantItemSalesDetail
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/RestaurantItemSalesDetail"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageRestaurantStockResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/RestaurantStockResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageRoomFoodSalesBookingBreakdown
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/RoomFoodSalesBookingBreakdown"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageRoomResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/RoomResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageStaffResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/StaffResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageStockAdjustmentResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/StockAdjustmentResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageStockLevelResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/StockLevelResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageStockMovementResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/StockMovementResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageStockRequisitionResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/StockRequisitionResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageStockTakeResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/StockTakeResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageStorageLocationResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/StorageLocationResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageSupplierResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/SupplierResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## CustomPageUserModelResponse
```json
{"type":"object","properties":{"content":{"type":"array","items":{"$ref":"#/components/schemas/UserModelResponse"}},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"last":{"type":"boolean"},"first":{"type":"boolean"}}}
```

## Customer
```json
{"type":"object","properties":{"id":{"type":"integer","format":"int64"},"first_name":{"type":"string"},"last_name":{"type":"string"},"email":{"type":"string"},"customer_code":{"type":"string"},"phone":{"type":"string"}}}
```

## CustomerRentalDetailsResponse
```json
{"type":"object","properties":{"orders":{"type":"array","items":{"$ref":"#/components/schemas/RentalOrderSummaryResponse"}},"outstanding":{"type":"array","items":{"$ref":"#/components/schemas/RentalOrderSummaryResponse"}}}}
```

## DailyFinancialBreakdown
```json
{"type":"object","properties":{"date":{"type":"string","format":"date"},"roomRevenue":{"type":"number"},"kitchenRevenue":{"type":"number"},"barRevenue":{"type":"number"},"totalRevenue":{"type":"number"}}}
```

## DailyStats
```json
{"type":"object","properties":{"date":{"type":"string","format":"date"},"ordersCreated":{"type":"integer","format":"int64"},"ordersCompleted":{"type":"integer","format":"int64"},"revenue":{"type":"number"},"itemsRented":{"type":"integer","format":"int32"}}}
```

## DailySummaryStatistics
```json
{"type":"object","properties":{"peakRevenueDate":{"type":"string","format":"date"},"peakRevenue":{"type":"number"},"lowestRevenueDate":{"type":"string","format":"date"},"lowestRevenue":{"type":"number"},"mostPopularDestination":{"type":"string"},"mostPopularDestinationRevenue":{"type":"number"},"dayOfWeekPerformance":{"type":"array","items":{"$ref":"#/components/schemas/DayOfWeekPerformance"}}}}
```

## DayOfWeekPerformance
```json
{"type":"object","properties":{"dayOfWeek":{"type":"string"},"averageRevenue":{"type":"number"},"orderCount":{"type":"integer","format":"int32"}}}
```

## DeleteEntityRequest
```json
{"type":"object","properties":{"reason":{"type":"string","maxLength":1000,"minLength":0}},"required":["reason"]}
```

## DestinationConsumption
```json
{"type":"object","properties":{"destination":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"revenue":{"type":"number"},"orderCount":{"type":"integer","format":"int32"},"percentageOfTotal":{"type":"number"}}}
```

## DestinationResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"hotelId":{"type":"string"},"hotelName":{"type":"string"},"isActive":{"type":"boolean"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## EditStaffRequest
```json
{"type":"object","properties":{"fullName":{"type":"string"},"phoneNumber":{"type":"string"},"email":{"type":"string"}}}
```

## EnhancedRestaurantDailySummaryResponse
```json
{"type":"object","properties":{"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"totalDays":{"type":"integer","format":"int32"},"periodTotals":{"$ref":"#/components/schemas/PeriodTotals"},"dailySummaries":{"type":"array","items":{"$ref":"#/components/schemas/RestaurantDailySummary"}},"totalsByDestination":{"type":"array","items":{"$ref":"#/components/schemas/LocationAmount"}},"statistics":{"$ref":"#/components/schemas/DailySummaryStatistics"}}}
```

## EventData
```json
{"type":"object","properties":{"id":{"type":"integer","format":"int64"},"domain":{"type":"string"},"status":{"type":"string"},"reference":{"type":"string"},"amount":{"type":"integer","format":"int64"},"currency":{"type":"string"},"paid_at":{"type":"string"},"created_at":{"type":"string"},"channel":{"type":"string"},"fees":{"type":"integer","format":"int64"},"ip_address":{"type":"string"},"gateway_response":{"type":"string"},"customer":{"$ref":"#/components/schemas/Customer"},"authorization":{"$ref":"#/components/schemas/Authorization"},"metadata":{"type":"object","additionalProperties":{}},"transfer_code":{"type":"string"},"reason":{"type":"string"},"recipient":{},"source":{"type":"string"},"failures":{}}}
```

## ExpenditureResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"referenceNumber":{"type":"string"},"hotelId":{"type":"string"},"category":{"type":"string","enum":["SALARIES_AND_WAGES","STAFF_BENEFITS","STAFF_TRAINING","STAFF_UNIFORMS","STAFF_MEALS","RECRUITMENT","ELECTRICITY","WATER","GAS","INTERNET_AND_PHONE","WASTE_MANAGEMENT","BUILDING_MAINTENANCE","ROOM_MAINTENANCE","EQUIPMENT_REPAIR","HVAC_MAINTENANCE","PLUMBING","ELECTRICAL_WORK","PAINTING_AND_DECORATION","LANDSCAPING","POOL_MAINTENANCE","CLEANING_SUPPLIES","GUEST_AMENITIES","KITCHEN_SUPPLIES","OFFICE_SUPPLIES","FOOD_AND_BEVERAGE","LAUNDRY_SUPPLIES","DIGITAL_MARKETING","PRINT_ADVERTISING","SOCIAL_MEDIA_MARKETING","WEBSITE_MAINTENANCE","PROMOTIONS","PHOTOGRAPHY","SOFTWARE_LICENSES","HARDWARE_PURCHASE","IT_SERVICES","POS_SYSTEM","BOOKING_SYSTEM","PROPERTY_INSURANCE","LIABILITY_INSURANCE","EMPLOYEE_INSURANCE","VEHICLE_INSURANCE","LEGAL_FEES","ACCOUNTING_FEES","CONSULTING_FEES","AUDIT_FEES","PROPERTY_TAX","BUSINESS_LICENSE","REGULATORY_FEES","SECURITY_SERVICES","PEST_CONTROL","ELEVATOR_MAINTENANCE","FIRE_SAFETY","VEHICLE_FUEL","VEHICLE_MAINTENANCE","SHUTTLE_SERVICE","DELIVERY_CHARGES","COMPLIMENTARY_SERVICES","GUEST_ENTERTAINMENT","GUEST_TRANSPORTATION","BANK_CHARGES","LOAN_INTEREST","CREDIT_CARD_FEES","CHARITABLE_DONATIONS","SUBSCRIPTIONS","MEMBERSHIPS","CONTINGENCY","OTHERS"]},"title":{"type":"string"},"description":{"type":"string"},"amount":{"type":"number"},"paymentMethod":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"status":{"type":"string","enum":["PENDING","APPROVED","PAID","PARTIALLY_PAID","REJECTED","CANCELLED","REFUNDED","OVERDUE","DISPUTED"]},"expenseDate":{"type":"string","format":"date"},"dueDate":{"type":"string","format":"date"},"paidDate":{"type":"string","format":"date"},"vendorName":{"type":"string"},"vendorContact":{"type":"string"},"vendorAddress":{"type":"string"},"invoiceNumber":{"type":"string"},"purchaseOrderNumber":{"type":"string"},"departmentId":{"type":"string"},"requestedBy":{"type":"string"},"approvedBy":{"type":"string"},"approvedAt":{"type":"string","format":"date-time"},"amountPaid":{"type":"number"},"balanceDue":{"type":"number"},"paymentReference":{"type":"string"},"taxAmount":{"type":"number"},"taxType":{"type":"string"},"taxRate":{"type":"number","format":"double"},"subtotal":{"type":"number"},"recurrenceType":{"type":"string","enum":["ONE_TIME","DAILY","WEEKLY","MONTHLY","QUARTERLY","YEARLY"]},"parentExpenditureId":{"type":"string"},"nextOccurrence":{"type":"string","format":"date"},"receiptUrl":{"type":"string"},"attachmentUrls":{"type":"string"},"notes":{"type":"string"},"internalNotes":{"type":"string"},"accountCode":{"type":"string"},"costCenter":{"type":"string"},"budgetId":{"type":"string"},"budgetApproved":{"type":"boolean"},"rejectionReason":{"type":"string"},"cancellationReason":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"updatedBy":{"type":"string"}}}
```

## ExpenseSourceBreakdown
```json
{"type":"object","properties":{"category":{"type":"string","enum":["SALARIES_AND_WAGES","STAFF_BENEFITS","STAFF_TRAINING","STAFF_UNIFORMS","STAFF_MEALS","RECRUITMENT","ELECTRICITY","WATER","GAS","INTERNET_AND_PHONE","WASTE_MANAGEMENT","BUILDING_MAINTENANCE","ROOM_MAINTENANCE","EQUIPMENT_REPAIR","HVAC_MAINTENANCE","PLUMBING","ELECTRICAL_WORK","PAINTING_AND_DECORATION","LANDSCAPING","POOL_MAINTENANCE","CLEANING_SUPPLIES","GUEST_AMENITIES","KITCHEN_SUPPLIES","OFFICE_SUPPLIES","FOOD_AND_BEVERAGE","LAUNDRY_SUPPLIES","DIGITAL_MARKETING","PRINT_ADVERTISING","SOCIAL_MEDIA_MARKETING","WEBSITE_MAINTENANCE","PROMOTIONS","PHOTOGRAPHY","SOFTWARE_LICENSES","HARDWARE_PURCHASE","IT_SERVICES","POS_SYSTEM","BOOKING_SYSTEM","PROPERTY_INSURANCE","LIABILITY_INSURANCE","EMPLOYEE_INSURANCE","VEHICLE_INSURANCE","LEGAL_FEES","ACCOUNTING_FEES","CONSULTING_FEES","AUDIT_FEES","PROPERTY_TAX","BUSINESS_LICENSE","REGULATORY_FEES","SECURITY_SERVICES","PEST_CONTROL","ELEVATOR_MAINTENANCE","FIRE_SAFETY","VEHICLE_FUEL","VEHICLE_MAINTENANCE","SHUTTLE_SERVICE","DELIVERY_CHARGES","COMPLIMENTARY_SERVICES","GUEST_ENTERTAINMENT","GUEST_TRANSPORTATION","BANK_CHARGES","LOAN_INTEREST","CREDIT_CARD_FEES","CHARITABLE_DONATIONS","SUBSCRIPTIONS","MEMBERSHIPS","CONTINGENCY","OTHERS"]},"categoryDisplay":{"type":"string"},"amount":{"type":"number"},"percentage":{"type":"number"},"transactionCount":{"type":"integer","format":"int64"},"averageExpenseValue":{"type":"number"},"paidAmount":{"type":"number"},"pendingAmount":{"type":"number"},"overdueAmount":{"type":"number"}}}
```

## ExtendRentalRequest
```json
{"type":"object","properties":{"newEndTime":{"type":"string","format":"date-time"},"notes":{"type":"string"}},"required":["newEndTime"]}
```

## FeedbackRequest
```json
{"type":"object","properties":{"title":{"type":"string"},"message":{"type":"string"},"serious":{"type":"boolean"}}}
```

## FeedbackResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"hotelName":{"type":"string"},"submittedBy":{"type":"string"},"title":{"type":"string"},"message":{"type":"string"},"status":{"type":"string","enum":["PENDING","IN_PROGRESS","DONE","IRRELEVANT"]},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"serious":{"type":"boolean"}}}
```

## FileUploadResponse
```json
{"type":"object","properties":{"url":{"type":"string"}}}
```

## FinancialDashboardResponse
```json
{"type":"object","properties":{"hotelId":{"type":"string"},"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"period":{"type":"string"},"totalRevenue":{"type":"number"},"totalExpenses":{"type":"number"},"netProfit":{"type":"number"},"netProfitMargin":{"type":"number"},"cashBalance":{"type":"number"},"revenueGrowth":{"type":"number"},"expenseGrowth":{"type":"number"},"profitGrowth":{"type":"number"},"topRevenueStreams":{"type":"array","items":{"$ref":"#/components/schemas/RevenueSourceBreakdown"}},"topExpenseCategories":{"type":"array","items":{"$ref":"#/components/schemas/ExpenseSourceBreakdown"}},"totalOutstandingReceivables":{"type":"number"},"totalOverduePayables":{"type":"number"},"overdueExpendituresCount":{"type":"integer","format":"int64"},"totalCustomerTransactions":{"type":"integer","format":"int64"},"averageRevenuePerTransaction":{"type":"number"},"occupancyRate":{"type":"number"},"averageDailyRate":{"type":"number"},"revenuePerAvailableRoom":{"type":"number"},"financialAlerts":{"type":"array","items":{"type":"string"}},"trendData":{"type":"array","items":{"$ref":"#/components/schemas/PeriodFinancialSummary"}}}}
```

## ForceResetPasswordRequest
```json
{"type":"object","properties":{"newPassword":{"type":"string"},"confirmPassword":{"type":"string"}}}
```

## GRNDashboardStatsResponse
```json
{"type":"object","properties":{"totalGRNs":{"type":"integer","format":"int64"},"draftGRNs":{"type":"integer","format":"int64"},"pendingInspectionGRNs":{"type":"integer","format":"int64"},"acceptedGRNs":{"type":"integer","format":"int64"},"grnsWithRejectedItems":{"type":"integer","format":"int64"},"stockPostedGRNs":{"type":"integer","format":"int64"},"totalValue":{"type":"number"},"totalQuantityReceived":{"type":"number"},"totalQuantityAccepted":{"type":"number"},"totalQuantityRejected":{"type":"number"},"grnsToday":{"type":"integer","format":"int64"},"valueToday":{"type":"number"},"uniqueSuppliers":{"type":"integer","format":"int64"}}}
```

## GRNItemRequest
```json
{"type":"object","properties":{"productId":{"type":"string","minLength":1},"purchaseOrderItemId":{"type":"string"},"quantityReceived":{"type":"number","minimum":0.0},"quantityAccepted":{"type":"number","minimum":0.0},"quantityRejected":{"type":"number","minimum":0.0},"unit":{"type":"string","minLength":1},"unitPrice":{"type":"number","minimum":0.0},"taxRate":{"type":"number"},"batchNumber":{"type":"string","maxLength":100,"minLength":0},"serialNumber":{"type":"string","maxLength":100,"minLength":0},"manufactureDate":{"type":"string","format":"date"},"expiryDate":{"type":"string","format":"date"},"qualityStatus":{"type":"string","maxLength":100,"minLength":0},"qualityNotes":{"type":"string","maxLength":2000,"minLength":0},"rejectionReason":{"type":"string","maxLength":500,"minLength":0},"damageDetails":{"type":"string","maxLength":500,"minLength":0},"packagingCondition":{"type":"string","maxLength":500,"minLength":0},"damaged":{"type":"boolean"},"expired":{"type":"boolean"},"notes":{"type":"string","maxLength":1000,"minLength":0},"storageLocation":{"type":"string","maxLength":200,"minLength":0}},"required":["productId","quantityAccepted","quantityReceived","unit"]}
```

## GetHotelResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"name":{"type":"string"},"address":{"type":"string"},"location":{"type":"string"},"totalRoom":{"type":"string"},"occupancyRate":{"type":"string"},"grossRevenue":{"type":"string"},"expenses":{"type":"string"},"manager":{"$ref":"#/components/schemas/StaffResponse"}}}
```

## GoodsReceiptNoteItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"lineNumber":{"type":"integer","format":"int32"},"productId":{"type":"string"},"productSku":{"type":"string"},"productName":{"type":"string"},"purchaseOrderItemId":{"type":"string"},"quantityOrdered":{"type":"number"},"quantityReceived":{"type":"number"},"quantityAccepted":{"type":"number"},"quantityRejected":{"type":"number"},"unit":{"type":"string"},"unitPrice":{"type":"number"},"lineTotal":{"type":"number"},"taxRate":{"type":"number"},"taxAmount":{"type":"number"},"batchId":{"type":"string"},"batchNumber":{"type":"string"},"serialNumber":{"type":"string"},"manufactureDate":{"type":"string","format":"date"},"expiryDate":{"type":"string","format":"date"},"qualityStatus":{"type":"string"},"qualityNotes":{"type":"string"},"rejectionReason":{"type":"string"},"damageDetails":{"type":"string"},"packagingCondition":{"type":"string"},"damaged":{"type":"boolean"},"expired":{"type":"boolean"},"notes":{"type":"string"},"storageLocation":{"type":"string"},"stockMovementId":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## GoodsReceiptNoteResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"grnNumber":{"type":"string"},"status":{"type":"string","enum":["DRAFT","PENDING_INSPECTION","INSPECTION_PASSED","INSPECTION_FAILED","PARTIALLY_ACCEPTED","ACCEPTED","REJECTED","RETURNED_TO_SUPPLIER","CANCELLED"]},"purchaseOrderId":{"type":"string"},"purchaseOrderNumber":{"type":"string"},"supplierId":{"type":"string"},"supplierName":{"type":"string"},"supplierInvoiceNumber":{"type":"string"},"supplierInvoiceDate":{"type":"string","format":"date"},"supplierDeliveryNote":{"type":"string"},"storageLocationId":{"type":"string"},"storageLocationCode":{"type":"string"},"storageLocationName":{"type":"string"},"receiptDate":{"type":"string","format":"date"},"receiptTime":{"type":"string","format":"date-time"},"receivedBy":{"type":"string"},"deliveredBy":{"type":"string"},"vehicleNumber":{"type":"string"},"inspectionRequired":{"type":"boolean"},"inspectionDate":{"type":"string","format":"date-time"},"inspectedBy":{"type":"string"},"inspectionResult":{"type":"string"},"inspectionNotes":{"type":"string"},"items":{"type":"array","items":{"$ref":"#/components/schemas/GoodsReceiptNoteItemResponse"}},"totalAmount":{"type":"number"},"taxAmount":{"type":"number"},"discountAmount":{"type":"number"},"netAmount":{"type":"number"},"totalQuantityReceived":{"type":"number"},"totalQuantityAccepted":{"type":"number"},"totalQuantityRejected":{"type":"number"},"stockPosted":{"type":"boolean"},"stockPostedAt":{"type":"string","format":"date-time"},"stockPostedBy":{"type":"string"},"hasRejectedItems":{"type":"boolean"},"returnedToSupplier":{"type":"boolean"},"returnedAt":{"type":"string","format":"date-time"},"returnNote":{"type":"string"},"notes":{"type":"string"},"discrepancies":{"type":"string"},"packagingCondition":{"type":"string"},"attachmentUrls":{"type":"string"},"cancelled":{"type":"boolean"},"cancelledAt":{"type":"string","format":"date-time"},"cancelledBy":{"type":"string"},"cancellationReason":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"updatedBy":{"type":"string"}}}
```

## GuestLogResponse
```json
{"type":"object","properties":{"customId":{"type":"string"},"guestName":{"type":"string"},"phoneNumber":{"type":"string"},"roomIdentifier":{"type":"string"},"bookingStatus":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"checkOutDate":{"type":"string","format":"date-time"}}}
```

## GuestSpendingDetails
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"guestName":{"type":"string"},"roomIdentifier":{"type":"string"},"roomType":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"dailySpendingCap":{"type":"number"},"amountSpentToday":{"type":"number"},"amountLeftToday":{"type":"number"},"capExceeded":{"type":"boolean"}}}
```

## HotelBizResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"customId":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"totalHotels":{"type":"integer","format":"int32"}}}
```

## HotelDashboardResponse
```json
{"type":"object","properties":{"totalEarnings":{"type":"number"},"occupancyRate":{"type":"number","format":"double"},"totalCheckIns":{"type":"integer","format":"int64"},"totalCheckOuts":{"type":"integer","format":"int64"},"totalRooms":{"type":"integer","format":"int64"},"totalAvailableRooms":{"type":"integer","format":"int64"},"selectedMonth":{"type":"string"}}}
```

## HotelDto
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"name":{"type":"string"},"location":{"type":"string"},"address":{"type":"string"}}}
```

## HotelFrontDeskDashboardCardResponse
```json
{"type":"object","properties":{"totalCheckIns":{"type":"integer","format":"int64"},"totalCheckOuts":{"type":"integer","format":"int64"},"totalReservedRooms":{"type":"integer","format":"int64"},"totalAvailableRooms":{"type":"integer","format":"int64"}}}
```

## HotelPerformanceResponse
```json
{"type":"object","properties":{"hotelId":{"type":"string"},"hotelName":{"type":"string"},"performancePercentage":{"type":"number","format":"double"}}}
```

## HotelSignUpRequest
```json
{"type":"object","properties":{"businessName":{"type":"string","maxLength":200,"minLength":2},"businessRegistrationNumber":{"type":"string","minLength":1,"pattern":"^[A-Z0-9-]{5,50}$"},"businessType":{"type":"string","minLength":1},"businessDescription":{"type":"string","maxLength":1000,"minLength":0},"ownerFullName":{"type":"string","maxLength":100,"minLength":2},"ownerPosition":{"type":"string","maxLength":100,"minLength":0},"email":{"type":"string","maxLength":255,"minLength":0},"phoneNumber":{"type":"string","minLength":1,"pattern":"^\\+?[1-9]\\d{1,14}$"},"alternativePhone":{"type":"string","maxLength":20,"minLength":0,"pattern":"^\\+?[1-9]\\d{1,14}$"},"streetAddress":{"type":"string","maxLength":255,"minLength":0},"city":{"type":"string","maxLength":100,"minLength":0},"stateProvince":{"type":"string","maxLength":100,"minLength":0},"country":{"type":"string","maxLength":100,"minLength":0},"postalCode":{"type":"string","maxLength":20,"minLength":0},"timezone":{"type":"string","maxLength":50,"minLength":0},"currency":{"type":"string","minLength":1,"pattern":"^[A-Z]{3}$"},"websiteUrl":{"type":"string","maxLength":255,"minLength":0,"pattern":"^(https?://)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(/.*)?$"},"taxId":{"type":"string","maxLength":50,"minLength":0},"vatNumber":{"type":"string","maxLength":50,"minLength":0},"password":{"type":"string","maxLength":128,"minLength":8,"pattern":"^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$"},"confirmPassword":{"type":"string","minLength":1},"acceptedTerms":{"type":"boolean"},"acceptedPrivacyPolicy":{"type":"boolean"},"subscribedToMarketing":{"type":"boolean"},"referralCode":{"type":"string","maxLength":100,"minLength":0},"referralSource":{"type":"string","maxLength":255,"minLength":0},"fullAddress":{"type":"string"},"passwordMatching":{"type":"boolean"}},"required":["acceptedPrivacyPolicy","acceptedTerms","businessName","businessRegistrationNumber","businessType","city","confirmPassword","country","currency","email","ownerFullName","ownerPosition","password","phoneNumber","postalCode","stateProvince","streetAddress","timezone"]}
```

## HotelSummary
```json
{"type":"object","properties":{"hotelId":{"type":"string"},"hotelName":{"type":"string"},"location":{"type":"string"},"address":{"type":"string"}}}
```

## HotelSummaryResponse
```json
{"type":"object","properties":{"hotelId":{"type":"string"},"hotelName":{"type":"string"},"location":{"type":"string"},"totalEarnings":{"type":"number"},"roomEarnings":{"type":"number"},"barEarnings":{"type":"number"},"kitchenEarnings":{"type":"number"},"occupancyRate":{"type":"number","format":"double"},"totalCheckIns":{"type":"integer","format":"int64"},"totalCheckOuts":{"type":"integer","format":"int64"},"totalRooms":{"type":"integer","format":"int64"},"availableRooms":{"type":"integer","format":"int64"}}}
```

## HotelTerminal
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"hotelId":{"type":"string"},"terminalId":{"type":"string"},"terminalName":{"type":"string"},"serialNumber":{"type":"string"},"isActive":{"type":"boolean"},"lastSeenOnline":{"type":"string","format":"date-time"}}}
```

## InfobipDeliveryReport
```json
{"type":"object","properties":{"messageId":{"type":"string"},"to":{"type":"string"},"from":{"type":"string"},"sentAt":{"type":"string"},"doneAt":{"type":"string"},"messageCount":{"type":"integer","format":"int32"},"price":{"$ref":"#/components/schemas/InfobipPrice"},"status":{"$ref":"#/components/schemas/InfobipStatus"},"error":{"$ref":"#/components/schemas/InfobipError"}}}
```

## InfobipDeliveryReportWrapper
```json
{"type":"object","properties":{"results":{"type":"array","items":{"$ref":"#/components/schemas/InfobipDeliveryReport"}}}}
```

## InfobipError
```json
{"type":"object","properties":{"groupId":{"type":"integer","format":"int32"},"groupName":{"type":"string"},"id":{"type":"integer","format":"int32"},"name":{"type":"string"},"description":{"type":"string"},"permanent":{"type":"boolean"}}}
```

## InfobipInboundMessage
```json
{"type":"object","properties":{"messageId":{"type":"string"},"from":{"type":"string"},"to":{"type":"string"},"text":{"type":"string"},"cleanText":{"type":"string"},"keyword":{"type":"string"},"receivedAt":{"type":"string","format":"date-time"},"messageType":{"type":"string"},"price":{"$ref":"#/components/schemas/InfobipPrice"}}}
```

## InfobipInboundMessageWrapper
```json
{"type":"object","properties":{"results":{"type":"array","items":{"$ref":"#/components/schemas/InfobipInboundMessage"}},"messageCount":{"type":"integer","format":"int32"},"pendingMessageCount":{"type":"integer","format":"int32"}}}
```

## InfobipPrice
```json
{"type":"object","properties":{"pricePerMessage":{"type":"number","format":"double"},"currency":{"type":"string"}}}
```

## InfobipStatus
```json
{"type":"object","properties":{"groupId":{"type":"integer","format":"int32"},"groupName":{"type":"string"},"id":{"type":"integer","format":"int32"},"name":{"type":"string"},"description":{"type":"string"}}}
```

## InventoryDashboardResponse
```json
{"type":"object","properties":{"totalProducts":{"type":"integer","format":"int32"},"activeProducts":{"type":"integer","format":"int32"},"lowStockProductsCount":{"type":"integer","format":"int32"},"outOfStockProducts":{"type":"integer","format":"int32"},"expiringSoonProductsCount":{"type":"integer","format":"int32"},"totalInventoryValue":{"type":"number"},"totalStockOnHand":{"type":"number"},"totalReservedStock":{"type":"number"},"totalAvailableStock":{"type":"number"},"pendingPurchaseOrders":{"type":"integer","format":"int32"},"approvedPurchaseOrders":{"type":"integer","format":"int32"},"totalPurchaseOrderValue":{"type":"number"},"pendingGRNs":{"type":"integer","format":"int32"},"todayGRNsReceived":{"type":"integer","format":"int32"},"todayGRNsValue":{"type":"number"},"pendingAdjustments":{"type":"integer","format":"int32"},"todayAdjustments":{"type":"integer","format":"int32"},"scheduledStockTakes":{"type":"integer","format":"int32"},"inProgressStockTakes":{"type":"integer","format":"int32"},"pendingReviewStockTakes":{"type":"integer","format":"int32"},"lowStockProducts":{"type":"array","items":{"$ref":"#/components/schemas/ProductSummary"}},"fastMovingProducts":{"type":"array","items":{"$ref":"#/components/schemas/ProductSummary"}},"slowMovingProducts":{"type":"array","items":{"$ref":"#/components/schemas/ProductSummary"}},"expiringSoonProducts":{"type":"array","items":{"$ref":"#/components/schemas/ProductSummary"}},"recentActivities":{"type":"array","items":{"$ref":"#/components/schemas/RecentActivity"}}}}
```

## ItemConsumptionDetail
```json
{"type":"object","properties":{"itemName":{"type":"string"},"itemType":{"type":"string","enum":["DRINK","FOOD"]},"totalQuantityConsumed":{"type":"integer","format":"int32"},"numberOfOrders":{"type":"integer","format":"int32"},"averageQuantityPerOrder":{"type":"number"},"totalRevenue":{"type":"number"},"averagePrice":{"type":"number"},"highestPrice":{"type":"number"},"lowestPrice":{"type":"number"},"consumptionByDestination":{"type":"array","items":{"$ref":"#/components/schemas/DestinationConsumption"}},"revenueRank":{"type":"integer","format":"int32"},"quantityRank":{"type":"integer","format":"int32"}}}
```

## ItemConsumptionReport
```json
{"type":"object","properties":{"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"hotelId":{"type":"string"},"itemTypeFilter":{"type":"string","enum":["DRINK","FOOD"]},"summary":{"$ref":"#/components/schemas/ReportSummary"},"items":{"type":"array","items":{"$ref":"#/components/schemas/ItemConsumptionDetail"}},"currentPage":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"totalItems":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"}}}
```

## ItemInspection
```json
{"type":"object","properties":{"rentalOrderItemId":{"type":"string"},"condition":{"type":"string","enum":["EXCELLENT","GOOD","FAIR","POOR","DAMAGED","OUT_OF_SERVICE"]},"inspectionNotes":{"type":"string"},"damaged":{"type":"boolean"},"lost":{"type":"boolean"},"damageDescription":{"type":"string"},"damageCharge":{"type":"number"},"replacementCharge":{"type":"number"}},"required":["condition","rentalOrderItemId"]}
```

## ItemPerformance
```json
{"type":"object","properties":{"itemName":{"type":"string"},"quantitySold":{"type":"integer","format":"int32"},"totalRevenue":{"type":"number"},"averagePrice":{"type":"number"},"numberOfOrders":{"type":"integer","format":"int32"}}}
```

## ItemUtilization
```json
{"type":"object","properties":{"itemId":{"type":"string"},"itemName":{"type":"string"},"category":{"type":"string"},"timesRented":{"type":"integer","format":"int32"},"totalQuantityRented":{"type":"integer","format":"int32"},"totalRevenue":{"type":"number"},"utilizationRate":{"type":"number","format":"double"}}}
```

## KitchenPaymentResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"orderId":{"type":"string"},"orderCustomId":{"type":"string"},"destination":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"method":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"reference":{"type":"string"},"status":{"type":"string","enum":["SUCCESS","FAILED","PENDING","CANCELLED","REFUNDED","PARTLY_PAID","FULLY_PAID"]},"type":{"type":"string","enum":["FULL_PAYMENT","INSTALLMENT","REFUND"]},"paymentDate":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"},"orderTotal":{"type":"number"},"totalPaid":{"type":"number"},"remainingBalance":{"type":"number"}}}
```

## KitchenSaleResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"destination":{"type":"string"},"totalAmount":{"type":"number"},"status":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"note":{"type":"string"},"orderItems":{"type":"array","items":{"$ref":"#/components/schemas/OrderItemResponse"}},"isPaid":{"type":"boolean"},"paymentMethod":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"paymentReference":{"type":"string"},"amountPaid":{"type":"number"},"amountRemaining":{"type":"number"}}}
```

## KitchenSaleUpdateRequest
```json
{"type":"object","properties":{"destination":{"type":"string"},"orderItems":{"type":"array","items":{"$ref":"#/components/schemas/OrderItemRequest"}}}}
```

## LaundryDashboardStatsResponse
```json
{"type":"object","properties":{"totalActiveItems":{"type":"integer","format":"int64"},"totalOrders":{"type":"integer","format":"int64"},"pendingOrders":{"type":"integer","format":"int64"},"completedOrders":{"type":"integer","format":"int64"},"totalRevenue":{"type":"number"},"outstandingAmount":{"type":"number"},"ordersToday":{"type":"integer","format":"int64"},"revenueToday":{"type":"number"}}}
```

## LaundryItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"category":{"type":"string","enum":["CLOTHING","BEDDING","TOWELS","CURTAINS","UNIFORMS","TABLE_LINEN","DELICATES","ACCESSORIES","OUTERWEAR","OTHERS"]},"washOnlyPrice":{"type":"number","format":"double"},"washAndIronPrice":{"type":"number","format":"double"},"washAndFoldPrice":{"type":"number","format":"double"},"dryCleanPrice":{"type":"number","format":"double"},"ironOnlyPrice":{"type":"number","format":"double"},"steamPressPrice":{"type":"number","format":"double"},"stainRemovalPrice":{"type":"number","format":"double"},"handWashPrice":{"type":"number","format":"double"},"washIronAndPackPrice":{"type":"number","format":"double"},"expressMultiplier":{"type":"number","format":"double"},"sameDayMultiplier":{"type":"number","format":"double"},"urgentMultiplier":{"type":"number","format":"double"},"active":{"type":"boolean"},"specialInstructions":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"updatedBy":{"type":"string"}}}
```

## LaundryOrderItemRequest
```json
{"type":"object","properties":{"laundryItemId":{"type":"string","minLength":1},"quantity":{"type":"integer","format":"int32","minimum":1},"serviceType":{"type":"string","enum":["WASH_ONLY","WASH_AND_IRON","WASH_AND_FOLD","DRY_CLEAN","IRON_ONLY","STEAM_PRESS","STAIN_REMOVAL","HAND_WASH","WASH_IRON_AND_PACK"]},"itemColor":{"type":"string"},"brandOrLabel":{"type":"string"},"conditionNotes":{"type":"string"},"specialInstructions":{"type":"string"}},"required":["laundryItemId","quantity","serviceType"]}
```

## LaundryOrderItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"laundryItemId":{"type":"string"},"laundryItemName":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"serviceType":{"type":"string","enum":["WASH_ONLY","WASH_AND_IRON","WASH_AND_FOLD","DRY_CLEAN","IRON_ONLY","STEAM_PRESS","STAIN_REMOVAL","HAND_WASH","WASH_IRON_AND_PACK"]},"unitPrice":{"type":"number"},"urgencyMultiplierApplied":{"type":"number"},"totalPrice":{"type":"number"},"itemColor":{"type":"string"},"brandOrLabel":{"type":"string"},"conditionNotes":{"type":"string"},"specialInstructions":{"type":"string"},"damaged":{"type":"boolean"},"lost":{"type":"boolean"},"damageDescription":{"type":"string"},"compensationAmount":{"type":"number"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## LaundryOrderResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"orderNumber":{"type":"string"},"hotelId":{"type":"string"},"bookingId":{"type":"string"},"roomIdentifier":{"type":"string"},"customerName":{"type":"string"},"customerPhone":{"type":"string"},"customerEmail":{"type":"string"},"organizationId":{"type":"string"},"organizationName":{"type":"string"},"status":{"type":"string","enum":["PENDING","PICKED_UP","IN_PROGRESS","WASHING","DRYING","IRONING","QUALITY_CHECK","READY","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","ON_HOLD"]},"urgency":{"type":"string","enum":["STANDARD","EXPRESS","SAME_DAY","URGENT"]},"paymentStatus":{"type":"string","enum":["UNPAID","PAID","PARTIALLY_PAID","CHARGED_TO_ROOM","COMPLIMENTARY","REFUNDED"]},"items":{"type":"array","items":{"$ref":"#/components/schemas/LaundryOrderItemResponse"}},"totalItemsCount":{"type":"integer","format":"int32"},"subtotal":{"type":"number"},"urgencyCharge":{"type":"number"},"discount":{"type":"number"},"tax":{"type":"number"},"totalAmount":{"type":"number"},"amountPaid":{"type":"number"},"balanceDue":{"type":"number"},"payments":{"type":"array","items":{"$ref":"#/components/schemas/LaundryPaymentResponse"}},"paymentCount":{"type":"integer","format":"int32"},"pickupRequestedTime":{"type":"string","format":"date-time"},"actualPickupTime":{"type":"string","format":"date-time"},"expectedDeliveryTime":{"type":"string","format":"date-time"},"actualDeliveryTime":{"type":"string","format":"date-time"},"specialInstructions":{"type":"string"},"customerNotes":{"type":"string"},"internalNotes":{"type":"string"},"pickedUpBy":{"type":"string"},"processedBy":{"type":"string"},"deliveredBy":{"type":"string"},"hasIssues":{"type":"boolean"},"issuesDescription":{"type":"string"},"cancellationReason":{"type":"string"},"cancelledAt":{"type":"string","format":"date-time"},"cancelledBy":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"updatedBy":{"type":"string"}}}
```

## LaundryOrderSummaryResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"orderNumber":{"type":"string"},"customerName":{"type":"string"},"roomIdentifier":{"type":"string"},"status":{"type":"string","enum":["PENDING","PICKED_UP","IN_PROGRESS","WASHING","DRYING","IRONING","QUALITY_CHECK","READY","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","ON_HOLD"]},"urgency":{"type":"string","enum":["STANDARD","EXPRESS","SAME_DAY","URGENT"]},"paymentStatus":{"type":"string","enum":["UNPAID","PAID","PARTIALLY_PAID","CHARGED_TO_ROOM","COMPLIMENTARY","REFUNDED"]},"totalItemsCount":{"type":"integer","format":"int32"},"totalAmount":{"type":"number"},"amountPaid":{"type":"number"},"balanceDue":{"type":"number"},"expectedDeliveryTime":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"},"hasIssues":{"type":"boolean"}}}
```

## LaundryPaymentResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"laundryOrderId":{"type":"string"},"orderNumber":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"method":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"reference":{"type":"string"},"status":{"type":"string","enum":["SUCCESS","FAILED","PENDING","CANCELLED","REFUNDED","PARTLY_PAID","FULLY_PAID"]},"type":{"type":"string","enum":["DEPOSIT","INSTALLMENT","FULL_PAYMENT","FINAL","REFUND","OTHER"]},"paymentDate":{"type":"string","format":"date-time"},"notes":{"type":"string"},"processedBy":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"}}}
```

## LocationAmount
```json
{"type":"object","properties":{"location":{"type":"string"},"amount":{"type":"number"}}}
```

## LocationProductResponse
```json
{"type":"object","properties":{"productId":{"type":"string"},"sku":{"type":"string"},"name":{"type":"string"},"category":{"type":"string"},"quantityOnHand":{"type":"number"},"quantityAvailable":{"type":"number"},"averageCost":{"type":"number"},"isOutOfStock":{"type":"boolean"}}}
```

## LocationStatisticsResponse
```json
{"type":"object","properties":{"totalLocations":{"type":"integer","format":"int64"},"activeLocations":{"type":"integer","format":"int64"},"inactiveLocations":{"type":"integer","format":"int64"},"climateControlledLocations":{"type":"integer","format":"int64"}}}
```

## LoginRequest
```json
{"type":"object","properties":{"email":{"type":"string"},"password":{"type":"string"}}}
```

## LoginResponse
```json
{"type":"object","properties":{"accessToken":{"type":"string"},"refreshToken":{"type":"string"},"expiresIn":{"type":"integer","format":"int64"},"roles":{"type":"array","items":{"type":"string"}}}}
```

## LostAndFoundItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"itemName":{"type":"string"},"description":{"type":"string"},"imageUrl":{"type":"string"},"location":{"type":"string"},"dateFound":{"type":"string","format":"date"},"claimStatus":{"type":"string","enum":["UNCLAIMED","CLAIMED","DISPOSED"]},"claimedBy":{"type":"string"},"claimedDate":{"type":"string","format":"date-time"},"claimNotes":{"type":"string"},"hotelName":{"type":"string"},"loggedBy":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## LostAndFoundStatsResponse
```json
{"type":"object","properties":{"unclaimedItems":{"type":"integer","format":"int64"},"claimedItems":{"type":"integer","format":"int64"},"totalItems":{"type":"integer","format":"int64"}}}
```

## ManualChargeRequest
```json
{"type":"object","properties":{"bookingId":{"type":"string","minLength":1},"description":{"type":"string","minLength":1},"amount":{"type":"number","minimum":0.0}},"required":["amount","bookingId","description"]}
```

## ManualPayoutRequest
```json
{"type":"object","properties":{"transactionId":{"type":"string","minLength":1},"bankAccountId":{"type":"string"},"reason":{"type":"string"}},"required":["transactionId"]}
```

## MarketingEmailRequest
```json
{"type":"object","properties":{"recipientEmail":{"type":"string","minLength":1},"recipientName":{"type":"string"},"ctaUrl":{"type":"string"},"senderName":{"type":"string"}},"required":["recipientEmail"]}
```

## MonthlyEarningsResponse
```json
{"type":"object","properties":{"month":{"type":"string"},"totalEarnings":{"type":"number"}}}
```

## NotificationPageResponse
```json
{"type":"object","properties":{"notifications":{"type":"array","items":{"$ref":"#/components/schemas/NotificationResponse"}},"unreadCount":{"type":"integer","format":"int64"},"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"currentPage":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"hasNext":{"type":"boolean"},"hasPrevious":{"type":"boolean"}}}
```

## NotificationResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"title":{"type":"string"},"message":{"type":"string"},"type":{"type":"string","enum":["USER","ROLE","HOTEL","GLOBAL"]},"targetUserId":{"type":"string"},"targetRole":{"type":"string"},"targetHotelId":{"type":"string"},"category":{"type":"string"},"actionLink":{"type":"string"},"referenceId":{"type":"string"},"icon":{"type":"string"},"color":{"type":"string"},"isRead":{"type":"boolean"},"readAt":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"}}}
```

## OnboardHotelBizRequest
```json
{"type":"object","properties":{"name":{"type":"string"},"email":{"type":"string"},"phoneNumber":{"type":"string"}}}
```

## OnboardHotelRequest
```json
{"type":"object","properties":{"name":{"type":"string"},"location":{"type":"string"},"hotelAddress":{"type":"string"},"managerId":{"type":"string"}}}
```

## OnboardHotelResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"hotelName":{"type":"string"},"hotelAddress":{"type":"string"},"manager":{"$ref":"#/components/schemas/StaffResponse"}}}
```

## OnboardMarketerRequest
```json
{"type":"object","properties":{"fullName":{"type":"string"},"email":{"type":"string"},"phoneNumber":{"type":"string"}}}
```

## OnboardStaffRequest
```json
{"type":"object","properties":{"fullName":{"type":"string","minLength":1},"email":{"type":"string","minLength":1},"password":{"type":"string","minLength":1},"phoneNumber":{"type":"string"},"staffId":{"type":"string"},"roles":{"type":"array","items":{"type":"string","enum":["SUPER_ADMIN","HOTEL_OWNER","MANAGER","INVENTORY","FRONT_DESK","RESTAURANT","MARKETER","RENTALS","LAUNDRY","FINANCIALS"]}},"permissions":{"type":"array","items":{"type":"string","enum":["FRONT_OFFICE","INVENTORY","RENTALS","LAUNDRY","FINANCE","MAINTENANCE","RESTAURANT","HOUSEKEEPING"]}}},"required":["email","fullName","password"]}
```

## OrderItemRequest
```json
{"type":"object","properties":{"itemType":{"type":"string","enum":["DRINK","FOOD"]},"itemId":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"rate":{"type":"number","format":"double"},"note":{"type":"string"}}}
```

## OrderItemResponse
```json
{"type":"object","properties":{"itemType":{"type":"string","enum":["DRINK","FOOD"]},"itemName":{"type":"string"},"itemId":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"price":{"type":"number","format":"double"},"total":{"type":"number","format":"double"},"note":{"type":"string"}}}
```

## OrgTransactionListItem
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"staffName":{"type":"string"},"type":{"type":"string","enum":["ROOM","RESTAURANT","BAR","MANUAL"]},"reference":{"type":"string"},"description":{"type":"string"},"amount":{"type":"number"},"dateTime":{"type":"string","format":"date-time"}}}
```

## OrgTransactionListResponse
```json
{"type":"object","properties":{"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"page":{"type":"integer","format":"int32"},"size":{"type":"integer","format":"int32"},"items":{"type":"array","items":{"$ref":"#/components/schemas/OrgTransactionListItem"}}}}
```

## OrganizationRequest
```json
{"type":"object","properties":{"hotelId":{"type":"string","minLength":1},"name":{"type":"string","minLength":1},"email":{"type":"string","minLength":1},"phoneNumber":{"type":"string","minLength":1},"address":{"type":"string"}},"required":["address","email","hotelId","name","phoneNumber"]}
```

## OrganizationResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"name":{"type":"string"},"email":{"type":"string"},"phoneNumber":{"type":"string"},"address":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## OtherIncomeResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"referenceNumber":{"type":"string"},"hotelId":{"type":"string"},"category":{"type":"string","enum":["EVENT_HOSTING","MEETING_ROOM_RENTAL","BANQUET_SERVICES","VENUE_DECORATION","SPA_SERVICES","GYM_MEMBERSHIP","SWIMMING_POOL_ACCESS","YOGA_CLASSES","WELLNESS_PACKAGES","AIRPORT_SHUTTLE","TAXI_SERVICE","CAR_RENTAL","VALET_PARKING","PARKING_FEES","GIFT_SHOP_SALES","SOUVENIR_SALES","NEWSPAPER_SALES","SNACK_SALES","LIVE_ENTERTAINMENT","GAME_ROOM","MOVIE_NIGHTS","TOUR_PACKAGES","EXCURSION_BOOKING","BUSINESS_CENTER","PRINTING_AND_COPYING","FAX_SERVICES","INTERNET_ACCESS_FEES","SECRETARIAL_SERVICES","TELEPHONE_CHARGES","INTERNATIONAL_CALLS","MOBILE_CHARGING","PET_CARE","BABYSITTING","CONCIERGE_SERVICES","PERSONAL_SHOPPING","PHOTOGRAPHY_SERVICES","ADVERTISING_SPACE","ROOFTOP_ACCESS","TERRACE_RENTAL","STORAGE_RENTAL","GAMING_CONSOLE_RENTAL","LAPTOP_RENTAL","PROJECTOR_RENTAL","LUGGAGE_STORAGE","SAFE_DEPOSIT_BOX","LOST_AND_FOUND_FEES","EARLY_CHECKIN_FEES","LATE_CHECKOUT_FEES","KEY_REPLACEMENT","TOUR_OPERATOR_COMMISSION","TRAVEL_AGENT_COMMISSION","AFFILIATE_INCOME","REFERRAL_INCOME","INTEREST_INCOME","INVESTMENT_RETURNS","DIVIDEND_INCOME","INSURANCE_CLAIMS","DAMAGE_COMPENSATION","VENDOR_REBATES","OTHERS"]},"title":{"type":"string"},"description":{"type":"string"},"amount":{"type":"number"},"paymentMethod":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"status":{"type":"string","enum":["PENDING","APPROVED","PAID","PARTIALLY_PAID","REJECTED","CANCELLED","REFUNDED","OVERDUE","DISPUTED"]},"incomeDate":{"type":"string","format":"date"},"receivedDate":{"type":"string","format":"date"},"customerName":{"type":"string"},"customerContact":{"type":"string"},"customerAddress":{"type":"string"},"bookingId":{"type":"string"},"roomIdentifier":{"type":"string"},"organizationId":{"type":"string"},"organizationName":{"type":"string"},"invoiceNumber":{"type":"string"},"receiptNumber":{"type":"string"},"amountReceived":{"type":"number"},"balanceDue":{"type":"number"},"paymentReference":{"type":"string"},"taxAmount":{"type":"number"},"taxType":{"type":"string"},"taxRate":{"type":"number","format":"double"},"subtotal":{"type":"number"},"commissionAmount":{"type":"number"},"commissionRate":{"type":"number","format":"double"},"commissionPayee":{"type":"string"},"recurrenceType":{"type":"string","enum":["ONE_TIME","DAILY","WEEKLY","MONTHLY","QUARTERLY","YEARLY"]},"parentIncomeId":{"type":"string"},"nextOccurrence":{"type":"string","format":"date"},"departmentId":{"type":"string"},"servedBy":{"type":"string"},"recordedBy":{"type":"string"},"invoiceUrl":{"type":"string"},"attachmentUrls":{"type":"string"},"notes":{"type":"string"},"internalNotes":{"type":"string"},"accountCode":{"type":"string"},"revenueCenter":{"type":"string"},"refunded":{"type":"boolean"},"refundAmount":{"type":"number"},"refundDate":{"type":"string","format":"date"},"refundReason":{"type":"string"},"cancellationReason":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"updatedBy":{"type":"string"}}}
```

## OwnerOverviewResponse
```json
{"type":"object","properties":{"totalEarnings":{"type":"number"},"roomEarnings":{"type":"number"},"barEarnings":{"type":"number"},"kitchenEarnings":{"type":"number"},"overallOccupancyRate":{"type":"number","format":"double"},"totalCheckIns":{"type":"integer","format":"int64"},"totalCheckOuts":{"type":"integer","format":"int64"},"totalRooms":{"type":"integer","format":"int64"},"totalAvailableRooms":{"type":"integer","format":"int64"},"totalHotels":{"type":"integer","format":"int32"},"selectedMonth":{"type":"string"}}}
```

## PageFeedbackResponse
```json
{"type":"object","properties":{"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"pageable":{"$ref":"#/components/schemas/PageableObject"},"size":{"type":"integer","format":"int32"},"content":{"type":"array","items":{"$ref":"#/components/schemas/FeedbackResponse"}},"number":{"type":"integer","format":"int32"},"sort":{"$ref":"#/components/schemas/SortObject"},"numberOfElements":{"type":"integer","format":"int32"},"first":{"type":"boolean"},"last":{"type":"boolean"},"empty":{"type":"boolean"}}}
```

## PageGuestLogResponse
```json
{"type":"object","properties":{"totalElements":{"type":"integer","format":"int64"},"totalPages":{"type":"integer","format":"int32"},"pageable":{"$ref":"#/components/schemas/PageableObject"},"size":{"type":"integer","format":"int32"},"content":{"type":"array","items":{"$ref":"#/components/schemas/GuestLogResponse"}},"number":{"type":"integer","format":"int32"},"sort":{"$ref":"#/components/schemas/SortObject"},"numberOfElements":{"type":"integer","format":"int32"},"first":{"type":"boolean"},"last":{"type":"boolean"},"empty":{"type":"boolean"}}}
```

## Pageable
```json
{"type":"object","properties":{"page":{"type":"integer","format":"int32","minimum":0},"size":{"type":"integer","format":"int32","minimum":1},"sort":{"type":"array","items":{"type":"string"}}}}
```

## PageableObject
```json
{"type":"object","properties":{"paged":{"type":"boolean"},"pageNumber":{"type":"integer","format":"int32"},"pageSize":{"type":"integer","format":"int32"},"offset":{"type":"integer","format":"int64"},"sort":{"$ref":"#/components/schemas/SortObject"},"unpaged":{"type":"boolean"}}}
```

## PasswordResetRequest
```json
{"type":"object","properties":{"email":{"type":"string"}}}
```

## PaymentCallbackResponse
```json
{"type":"object","properties":{"paymentLink":{"$ref":"#/components/schemas/PaymentLinkResponse"},"paymentStatus":{"type":"string","enum":["SUCCESS","FAILED","PENDING","NOT_INITIALIZED"]},"paystackStatus":{"type":"string"},"gatewayMessage":{"type":"string"},"amountPaidKobo":{"type":"integer","format":"int64"},"amountPaid":{"type":"number"},"paymentChannel":{"type":"string"},"paidAt":{"type":"string"},"customerEmail":{"type":"string"},"customerPhone":{"type":"string"},"cardDetails":{"$ref":"#/components/schemas/CardDetails"}}}
```

## PaymentInitializationResponse
```json
{"type":"object","properties":{"paymentLink":{"$ref":"#/components/schemas/PaymentLinkResponse"},"authorizationUrl":{"type":"string"}}}
```

## PaymentLinkResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"reference":{"type":"string"},"shortCode":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"description":{"type":"string"},"customerName":{"type":"string"},"customerPhone":{"type":"string"},"customerEmail":{"type":"string"},"status":{"type":"string"},"serviceFeeBearer":{"type":"string"},"serviceFeePercentage":{"type":"number"},"serviceFeeAmount":{"type":"number"},"amountToCharge":{"type":"number"},"hotelReceives":{"type":"number"},"paymentUrl":{"type":"string"},"paystackAuthorizationUrl":{"type":"string"},"expiresAt":{"type":"string","format":"date-time"},"paidAt":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"}}}
```

## PaymentLinkTransactionResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"transactionReference":{"type":"string"},"paystackReference":{"type":"string"},"paymentLinkId":{"type":"string"},"paymentLinkReference":{"type":"string"},"amountPaid":{"type":"number"},"currency":{"type":"string"},"serviceFee":{"type":"number"},"paystackPayinFee":{"type":"number"},"paystackPayoutFee":{"type":"number"},"totalFees":{"type":"number"},"netAmount":{"type":"number"},"status":{"type":"string"},"paymentDate":{"type":"string","format":"date-time"},"verifiedAt":{"type":"string","format":"date-time"},"customerName":{"type":"string"},"customerEmail":{"type":"string"},"customerPhone":{"type":"string"},"paystackChannel":{"type":"string"},"payoutStatus":{"type":"string"},"payoutCompletedAt":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"}}}
```

## PaymentSettingsResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"serviceFeeBearer":{"type":"string"},"serviceFeePercentage":{"type":"number"},"defaultPaymentLinkExpiryHours":{"type":"integer","format":"int32"},"paymentLinksEnabled":{"type":"boolean"},"autoPayoutEnabled":{"type":"boolean"},"minimumPayoutAmount":{"type":"number"},"notifyOnPayment":{"type":"boolean"},"notifyOnPayout":{"type":"boolean"},"notificationEmail":{"type":"string"},"notificationPhone":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## PayoutTransactionResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"reference":{"type":"string"},"paymentTransactionId":{"type":"string"},"paymentTransactionReference":{"type":"string"},"bankAccountId":{"type":"string"},"bankAccountName":{"type":"string"},"bankAccountNumber":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"transferFee":{"type":"number"},"paystackTransferCode":{"type":"string"},"status":{"type":"string"},"initiatedAt":{"type":"string","format":"date-time"},"completedAt":{"type":"string","format":"date-time"},"failedAt":{"type":"string","format":"date-time"},"failureReason":{"type":"string"},"retryCount":{"type":"integer","format":"int32"},"maxRetries":{"type":"integer","format":"int32"},"nextRetryAt":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"}}}
```

## PaystackWebhookEvent
```json
{"type":"object","properties":{"paystackReference":{"type":"string"},"transferCode":{"type":"string"},"failureReason":{"type":"string"},"chargeSuccess":{"type":"boolean"},"transferSuccess":{"type":"boolean"},"transferFailed":{"type":"boolean"},"transferReversed":{"type":"boolean"},"event":{"type":"string"},"data":{"$ref":"#/components/schemas/EventData"}}}
```

## PendingApprovalSummary
```json
{"type":"object","properties":{"totalPending":{"type":"integer","format":"int64"},"pendingByType":{"type":"object","additionalProperties":{"type":"integer","format":"int64"}},"pendingPurchaseOrders":{"type":"integer","format":"int64"},"pendingGRNs":{"type":"integer","format":"int64"},"pendingStockTakes":{"type":"integer","format":"int64"}}}
```

## PendingReconciliationDto
```json
{"type":"object","properties":{"transactionId":{"type":"string"},"transactionReference":{"type":"string"},"paystackReference":{"type":"string"},"amountPaid":{"type":"number"},"currency":{"type":"string"},"serviceType":{"type":"string"},"serviceId":{"type":"string"},"paymentDate":{"type":"string","format":"date-time"},"failureReason":{"type":"string"},"customerName":{"type":"string"},"customerEmail":{"type":"string"}}}
```

## PeriodFinancialSummary
```json
{"type":"object","properties":{"periodStart":{"type":"string","format":"date"},"periodEnd":{"type":"string","format":"date"},"periodLabel":{"type":"string"},"revenue":{"type":"number"},"expenses":{"type":"number"},"profit":{"type":"number"},"cashFlow":{"type":"number"},"profitMargin":{"type":"number"},"transactionCount":{"type":"integer","format":"int64"}}}
```

## PeriodTotals
```json
{"type":"object","properties":{"totalRevenue":{"type":"number"},"averageDailyRevenue":{"type":"number"},"highestDayRevenue":{"type":"number"},"lowestDayRevenue":{"type":"number"},"totalOrders":{"type":"integer","format":"int32"},"totalItemsSold":{"type":"integer","format":"int32"}}}
```

## PlatformManualTestRequest
```json
{"type":"object","properties":{"recipientEmail":{"type":"string","minLength":1},"fullName":{"type":"string","minLength":1},"businessName":{"type":"string","minLength":1},"loginUrl":{"type":"string"},"dashboardUrl":{"type":"string"}},"required":["businessName","fullName","recipientEmail"]}
```

## ProductResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"sku":{"type":"string"},"barcode":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"brand":{"type":"string"},"manufacturer":{"type":"string"},"category":{"type":"string","enum":["FOOD_FRESH","FOOD_FROZEN","FOOD_DRY_GOODS","BEVERAGES_ALCOHOLIC","BEVERAGES_NON_ALCOHOLIC","BEVERAGES_HOT","BEVERAGES","FOOD","CLEANING_SUPPLIES","LAUNDRY_SUPPLIES","GUEST_AMENITIES","LINENS_TOWELS","MAINTENANCE_SUPPLIES","ELECTRICAL_SUPPLIES","PLUMBING_SUPPLIES","HVAC_SUPPLIES","STATIONERY","OFFICE_EQUIPMENT","PRINTING_SUPPLIES","MINIBAR_ITEMS","ROOM_SUPPLIES","WELCOME_ITEMS","KITCHEN_EQUIPMENT","TABLEWARE","DISPOSABLES","UNIFORMS","SAFETY_EQUIPMENT","MARKETING_MATERIALS","GENERAL_SUPPLIES","OTHER"]},"subcategory":{"type":"string"},"status":{"type":"string","enum":["ACTIVE","INACTIVE","DISCONTINUED","DRAFT","ARCHIVED"]},"baseUnit":{"type":"string"},"purchaseUnit":{"type":"string"},"consumptionUnit":{"type":"string"},"conversionFactor":{"type":"number","format":"double"},"standardCost":{"type":"number"},"lastPurchasePrice":{"type":"number"},"sellingPrice":{"type":"number"},"valuationMethod":{"type":"string","enum":["FIFO","LIFO","WEIGHTED_AVERAGE","STANDARD_COST","SPECIFIC_IDENTIFICATION"]},"reorderLevel":{"type":"number","format":"double"},"reorderQuantity":{"type":"number","format":"double"},"minStockLevel":{"type":"number","format":"double"},"maxStockLevel":{"type":"number","format":"double"},"safetyStock":{"type":"number","format":"double"},"leadTimeDays":{"type":"integer","format":"int32"},"trackBatches":{"type":"boolean"},"trackExpiry":{"type":"boolean"},"trackSerialNumbers":{"type":"boolean"},"perishable":{"type":"boolean"},"storageRequirements":{"type":"string"},"temperatureMin":{"type":"number","format":"double"},"temperatureMax":{"type":"number","format":"double"},"shelfLifeDays":{"type":"integer","format":"int32"},"weight":{"type":"number","format":"double"},"length":{"type":"number","format":"double"},"width":{"type":"number","format":"double"},"height":{"type":"number","format":"double"},"preferredSupplierId":{"type":"string"},"supplierPartNumber":{"type":"string"},"imageUrl":{"type":"string"},"documentUrls":{"type":"string"},"notes":{"type":"string"},"internalNotes":{"type":"string"},"tags":{"type":"string"},"taxRate":{"type":"number"},"taxCategory":{"type":"string"},"accountCode":{"type":"string"},"costCenter":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"updatedBy":{"type":"string"},"discontinuedAt":{"type":"string","format":"date-time"},"discontinuedBy":{"type":"string"},"currentStockOnHand":{"type":"number"},"currentStockAvailable":{"type":"number"},"isLowStock":{"type":"boolean"},"isOutOfStock":{"type":"boolean"}}}
```

## ProductStatisticsResponse
```json
{"type":"object","properties":{"totalProducts":{"type":"integer","format":"int64"},"activeProducts":{"type":"integer","format":"int64"},"inactiveProducts":{"type":"integer","format":"int64"},"discontinuedProducts":{"type":"integer","format":"int64"},"batchTrackedProducts":{"type":"integer","format":"int64"},"expiryTrackedProducts":{"type":"integer","format":"int64"},"serialTrackedProducts":{"type":"integer","format":"int64"},"perishableProducts":{"type":"integer","format":"int64"},"categoryBreakdown":{"type":"object","additionalProperties":{"type":"integer","format":"int64"}}}}
```

## ProductSummary
```json
{"type":"object","properties":{"productId":{"type":"string"},"sku":{"type":"string"},"name":{"type":"string"},"category":{"type":"string"},"currentStock":{"type":"number"},"reorderLevel":{"type":"number"},"locationCode":{"type":"string"},"value":{"type":"number"}}}
```

## ProductUploadResultResponse
```json
{"type":"object","properties":{"rowNumber":{"type":"integer","format":"int32"},"success":{"type":"boolean"},"sku":{"type":"string"},"errorMessage":{"type":"string"},"product":{"$ref":"#/components/schemas/ProductResponse"}}}
```

## ProfitAndLossResponse
```json
{"type":"object","properties":{"hotelId":{"type":"string"},"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"period":{"type":"string"},"grossRevenue":{"type":"number"},"refunds":{"type":"number"},"netRevenue":{"type":"number"},"roomRevenue":{"type":"number"},"foodAndBeverageRevenue":{"type":"number"},"laundryRevenue":{"type":"number"},"rentalRevenue":{"type":"number"},"otherRevenue":{"type":"number"},"costOfGoodsSold":{"type":"number"},"grossProfit":{"type":"number"},"grossProfitMargin":{"type":"number"},"staffExpenses":{"type":"number"},"utilitiesExpenses":{"type":"number"},"maintenanceExpenses":{"type":"number"},"marketingExpenses":{"type":"number"},"administrativeExpenses":{"type":"number"},"depreciationExpenses":{"type":"number"},"insuranceExpenses":{"type":"number"},"otherOperatingExpenses":{"type":"number"},"totalOperatingExpenses":{"type":"number"},"operatingProfit":{"type":"number"},"operatingProfitMargin":{"type":"number"},"interestIncome":{"type":"number"},"interestExpense":{"type":"number"},"otherIncome":{"type":"number"},"otherExpenses":{"type":"number"},"netNonOperatingItems":{"type":"number"},"profitBeforeTax":{"type":"number"},"taxExpense":{"type":"number"},"netProfit":{"type":"number"},"netProfitMargin":{"type":"number"},"netProfitGrowthPercentage":{"type":"number"},"netProfitGrowthAmount":{"type":"number"},"revenuePerAvailableRoom":{"type":"number"},"expenseToRevenueRatio":{"type":"number"}}}
```

## PurchaseOrderItemRequest
```json
{"type":"object","properties":{"productId":{"type":"string","minLength":1},"productDescription":{"type":"string","maxLength":500,"minLength":0},"quantityOrdered":{"type":"number","minimum":0.0},"unit":{"type":"string","minLength":1},"unitPrice":{"type":"number","minimum":0.0},"discountPercent":{"type":"number","maximum":100.0,"minimum":0.0},"taxRate":{"type":"number","maximum":100.0,"minimum":0.0},"expectedDeliveryDate":{"type":"string"},"notes":{"type":"string","maxLength":1000,"minLength":0},"specifications":{"type":"string","maxLength":500,"minLength":0}},"required":["productId","quantityOrdered","unit","unitPrice"]}
```

## PurchaseOrderItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"lineNumber":{"type":"integer","format":"int32"},"productId":{"type":"string"},"productSku":{"type":"string"},"productName":{"type":"string"},"productDescription":{"type":"string"},"quantityOrdered":{"type":"number"},"quantityReceived":{"type":"number"},"quantityPending":{"type":"number"},"quantityRejected":{"type":"number"},"unit":{"type":"string"},"unitPrice":{"type":"number"},"discountPercent":{"type":"number"},"discountAmount":{"type":"number"},"lineTotal":{"type":"number"},"taxRate":{"type":"number"},"taxAmount":{"type":"number"},"expectedDeliveryDate":{"type":"string"},"notes":{"type":"string"},"specifications":{"type":"string"},"fullyReceived":{"type":"boolean"},"cancelled":{"type":"boolean"},"cancellationReason":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## PurchaseOrderResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"poNumber":{"type":"string"},"status":{"type":"string","enum":["DRAFT","PENDING_APPROVAL","APPROVED","REJECTED","SENT_TO_SUPPLIER","PARTIALLY_RECEIVED","FULLY_RECEIVED","CANCELLED","CLOSED"]},"supplierId":{"type":"string"},"supplierName":{"type":"string"},"supplierContactPerson":{"type":"string"},"supplierContactPhone":{"type":"string"},"supplierContactEmail":{"type":"string"},"deliveryLocationId":{"type":"string"},"deliveryLocationName":{"type":"string"},"deliveryAddress":{"type":"string"},"orderDate":{"type":"string","format":"date"},"expectedDeliveryDate":{"type":"string","format":"date"},"approvalDate":{"type":"string","format":"date"},"sentToSupplierDate":{"type":"string","format":"date"},"subtotal":{"type":"number"},"taxAmount":{"type":"number"},"taxRate":{"type":"number"},"shippingCost":{"type":"number"},"otherCharges":{"type":"number"},"discountAmount":{"type":"number"},"discountPercent":{"type":"number"},"totalAmount":{"type":"number"},"currency":{"type":"string"},"exchangeRate":{"type":"number","format":"double"},"items":{"type":"array","items":{"$ref":"#/components/schemas/PurchaseOrderItemResponse"}},"paymentTerms":{"type":"string"},"paymentDueDays":{"type":"integer","format":"int32"},"paymentMethod":{"type":"string"},"requestedBy":{"type":"string"},"approvedBy":{"type":"string"},"rejectedBy":{"type":"string"},"rejectedAt":{"type":"string","format":"date-time"},"rejectionReason":{"type":"string"},"totalQuantityOrdered":{"type":"number"},"totalQuantityReceived":{"type":"number"},"totalQuantityPending":{"type":"number"},"notes":{"type":"string"},"termsAndConditions":{"type":"string"},"deliveryInstructions":{"type":"string"},"internalNotes":{"type":"string"},"attachmentUrls":{"type":"string"},"requisitionNumber":{"type":"string"},"quotationNumber":{"type":"string"},"cancelled":{"type":"boolean"},"cancelledAt":{"type":"string","format":"date-time"},"cancelledBy":{"type":"string"},"cancellationReason":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"updatedBy":{"type":"string"}}}
```

## PurchaseOrderStatisticsResponse
```json
{"type":"object","properties":{"totalPurchaseOrders":{"type":"integer","format":"int64"},"pendingApproval":{"type":"integer","format":"int64"},"approved":{"type":"integer","format":"int64"},"sentToSupplier":{"type":"integer","format":"int64"},"partiallyReceived":{"type":"integer","format":"int64"},"received":{"type":"integer","format":"int64"},"cancelled":{"type":"integer","format":"int64"},"totalValue":{"type":"number"},"pendingValue":{"type":"number"},"overduePurchaseOrders":{"type":"integer","format":"int64"},"statusBreakdown":{"type":"object","additionalProperties":{"type":"integer","format":"int64"}}}}
```

## RecentActivity
```json
{"type":"object","properties":{"activityType":{"type":"string"},"referenceNumber":{"type":"string"},"description":{"type":"string"},"activityDate":{"type":"string","format":"date-time"},"performedBy":{"type":"string"}}}
```

## ReconciliationStatsDto
```json
{"type":"object","properties":{"totalTransactions":{"type":"integer","format":"int64"},"pendingReconciliations":{"type":"integer","format":"int64"},"successfulAutoPayments":{"type":"integer","format":"int64"},"autoPaymentSuccessRate":{"type":"number","format":"double"}}}
```

## RecordBookingPaymentRequest
```json
{"type":"object","properties":{"amount":{"type":"number"},"currency":{"type":"string"},"method":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"reference":{"type":"string"},"status":{"type":"string","enum":["SUCCESS","FAILED","PENDING","CANCELLED","REFUNDED","PARTLY_PAID","FULLY_PAID"]},"type":{"type":"string","enum":["DEPOSIT","INSTALLMENT","FINAL","REFUND","OTHER"]},"paymentDate":{"type":"string","format":"date-time"}}}
```

## RecordInspectionRequest
```json
{"type":"object","properties":{"inspectionType":{"type":"string","enum":["PICKUP","RETURN"]},"notes":{"type":"string"},"items":{"type":"array","items":{"$ref":"#/components/schemas/ItemInspection"}}},"required":["inspectionType"]}
```

## RecordKitchenPaymentRequest
```json
{"type":"object","properties":{"amount":{"type":"number"},"method":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"reference":{"type":"string"},"status":{"type":"string","enum":["SUCCESS","FAILED","PENDING","CANCELLED","REFUNDED","PARTLY_PAID","FULLY_PAID"]},"paymentDate":{"type":"string","format":"date-time"},"notes":{"type":"string"}},"required":["amount","method"]}
```

## RecordStockCountRequest
```json
{"type":"object","properties":{"actualQuantity":{"type":"number","minimum":0.0},"conditionNotes":{"type":"string","maxLength":500,"minLength":0},"damagedItemsFound":{"type":"boolean"},"expiredItemsFound":{"type":"boolean"},"storageLocationObserved":{"type":"string","maxLength":500,"minLength":0},"notes":{"type":"string","maxLength":1000,"minLength":0}},"required":["actualQuantity"]}
```

## RefreshTokenRequest
```json
{"type":"object","properties":{"refreshToken":{"type":"string","minLength":1}},"required":["refreshToken"]}
```

## RegisterTerminalRequest
```json
{"type":"object","properties":{"hotelId":{"type":"string","minLength":1},"terminalId":{"type":"string","minLength":1},"terminalName":{"type":"string"},"serialNumber":{"type":"string"}},"required":["hotelId","terminalId"]}
```

## RentalAvailabilityResponse
```json
{"type":"object","properties":{"itemId":{"type":"string"},"itemName":{"type":"string"},"category":{"type":"string"},"totalQuantity":{"type":"integer","format":"int32"},"currentlyAvailable":{"type":"integer","format":"int32"},"reservedForPeriod":{"type":"integer","format":"int32"},"availableForPeriod":{"type":"integer","format":"int32"},"requestedStartTime":{"type":"string","format":"date-time"},"requestedEndTime":{"type":"string","format":"date-time"},"requestedQuantity":{"type":"integer","format":"int32"},"isAvailable":{"type":"boolean"},"availabilityMessage":{"type":"string"},"estimatedUnitPrice":{"type":"number"},"estimatedTotalPrice":{"type":"number"},"depositPerUnit":{"type":"number"},"totalDeposit":{"type":"number"},"grandTotal":{"type":"number"}}}
```

## RentalCustomerLogResponse
```json
{"type":"object","properties":{"customerName":{"type":"string"},"customerPhone":{"type":"string"},"customerEmail":{"type":"string"},"totalRentals":{"type":"integer","format":"int64"},"activeRentals":{"type":"integer","format":"int64"},"completedRentals":{"type":"integer","format":"int64"},"totalSpent":{"type":"number"},"outstandingBalance":{"type":"number"},"lastRentalOrderNumber":{"type":"string"},"lastRentalDate":{"type":"string","format":"date-time"},"firstRentalDate":{"type":"string","format":"date-time"}}}
```

## RentalDashboardStatsResponse
```json
{"type":"object","properties":{"totalActiveItems":{"type":"integer","format":"int64"},"totalOrders":{"type":"integer","format":"int64"},"activeRentals":{"type":"integer","format":"int64"},"overdueRentals":{"type":"integer","format":"int64"},"completedRentals":{"type":"integer","format":"int64"},"totalRevenue":{"type":"number"},"outstandingAmount":{"type":"number"},"ordersToday":{"type":"integer","format":"int64"},"revenueToday":{"type":"number"},"totalItemsRentedOut":{"type":"integer","format":"int64"}}}
```

## RentalItemMiniResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"category":{"type":"string","enum":["BICYCLES","BEACH_EQUIPMENT","SPORTS_EQUIPMENT","BABY_EQUIPMENT","CONFERENCE_EQUIPMENT","ENTERTAINMENT","MOBILITY_AIDS","WATER_SPORTS","WINTER_SPORTS","ELECTRONICS","VEHICLES","PARTY_SUPPLIES","CAMPING_GEAR","KITCHEN_APPLIANCES","OTHERS"]},"availableQuantity":{"type":"integer","format":"int32"},"dailyRate":{"type":"number"},"depositAmount":{"type":"number"}}}
```

## RentalItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"category":{"type":"string","enum":["BICYCLES","BEACH_EQUIPMENT","SPORTS_EQUIPMENT","BABY_EQUIPMENT","CONFERENCE_EQUIPMENT","ENTERTAINMENT","MOBILITY_AIDS","WATER_SPORTS","WINTER_SPORTS","ELECTRONICS","VEHICLES","PARTY_SUPPLIES","CAMPING_GEAR","KITCHEN_APPLIANCES","OTHERS"]},"brand":{"type":"string"},"model":{"type":"string"},"serialNumber":{"type":"string"},"totalQuantity":{"type":"integer","format":"int32"},"availableQuantity":{"type":"integer","format":"int32"},"rentedQuantity":{"type":"integer","format":"int32"},"maintenanceQuantity":{"type":"integer","format":"int32"},"condition":{"type":"string","enum":["EXCELLENT","GOOD","FAIR","POOR","DAMAGED","OUT_OF_SERVICE"]},"pricingType":{"type":"string","enum":["HOURLY","DAILY","WEEKLY","MONTHLY","FLAT_RATE"]},"hourlyRate":{"type":"number"},"dailyRate":{"type":"number"},"weeklyRate":{"type":"number"},"monthlyRate":{"type":"number"},"flatRate":{"type":"number"},"depositAmount":{"type":"number"},"replacementValue":{"type":"number"},"lateReturnPenaltyPerHour":{"type":"number"},"lateReturnPenaltyPerDay":{"type":"number"},"size":{"type":"string"},"color":{"type":"string"},"specifications":{"type":"string"},"active":{"type":"boolean"},"requiresDeposit":{"type":"boolean"},"requiresIdentification":{"type":"boolean"},"requiresSignedAgreement":{"type":"boolean"},"minimumAge":{"type":"integer","format":"int32"},"usageInstructions":{"type":"string"},"safetyInstructions":{"type":"string"},"maintenanceNotes":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## RentalMaintenanceLogResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"rentalItemId":{"type":"string"},"rentalItemName":{"type":"string"},"type":{"type":"string","enum":["SENT_TO_MAINTENANCE","RETURNED_FROM_MAINTENANCE","WRITE_OFF","CONDITION_UPDATE"]},"quantity":{"type":"integer","format":"int32"},"reason":{"type":"string"},"notes":{"type":"string"},"performedBy":{"type":"string"},"expectedCompletionDate":{"type":"string","format":"date-time"},"actualCompletionDate":{"type":"string","format":"date-time"},"availableQuantityBefore":{"type":"integer","format":"int32"},"maintenanceQuantityBefore":{"type":"integer","format":"int32"},"availableQuantityAfter":{"type":"integer","format":"int32"},"maintenanceQuantityAfter":{"type":"integer","format":"int32"},"createdAt":{"type":"string","format":"date-time"}}}
```

## RentalOrderItemRequest
```json
{"type":"object","properties":{"rentalItemId":{"type":"string","minLength":1},"quantity":{"type":"integer","format":"int32","minimum":1},"serialNumber":{"type":"string"},"specialInstructions":{"type":"string"}},"required":["quantity","rentalItemId"]}
```

## RentalOrderItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"rentalItemId":{"type":"string"},"rentalItemName":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"serialNumber":{"type":"string"},"assignedUnitIdentifier":{"type":"string"},"unitRentalPrice":{"type":"number"},"totalRentalPrice":{"type":"number"},"unitDeposit":{"type":"number"},"totalDeposit":{"type":"number"},"conditionAtPickup":{"type":"string","enum":["EXCELLENT","GOOD","FAIR","POOR","DAMAGED","OUT_OF_SERVICE"]},"conditionAtReturn":{"type":"string","enum":["EXCELLENT","GOOD","FAIR","POOR","DAMAGED","OUT_OF_SERVICE"]},"pickupInspectionNotes":{"type":"string"},"returnInspectionNotes":{"type":"string"},"damaged":{"type":"boolean"},"lost":{"type":"boolean"},"damageDescription":{"type":"string"},"damageCharge":{"type":"number"},"replacementCharge":{"type":"number"},"itemPickedUpAt":{"type":"string","format":"date-time"},"itemReturnedAt":{"type":"string","format":"date-time"},"returnedLate":{"type":"boolean"},"lateReturnHours":{"type":"integer","format":"int64"},"lateReturnCharge":{"type":"number"},"specialInstructions":{"type":"string"},"customerComments":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## RentalOrderResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"orderNumber":{"type":"string"},"hotelId":{"type":"string"},"bookingId":{"type":"string"},"customerName":{"type":"string"},"customerPhone":{"type":"string"},"customerEmail":{"type":"string"},"organizationId":{"type":"string"},"organizationName":{"type":"string"},"identificationNumber":{"type":"string"},"identificationType":{"type":"string"},"status":{"type":"string","enum":["PENDING","CONFIRMED","PICKED_UP","ACTIVE","OVERDUE","RETURNED","COMPLETED","CANCELLED","LOST","DAMAGED"]},"paymentStatus":{"type":"string","enum":["UNPAID","DEPOSIT_PARTIALLY_PAID","DEPOSIT_PAID","PARTIALLY_PAID","PAID","PARTIALLY_REFUNDED","FULLY_REFUNDED","CHARGED_TO_ROOM","PENDING_DAMAGE_ASSESSMENT","OVERDUE_CHARGES_PENDING"]},"items":{"type":"array","items":{"$ref":"#/components/schemas/RentalOrderItemResponse"}},"totalItemsCount":{"type":"integer","format":"int32"},"rentalStartTime":{"type":"string","format":"date-time"},"rentalEndTime":{"type":"string","format":"date-time"},"actualPickupTime":{"type":"string","format":"date-time"},"actualReturnTime":{"type":"string","format":"date-time"},"totalRentalDurationHours":{"type":"integer","format":"int64"},"isOverdue":{"type":"boolean"},"rentalSubtotal":{"type":"number"},"totalDeposit":{"type":"number"},"lateReturnPenalty":{"type":"number"},"damageFee":{"type":"number"},"discount":{"type":"number"},"tax":{"type":"number"},"totalAmount":{"type":"number"},"amountPaid":{"type":"number"},"balanceDue":{"type":"number"},"depositPaid":{"type":"number"},"depositRefunded":{"type":"number"},"depositBalance":{"type":"number"},"payments":{"type":"array","items":{"$ref":"#/components/schemas/RentalPaymentResponse"}},"paymentCount":{"type":"integer","format":"int32"},"inspectionCompleted":{"type":"boolean"},"inspectionTime":{"type":"string","format":"date-time"},"inspectionNotes":{"type":"string"},"inspectedBy":{"type":"string"},"agreementSigned":{"type":"boolean"},"agreementSignedBy":{"type":"string"},"agreementSignedAt":{"type":"string","format":"date-time"},"agreementDocumentUrl":{"type":"string"},"specialInstructions":{"type":"string"},"customerNotes":{"type":"string"},"internalNotes":{"type":"string"},"pickedUpBy":{"type":"string"},"returnedTo":{"type":"string"},"processedBy":{"type":"string"},"hasIssues":{"type":"boolean"},"issuesDescription":{"type":"string"},"itemsLost":{"type":"boolean"},"itemsDamaged":{"type":"boolean"},"damageDescription":{"type":"string"},"chargeOverduePenalty":{"type":"boolean"},"sendOverdueNotice":{"type":"boolean"},"sendReminders":{"type":"boolean"},"requireDeposit":{"type":"boolean"},"requireAgreement":{"type":"boolean"},"extended":{"type":"boolean"},"extensionCount":{"type":"integer","format":"int32"},"originalEndTime":{"type":"string","format":"date-time"},"cancellationReason":{"type":"string"},"cancelledAt":{"type":"string","format":"date-time"},"cancelledBy":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## RentalOrderSummaryResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"orderNumber":{"type":"string"},"customerName":{"type":"string"},"status":{"type":"string","enum":["PENDING","CONFIRMED","PICKED_UP","ACTIVE","OVERDUE","RETURNED","COMPLETED","CANCELLED","LOST","DAMAGED"]},"paymentStatus":{"type":"string","enum":["UNPAID","DEPOSIT_PARTIALLY_PAID","DEPOSIT_PAID","PARTIALLY_PAID","PAID","PARTIALLY_REFUNDED","FULLY_REFUNDED","CHARGED_TO_ROOM","PENDING_DAMAGE_ASSESSMENT","OVERDUE_CHARGES_PENDING"]},"totalItemsCount":{"type":"integer","format":"int32"},"totalAmount":{"type":"number"},"amountPaid":{"type":"number"},"balanceDue":{"type":"number"},"depositPaid":{"type":"number"},"rentalStartTime":{"type":"string","format":"date-time"},"rentalEndTime":{"type":"string","format":"date-time"},"isOverdue":{"type":"boolean"},"createdAt":{"type":"string","format":"date-time"},"hasIssues":{"type":"boolean"}}}
```

## RentalPaymentHistoryResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"orderId":{"type":"string"},"orderNumber":{"type":"string"},"customerName":{"type":"string"},"customerPhone":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"method":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"reference":{"type":"string"},"status":{"type":"string","enum":["SUCCESS","FAILED","PENDING","CANCELLED","REFUNDED","PARTLY_PAID","FULLY_PAID"]},"type":{"type":"string","enum":["DEPOSIT","INSTALLMENT","RENTAL_FEE","FULL_PAYMENT","FINAL","DAMAGE_FEE","LATE_PENALTY","EXTENSION_FEE","DEPOSIT_REFUND","REFUND","OTHER"]},"paymentDate":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"},"notes":{"type":"string"},"processedBy":{"type":"string"},"orderTotal":{"type":"number"},"totalPaid":{"type":"number"},"remainingBalance":{"type":"number"}}}
```

## RentalPaymentResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"rentalOrderId":{"type":"string"},"orderNumber":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"method":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"reference":{"type":"string"},"status":{"type":"string","enum":["SUCCESS","FAILED","PENDING","CANCELLED","REFUNDED","PARTLY_PAID","FULLY_PAID"]},"type":{"type":"string","enum":["DEPOSIT","INSTALLMENT","RENTAL_FEE","FULL_PAYMENT","FINAL","DAMAGE_FEE","LATE_PENALTY","EXTENSION_FEE","DEPOSIT_REFUND","REFUND","OTHER"]},"paymentDate":{"type":"string","format":"date-time"},"notes":{"type":"string"},"processedBy":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"}}}
```

## RentalReportResponse
```json
{"type":"object","properties":{"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"totalOrders":{"type":"integer","format":"int64"},"completedOrders":{"type":"integer","format":"int64"},"cancelledOrders":{"type":"integer","format":"int64"},"activeOrders":{"type":"integer","format":"int64"},"overdueOrders":{"type":"integer","format":"int64"},"totalRevenue":{"type":"number"},"totalCollected":{"type":"number"},"totalOutstanding":{"type":"number"},"totalDepositsCollected":{"type":"number"},"totalDepositsRefunded":{"type":"number"},"totalDamageFees":{"type":"number"},"totalLatePenalties":{"type":"number"},"totalItemsRented":{"type":"integer","format":"int64"},"totalQuantityRented":{"type":"integer","format":"int64"},"topItemsByRevenue":{"type":"array","items":{"$ref":"#/components/schemas/ItemUtilization"}},"topItemsByQuantity":{"type":"array","items":{"$ref":"#/components/schemas/ItemUtilization"}},"categoryBreakdown":{"type":"array","items":{"$ref":"#/components/schemas/CategoryStats"}},"dailyStats":{"type":"array","items":{"$ref":"#/components/schemas/DailyStats"}},"damagedItemsCount":{"type":"integer","format":"int64"},"lostItemsCount":{"type":"integer","format":"int64"}}}
```

## ReplyToMessageSummary
```json
{"type":"object","properties":{"id":{"type":"string"},"senderId":{"type":"string"},"senderName":{"type":"string"},"content":{"type":"string"},"messageType":{"type":"string"}}}
```

## ReportSummary
```json
{"type":"object","properties":{"totalUniqueItems":{"type":"integer","format":"int32"},"totalFoodItems":{"type":"integer","format":"int32"},"totalDrinkItems":{"type":"integer","format":"int32"},"totalQuantityConsumed":{"type":"integer","format":"int32"},"totalRevenue":{"type":"number"},"totalOrders":{"type":"integer","format":"int32"},"topSellingItemByQuantity":{"type":"string"},"topSellingItemQuantity":{"type":"integer","format":"int32"},"topSellingItemByRevenue":{"type":"string"},"topSellingItemRevenue":{"type":"number"},"foodRevenue":{"type":"number"},"drinkRevenue":{"type":"number"},"foodPercentage":{"type":"number"},"drinkPercentage":{"type":"number"}}}
```

## RequisitionItemApproval
```json
{"type":"object","properties":{"itemId":{"type":"string"},"quantityApproved":{"type":"number"},"notes":{"type":"string"}}}
```

## RequisitionItemRequest
```json
{"type":"object","properties":{"productId":{"type":"string","minLength":1},"quantityRequested":{"type":"number","minimum":0.001},"unit":{"type":"string"},"notes":{"type":"string","maxLength":500,"minLength":0}},"required":["productId","quantityRequested"]}
```

## RequisitionItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"lineNumber":{"type":"integer","format":"int32"},"productId":{"type":"string"},"productName":{"type":"string"},"productSku":{"type":"string"},"unit":{"type":"string"},"quantityRequested":{"type":"number"},"quantityApproved":{"type":"number"},"quantityReserved":{"type":"number"},"quantityIssued":{"type":"number"},"remainingQuantity":{"type":"number"},"unitCost":{"type":"number"},"lineTotalCost":{"type":"number"},"batchId":{"type":"string"},"batchNumber":{"type":"string"},"requestNotes":{"type":"string"},"approvalNotes":{"type":"string"},"issueNotes":{"type":"string"},"reservedAt":{"type":"string","format":"date-time"},"issuedAt":{"type":"string","format":"date-time"},"issuedBy":{"type":"string"},"fullyIssued":{"type":"boolean"}}}
```

## ReservationPeriod
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"checkOutDate":{"type":"string","format":"date-time"},"guestName":{"type":"string"},"bookingStatus":{"type":"string"}}}
```

## ReservationRequest
```json
{"type":"object","properties":{"guestName":{"type":"string","minLength":1},"guestEmail":{"type":"string"},"phoneNumber":{"type":"string","minLength":1},"nightlyRate":{"type":"number"},"dailySpendingCap":{"type":"number"},"checkInDate":{"type":"string","minLength":1},"checkOutDate":{"type":"string"},"notes":{"type":"string"},"discountValue":{"type":"number"},"discountType":{"type":"string","enum":["PERCENTAGE","FIXED"]},"initialPayment":{"$ref":"#/components/schemas/RecordBookingPaymentRequest"}},"required":["checkInDate","guestName","phoneNumber"]}
```

## ReservationResponse
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"guestName":{"type":"string"},"phoneNumber":{"type":"string"},"roomIdentifier":{"type":"string"},"roomType":{"type":"string"},"branchName":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"checkOutDate":{"type":"string","format":"date-time"},"status":{"type":"string","enum":["CHECKED_IN","CHECKED_OUT","RESERVED","CANCELLED","AVAILABLE"]},"discountValue":{"type":"number"},"discountType":{"type":"string","enum":["PERCENTAGE","FIXED"]},"nightlyRate":{"type":"number"},"effectiveNightlyRate":{"type":"number"},"initialPayment":{"$ref":"#/components/schemas/BookingPaymentResponse"}}}
```

## RestaurantDailySummary
```json
{"type":"object","properties":{"date":{"type":"string","format":"date"},"totalsByDestination":{"type":"array","items":{"$ref":"#/components/schemas/LocationAmount"}},"dayTotal":{"type":"number"}}}
```

## RestaurantDetailedReport
```json
{"type":"object","properties":{"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"},"totalKitchenSales":{"type":"number"},"totalBarSales":{"type":"number"},"totalRevenue":{"type":"number"},"totalOrders":{"type":"integer","format":"int32"},"totalItemsSold":{"type":"integer","format":"int32"},"salesByDestination":{"type":"array","items":{"$ref":"#/components/schemas/LocationAmount"}},"dailySummary":{"type":"array","items":{"$ref":"#/components/schemas/RestaurantDailySummary"}},"topKitchenItems":{"type":"array","items":{"$ref":"#/components/schemas/ItemPerformance"}},"topBarItems":{"type":"array","items":{"$ref":"#/components/schemas/ItemPerformance"}},"salesByTimeOfDay":{"type":"array","items":{"$ref":"#/components/schemas/TimeSlotAmount"}}}}
```

## RestaurantFoodItemRequest
```json
{"type":"object","properties":{"name":{"type":"string","minLength":1},"price":{"type":"number","minimum":0.0},"productId":{"type":"string"},"portionSize":{"type":"number","minimum":0.001},"notes":{"type":"string"}},"required":["name","price"]}
```

## RestaurantFoodItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"name":{"type":"string"},"price":{"type":"number"}}}
```

## RestaurantItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"name":{"type":"string"},"price":{"type":"number"},"itemType":{"type":"string","enum":["DRINK","FOOD"]},"quantity":{"type":"integer","format":"int32"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## RestaurantItemSalesDetail
```json
{"type":"object","properties":{"saleId":{"type":"string"},"saleTime":{"type":"string","format":"date-time"},"itemName":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"unitPrice":{"type":"number"},"totalAmount":{"type":"number"},"destination":{"type":"string"},"bookingId":{"type":"string"},"roomIdentifier":{"type":"string"},"guestName":{"type":"string"},"organizationName":{"type":"string"}}}
```

## RestaurantItemStatisticsResponse
```json
{"type":"object","properties":{"totalItems":{"type":"integer","format":"int64"},"totalFoodItems":{"type":"integer","format":"int64"},"totalDrinkItems":{"type":"integer","format":"int64"},"availableDrinks":{"type":"integer","format":"int64"},"lowInStockDrinks":{"type":"integer","format":"int64"},"outOfStockDrinks":{"type":"integer","format":"int64"}}}
```

## RestaurantOrderRequest
```json
{"type":"object","properties":{"destinationId":{"type":"string","minLength":1},"orderItems":{"type":"array","items":{"$ref":"#/components/schemas/OrderItemRequest"},"minItems":1},"bookingId":{"type":"string"},"note":{"type":"string"},"isPaid":{"type":"boolean"},"paymentMethod":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"paymentReference":{"type":"string"}},"required":["destinationId","orderItems"]}
```

## RestaurantStockRequest
```json
{"type":"object","properties":{"name":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"unit":{"type":"string"},"note":{"type":"string"},"department":{"type":"string","enum":["BAR","KITCHEN","RESTAURANT","OTHER"]},"dateTimeReceived":{"type":"string","format":"date-time"}}}
```

## RestaurantStockResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"name":{"type":"string"},"unit":{"type":"string"},"department":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"dateTimeReceived":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"}}}
```

## RevenueSourceBreakdown
```json
{"type":"object","properties":{"source":{"type":"string"},"amount":{"type":"number"},"percentage":{"type":"number"},"transactionCount":{"type":"integer","format":"int64"},"averageTransactionValue":{"type":"number"},"paidAmount":{"type":"number"},"pendingAmount":{"type":"number"},"refundedAmount":{"type":"number"}}}
```

## ReverseStockMovementRequest
```json
{"type":"object","properties":{"reversalReason":{"type":"string","maxLength":500,"minLength":5}},"required":["reversalReason"]}
```

## RoomByTypeResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"roomIdentifier":{"type":"string"},"roomType":{"type":"string"},"roomPrice":{"type":"number"},"status":{"type":"string"},"facilities":{"type":"array","items":{"type":"string"}},"reservationPeriods":{"type":"array","items":{"$ref":"#/components/schemas/ReservationPeriod"}}}}
```

## RoomFoodSalesBookingBreakdown
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"roomIdentifier":{"type":"string"},"guestName":{"type":"string"},"guestPhoneNumber":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"checkOutDate":{"type":"string","format":"date-time"},"numberOfAdults":{"type":"integer","format":"int32"},"numberOfChildren":{"type":"integer","format":"int32"},"daily":{"type":"array","items":{"$ref":"#/components/schemas/RoomFoodSalesDayBreakdown"}},"totalAmount":{"type":"number"}}}
```

## RoomFoodSalesDayBreakdown
```json
{"type":"object","properties":{"date":{"type":"string","format":"date"},"totalAmount":{"type":"number"}}}
```

## RoomGuestDetailsResponse
```json
{"type":"object","properties":{"bookingId":{"type":"string"},"customId":{"type":"string"},"guestName":{"type":"string"},"title":{"type":"string"},"phoneNumber":{"type":"string"},"noOfAdults":{"type":"integer","format":"int32"},"noOfChildren":{"type":"integer","format":"int32"},"roomIdentifier":{"type":"string"},"roomType":{"type":"string"},"bookingStatus":{"type":"string"},"checkInDate":{"type":"string","format":"date-time"},"checkOutDate":{"type":"string","format":"date-time"},"nightlyRate":{"type":"number"},"amountPaid":{"type":"number"},"amountDue":{"type":"number"},"amountRemaining":{"type":"number"},"isCurrentGuest":{"type":"boolean"},"organizationName":{"type":"string"}}}
```

## RoomResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"hotelName":{"type":"string"},"roomIdentifier":{"type":"string"},"roomType":{"type":"string"},"roomPrice":{"type":"number"},"checkInStatus":{"type":"string"},"roomFacility":{"type":"array","items":{"type":"string"}},"guestDetails":{"$ref":"#/components/schemas/RoomGuestDetailsResponse"}}}
```

## RoomTypeRequest
```json
{"type":"object","properties":{"name":{"type":"string","minLength":1},"description":{"type":"string"},"basePrice":{"type":"number"}},"required":["name"]}
```

## RoomTypeResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"basePrice":{"type":"number"},"createdAt":{"type":"string","format":"date-time"}}}
```

## RoomUploadResultResponse
```json
{"type":"object","properties":{"rowNumber":{"type":"integer","format":"int32"},"success":{"type":"boolean"},"roomIdentifier":{"type":"string"},"errorMessage":{"type":"string"},"room":{"$ref":"#/components/schemas/RoomResponse"}}}
```

## SaleItemDetail
```json
{"type":"object","properties":{"itemName":{"type":"string"},"quantity":{"type":"integer","format":"int32"},"unitPrice":{"type":"number"},"total":{"type":"number"},"saleType":{"type":"string"},"saleTime":{"type":"string","format":"date-time"}}}
```

## SendPaymentRequest
```json
{"type":"object","properties":{"hotelId":{"type":"string","minLength":1},"serviceType":{"type":"string","enum":["GENERAL","BOOKING","LAUNDRY","RENTAL","KITCHEN"]},"serviceId":{"type":"string","minLength":1},"amount":{"type":"number","minimum":100.00},"currency":{"type":"string"},"description":{"type":"string"},"customerName":{"type":"string"},"customerPhone":{"type":"string"},"customerEmail":{"type":"string"},"sendVia":{"type":"string"},"createdBy":{"type":"string"}},"required":["amount","hotelId","serviceId","serviceType"]}
```

## SendPaymentResponse
```json
{"type":"object","properties":{"paymentLinkId":{"type":"string"},"reference":{"type":"string"},"virtualAccountNumber":{"type":"string"},"virtualAccountBank":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"virtualAccountExpiry":{"type":"string","format":"date-time"},"cardPaymentUrl":{"type":"string"},"authorizationUrl":{"type":"string"},"sentVia":{"type":"string"},"message":{"type":"string"}}}
```

## ServicePaymentResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"serviceId":{"type":"string"},"serviceType":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"method":{"type":"string","enum":["CASH","CARD","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","MOBILE_MONEY","CHEQUE","ONLINE_PAYMENT","PAYPAL","CRYPTOCURRENCY","DIRECT_DEBIT","PETTY_CASH","OTHERS"]},"reference":{"type":"string"},"status":{"type":"string","enum":["SUCCESS","FAILED","PENDING","CANCELLED","REFUNDED","PARTLY_PAID","FULLY_PAID"]},"type":{"type":"string"},"paymentDate":{"type":"string","format":"date-time"},"paymentSource":{"type":"string","enum":["MANUAL","PAYMENT_LINK","API","IMPORT"]},"paymentLinkId":{"type":"string"},"notes":{"type":"string"},"processedBy":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"totalAmount":{"type":"number"},"totalPaid":{"type":"number"},"remainingBalance":{"type":"number"}}}
```

## SetNewPasswordRequest
```json
{"type":"object","properties":{"resetToken":{"type":"string"},"newPassword":{"type":"string"},"confirmPassword":{"type":"string"}}}
```

## SimpleProductResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"sku":{"type":"string"},"name":{"type":"string"},"category":{"type":"string","enum":["FOOD_FRESH","FOOD_FROZEN","FOOD_DRY_GOODS","BEVERAGES_ALCOHOLIC","BEVERAGES_NON_ALCOHOLIC","BEVERAGES_HOT","BEVERAGES","FOOD","CLEANING_SUPPLIES","LAUNDRY_SUPPLIES","GUEST_AMENITIES","LINENS_TOWELS","MAINTENANCE_SUPPLIES","ELECTRICAL_SUPPLIES","PLUMBING_SUPPLIES","HVAC_SUPPLIES","STATIONERY","OFFICE_EQUIPMENT","PRINTING_SUPPLIES","MINIBAR_ITEMS","ROOM_SUPPLIES","WELCOME_ITEMS","KITCHEN_EQUIPMENT","TABLEWARE","DISPOSABLES","UNIFORMS","SAFETY_EQUIPMENT","MARKETING_MATERIALS","GENERAL_SUPPLIES","OTHER"]}}}
```

## SimplePurchaseOrderResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"poNumber":{"type":"string"},"supplierName":{"type":"string"},"status":{"type":"string","enum":["DRAFT","PENDING_APPROVAL","APPROVED","REJECTED","SENT_TO_SUPPLIER","PARTIALLY_RECEIVED","FULLY_RECEIVED","CANCELLED","CLOSED"]},"orderDate":{"type":"string","format":"date"},"expectedDeliveryDate":{"type":"string","format":"date"}}}
```

## SimpleStorageLocationResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"locationCode":{"type":"string"},"locationName":{"type":"string"},"locationType":{"type":"string","enum":["MAIN_WAREHOUSE","KITCHEN_STORE","BAR_STORE","HOUSEKEEPING_STORE","MAINTENANCE_STORE","OFFICE_STORE","COLD_STORAGE","FREEZER","DRY_STORE","CELLAR","EXTERNAL_WAREHOUSE","MOBILE_STORAGE","OTHER"]}}}
```

## SimpleSupplierResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"email":{"type":"string"},"phone":{"type":"string"}}}
```

## SortObject
```json
{"type":"object","properties":{"sorted":{"type":"boolean"},"empty":{"type":"boolean"},"unsorted":{"type":"boolean"}}}
```

## StaffBreakdown
```json
{"type":"object","properties":{"staffName":{"type":"string"},"bookingId":{"type":"string"},"roomCharges":{"type":"number"},"restaurantCharges":{"type":"number"},"barCharges":{"type":"number"},"manualCharges":{"type":"number"},"total":{"type":"number"}}}
```

## StaffResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"fullName":{"type":"string"},"email":{"type":"string"},"phoneNumber":{"type":"string"},"roles":{"type":"array","items":{"type":"string"}},"lastLogin":{"type":"string"},"createdAt":{"type":"string","format":"date-time"}}}
```

## StockAdjustmentResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"adjustmentNumber":{"type":"string"},"productId":{"type":"string"},"productSku":{"type":"string"},"productName":{"type":"string"},"locationId":{"type":"string"},"locationCode":{"type":"string"},"locationName":{"type":"string"},"batchId":{"type":"string"},"batchNumber":{"type":"string"},"adjustmentDate":{"type":"string","format":"date-time"},"reason":{"type":"string","enum":["DAMAGED","EXPIRED","STOLEN","LOST","QUALITY_ISSUE","STOCK_COUNT_VARIANCE","SPILLAGE","BREAKAGE","OBSOLETE","DATA_ENTRY_ERROR","RETURNED_TO_SUPPLIER","FOUND","OTHER"]},"adjustmentType":{"type":"string"},"quantityBefore":{"type":"number"},"adjustmentQuantity":{"type":"number"},"quantityAfter":{"type":"number"},"unitCost":{"type":"number"},"totalCostImpact":{"type":"number"},"stockTakeId":{"type":"string"},"stockTakeNumber":{"type":"string"},"requiresApproval":{"type":"boolean"},"approved":{"type":"boolean"},"approvedBy":{"type":"string"},"approvedAt":{"type":"string","format":"date-time"},"approvalComments":{"type":"string"},"posted":{"type":"boolean"},"postedAt":{"type":"string","format":"date-time"},"postedBy":{"type":"string"},"stockMovementId":{"type":"string"},"description":{"type":"string"},"notes":{"type":"string"},"responsiblePerson":{"type":"string"},"photoUrls":{"type":"string"},"documentUrls":{"type":"string"},"incidentNumber":{"type":"string"},"insuranceClaim":{"type":"boolean"},"claimNumber":{"type":"string"},"claimAmount":{"type":"number"},"cancelled":{"type":"boolean"},"cancelledAt":{"type":"string","format":"date-time"},"cancelledBy":{"type":"string"},"cancellationReason":{"type":"string"},"reversalAdjustmentId":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"updatedBy":{"type":"string"}}}
```

## StockIssueItemRequest
```json
{"type":"object","properties":{"productId":{"type":"string","minLength":1},"batchId":{"type":"string"},"quantity":{"type":"number","minimum":0.0},"notes":{"type":"string","maxLength":1000,"minLength":0}},"required":["productId","quantity"]}
```

## StockIssueRequest
```json
{"type":"object","properties":{"locationId":{"type":"string","minLength":1},"issueDate":{"type":"string","format":"date-time"},"issueType":{"type":"string","enum":["INTERNAL_CONSUMPTION","SALES_ISSUE","TRANSFER_OUT","OTHERS"]},"departmentId":{"type":"string","maxLength":100,"minLength":0},"receivedBy":{"type":"string","maxLength":200,"minLength":0},"orderId":{"type":"string","maxLength":100,"minLength":0},"bookingId":{"type":"string","maxLength":100,"minLength":0},"toLocationId":{"type":"string"},"autoCompleteTransfer":{"type":"boolean"},"items":{"type":"array","items":{"$ref":"#/components/schemas/StockIssueItemRequest"},"minItems":1},"notes":{"type":"string","maxLength":1000,"minLength":0},"reason":{"type":"string","maxLength":1000,"minLength":0}},"required":["issueDate","issueType","items","locationId"]}
```

## StockLevelResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"productId":{"type":"string"},"productSku":{"type":"string"},"productName":{"type":"string"},"productCategory":{"type":"string"},"locationId":{"type":"string"},"locationCode":{"type":"string"},"locationName":{"type":"string"},"quantityOnHand":{"type":"number"},"quantityReserved":{"type":"number"},"quantityAvailable":{"type":"number"},"quantityInTransit":{"type":"number"},"quantityAllocated":{"type":"number"},"averageCost":{"type":"number"},"totalValue":{"type":"number"},"lastPurchaseCost":{"type":"number"},"isBelowReorderLevel":{"type":"boolean"},"isBelowMinLevel":{"type":"boolean"},"isAboveMaxLevel":{"type":"boolean"},"isOutOfStock":{"type":"boolean"},"lastStockInDate":{"type":"string","format":"date-time"},"lastStockOutDate":{"type":"string","format":"date-time"},"lastStockCountDate":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"lastRecalculatedAt":{"type":"string","format":"date-time"}}}
```

## StockLevelStatisticsResponse
```json
{"type":"object","properties":{"totalInventoryValue":{"type":"number"},"totalQuantityOnHand":{"type":"number"},"totalQuantityReserved":{"type":"number"},"totalQuantityAvailable":{"type":"number"},"outOfStockCount":{"type":"integer","format":"int64"},"lowStockCount":{"type":"integer","format":"int64"}}}
```

## StockMovementResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"movementNumber":{"type":"string"},"movementType":{"type":"string","enum":["PURCHASE_RECEIPT","PURCHASE_RETURN_REVERSAL","SALES_RETURN","TRANSFER_IN","ADJUSTMENT_IN","PRODUCTION_IN","SALES_ISSUE","INTERNAL_CONSUMPTION","TRANSFER_OUT","ADJUSTMENT_OUT","DAMAGE_WRITEOFF","EXPIRY_WRITEOFF","THEFT_WRITEOFF","LOST_WRITEOFF","SAMPLE_ISSUE","STOCK_TAKE","OPENING_BALANCE","REVALUATION"]},"movementDate":{"type":"string","format":"date-time"},"productId":{"type":"string"},"productSku":{"type":"string"},"productName":{"type":"string"},"locationId":{"type":"string"},"locationCode":{"type":"string"},"locationName":{"type":"string"},"fromLocationId":{"type":"string"},"fromLocationCode":{"type":"string"},"fromLocationName":{"type":"string"},"toLocationId":{"type":"string"},"toLocationCode":{"type":"string"},"toLocationName":{"type":"string"},"quantity":{"type":"number"},"unitCost":{"type":"number"},"totalCost":{"type":"number"},"balanceAfter":{"type":"number"},"batchId":{"type":"string"},"batchNumber":{"type":"string"},"referenceNumber":{"type":"string"},"referenceType":{"type":"string"},"referenceId":{"type":"string"},"orderId":{"type":"string"},"bookingId":{"type":"string"},"departmentId":{"type":"string"},"performedBy":{"type":"string"},"approvedBy":{"type":"string"},"receivedBy":{"type":"string"},"notes":{"type":"string"},"reason":{"type":"string"},"qualityStatus":{"type":"string"},"qualityNotes":{"type":"string"},"attachmentUrl":{"type":"string"},"isReversed":{"type":"boolean"},"reversedBy":{"type":"string"},"reversedAt":{"type":"string","format":"date-time"},"reversalMovementId":{"type":"string"},"reversalReason":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## StockRequisitionResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"requisitionNumber":{"type":"string"},"status":{"type":"string","enum":["DRAFT","PENDING_APPROVAL","APPROVED","REJECTED","PARTIALLY_FULFILLED","FULFILLED","CANCELLED"]},"department":{"type":"string","enum":["BAR","KITCHEN","HOUSEKEEPING","FRONT_DESK","MAINTENANCE","MANAGEMENT","INVENTORY","OTHER"]},"requestedBy":{"type":"string"},"requestedByName":{"type":"string"},"requisitionDate":{"type":"string","format":"date"},"requiredByDate":{"type":"string","format":"date"},"storageLocationId":{"type":"string"},"storageLocationName":{"type":"string"},"requiresApproval":{"type":"boolean"},"approvedAt":{"type":"string","format":"date-time"},"approvedBy":{"type":"string"},"approvalNotes":{"type":"string"},"rejectedAt":{"type":"string","format":"date-time"},"rejectedBy":{"type":"string"},"rejectionReason":{"type":"string"},"totalQuantityRequested":{"type":"number"},"totalQuantityApproved":{"type":"number"},"totalQuantityIssued":{"type":"number"},"estimatedValue":{"type":"number"},"fulfilledAt":{"type":"string","format":"date-time"},"fulfilledBy":{"type":"string"},"purpose":{"type":"string"},"notes":{"type":"string"},"cancelled":{"type":"boolean"},"cancellationReason":{"type":"string"},"items":{"type":"array","items":{"$ref":"#/components/schemas/RequisitionItemResponse"}},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"}}}
```

## StockTakeItemResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"lineNumber":{"type":"integer","format":"int32"},"productId":{"type":"string"},"productSku":{"type":"string"},"productName":{"type":"string"},"batchId":{"type":"string"},"batchNumber":{"type":"string"},"systemQuantity":{"type":"number"},"actualQuantity":{"type":"number"},"varianceQuantity":{"type":"number"},"variancePercent":{"type":"number"},"unitCost":{"type":"number"},"systemValue":{"type":"number"},"actualValue":{"type":"number"},"varianceValue":{"type":"number"},"counted":{"type":"boolean"},"countedAt":{"type":"string","format":"date-time"},"countedBy":{"type":"string"},"recounted":{"type":"boolean"},"countAttempts":{"type":"integer","format":"int32"},"hasVariance":{"type":"boolean"},"significantVariance":{"type":"boolean"},"requiresInvestigation":{"type":"boolean"},"varianceReason":{"type":"string"},"investigationNotes":{"type":"string"},"investigatedBy":{"type":"string"},"investigatedAt":{"type":"string","format":"date-time"},"resolved":{"type":"boolean"},"resolutionAction":{"type":"string"},"adjustmentId":{"type":"string"},"conditionNotes":{"type":"string"},"damagedItemsFound":{"type":"boolean"},"expiredItemsFound":{"type":"boolean"},"storageLocationObserved":{"type":"string"},"photoUrls":{"type":"string"},"notes":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}
```

## StockTakeResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"stockTakeNumber":{"type":"string"},"status":{"type":"string","enum":["SCHEDULED","IN_PROGRESS","PENDING_REVIEW","REVIEWED","ADJUSTMENTS_POSTED","COMPLETED","CANCELLED"]},"locationId":{"type":"string"},"locationCode":{"type":"string"},"locationName":{"type":"string"},"stockTakeType":{"type":"string"},"scheduledDate":{"type":"string","format":"date"},"startedAt":{"type":"string","format":"date-time"},"completedAt":{"type":"string","format":"date-time"},"supervisorId":{"type":"string"},"supervisorName":{"type":"string"},"countedBy":{"type":"string"},"reviewedBy":{"type":"string"},"reviewedAt":{"type":"string","format":"date-time"},"items":{"type":"array","items":{"$ref":"#/components/schemas/StockTakeItemResponse"}},"totalItemsExpected":{"type":"integer","format":"int32"},"totalItemsCounted":{"type":"integer","format":"int32"},"totalItemsWithVariance":{"type":"integer","format":"int32"},"totalValueVariance":{"type":"number"},"systemStockValue":{"type":"number"},"actualStockValue":{"type":"number"},"acceptableVariancePercent":{"type":"number"},"hasSignificantVariances":{"type":"boolean"},"adjustmentsPosted":{"type":"boolean"},"adjustmentsPostedAt":{"type":"string","format":"date-time"},"adjustmentsPostedBy":{"type":"string"},"adjustmentsCount":{"type":"integer","format":"int32"},"stockFrozen":{"type":"boolean"},"stockFrozenAt":{"type":"string","format":"date-time"},"stockUnfrozenAt":{"type":"string","format":"date-time"},"findings":{"type":"string"},"recommendations":{"type":"string"},"notes":{"type":"string"},"reportUrl":{"type":"string"},"cancelled":{"type":"boolean"},"cancelledAt":{"type":"string","format":"date-time"},"cancelledBy":{"type":"string"},"cancellationReason":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"updatedBy":{"type":"string"}}}
```

## StorageLocationResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"hotelId":{"type":"string"},"locationCode":{"type":"string"},"locationName":{"type":"string"},"locationType":{"type":"string","enum":["MAIN_WAREHOUSE","KITCHEN_STORE","BAR_STORE","HOUSEKEEPING_STORE","MAINTENANCE_STORE","OFFICE_STORE","COLD_STORAGE","FREEZER","DRY_STORE","CELLAR","EXTERNAL_WAREHOUSE","MOBILE_STORAGE","OTHER"]},"description":{"type":"string"},"building":{"type":"string"},"floor":{"type":"string"},"room":{"type":"string"},"physicalAddress":{"type":"string"},"totalCapacity":{"type":"number","format":"double"},"capacityUnit":{"type":"string"},"temperatureControlled":{"type":"boolean"},"minTemperature":{"type":"number","format":"double"},"maxTemperature":{"type":"number","format":"double"},"humidityControlled":{"type":"boolean"},"minHumidity":{"type":"number","format":"double"},"maxHumidity":{"type":"number","format":"double"},"accessRestrictions":{"type":"string"},"managerUserId":{"type":"string"},"contactPerson":{"type":"string"},"contactPhone":{"type":"string"},"active":{"type":"boolean"},"isPrimary":{"type":"boolean"},"allowNegativeStock":{"type":"boolean"},"operatingHours":{"type":"string"},"specialInstructions":{"type":"string"},"notes":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"createdBy":{"type":"string"},"updatedBy":{"type":"string"},"deactivatedAt":{"type":"string","format":"date-time"},"deactivatedBy":{"type":"string"},"totalProductsStored":{"type":"integer","format":"int32"},"lowStockProducts":{"type":"integer","format":"int32"},"outOfStockProducts":{"type":"integer","format":"int32"}}}
```

## SupplierResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"email":{"type":"string"},"phone":{"type":"string"},"hotelId":{"type":"string"},"productIds":{"type":"array","items":{"type":"string"}},"products":{"type":"array","items":{"$ref":"#/components/schemas/SimpleProductResponse"}}}}
```

## TerminalStatusResponse
```json
{"type":"object","properties":{"terminalId":{"type":"string"},"name":{"type":"string"},"online":{"type":"boolean"},"available":{"type":"boolean"}}}
```

## TimeSlotAmount
```json
{"type":"object","properties":{"timeSlot":{"type":"string"},"amount":{"type":"number"}}}
```

## UpdateGRNRequest
```json
{"type":"object","properties":{"supplierInvoiceNumber":{"type":"string","maxLength":100,"minLength":0},"supplierInvoiceDate":{"type":"string","format":"date"},"supplierDeliveryNote":{"type":"string","maxLength":100,"minLength":0},"receiptDate":{"type":"string","format":"date"},"receiptTime":{"type":"string","format":"date-time"},"deliveredBy":{"type":"string","maxLength":200,"minLength":0},"vehicleNumber":{"type":"string","maxLength":100,"minLength":0},"inspectionRequired":{"type":"boolean"},"inspectionDate":{"type":"string","format":"date-time"},"inspectedBy":{"type":"string","maxLength":200,"minLength":0},"inspectionResult":{"type":"string","maxLength":100,"minLength":0},"inspectionNotes":{"type":"string","maxLength":2000,"minLength":0},"items":{"type":"array","items":{"$ref":"#/components/schemas/GRNItemRequest"},"minItems":1},"notes":{"type":"string","maxLength":2000,"minLength":0},"discrepancies":{"type":"string","maxLength":1000,"minLength":0},"packagingCondition":{"type":"string","maxLength":500,"minLength":0}},"required":["items","receiptDate"]}
```

## UpdateLaundryOrderStatusRequest
```json
{"type":"object","properties":{"status":{"type":"string","enum":["PENDING","PICKED_UP","IN_PROGRESS","WASHING","DRYING","IRONING","QUALITY_CHECK","READY","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","ON_HOLD"]},"notes":{"type":"string"},"staffId":{"type":"string"}},"required":["status"]}
```

## UpdateLostAndFoundItemRequest
```json
{"type":"object","properties":{"itemName":{"type":"string","minLength":1},"description":{"type":"string"},"imageUrl":{"type":"string"},"location":{"type":"string","minLength":1},"dateFound":{"type":"string","format":"date"},"claimStatus":{"type":"string","enum":["UNCLAIMED","CLAIMED","DISPOSED"]},"claimedBy":{"type":"string"},"claimNotes":{"type":"string"}},"required":["itemName","location"]}
```

## UpdateMaintenanceRequest
```json
{"type":"object","properties":{"action":{"type":"string","enum":["SEND_TO_MAINTENANCE","RETURN_FROM_MAINTENANCE"]},"quantity":{"type":"integer","format":"int32","minimum":1},"reason":{"type":"string"},"notes":{"type":"string"},"expectedCompletionDate":{"type":"string"}},"required":["action","quantity"]}
```

## UpdateOrderStatusRequest
```json
{"type":"object","properties":{"status":{"type":"string","enum":["PENDING","COMPLETED","CANCELLED"]}},"required":["status"]}
```

## UpdatePaymentSettingsRequest
```json
{"type":"object","properties":{"serviceFeeBearer":{"type":"string","pattern":"^(GUEST|HOTEL)$"},"serviceFeePercentage":{"type":"number","maximum":100.00,"minimum":0.00},"defaultPaymentLinkExpiryHours":{"type":"integer","format":"int32","maximum":720,"minimum":1},"paymentLinksEnabled":{"type":"boolean"},"autoPayoutEnabled":{"type":"boolean"},"minimumPayoutAmount":{"type":"number","minimum":100.00},"notifyOnPayment":{"type":"boolean"},"notifyOnPayout":{"type":"boolean"},"notificationEmail":{"type":"string"},"notificationPhone":{"type":"string","pattern":"^\\+?[1-9]\\d{1,14}$"}}}
```

## UpdateProductRequest
```json
{"type":"object","properties":{"barcode":{"type":"string","maxLength":100,"minLength":0},"name":{"type":"string","maxLength":200,"minLength":0},"description":{"type":"string","maxLength":1000,"minLength":0},"brand":{"type":"string","maxLength":200,"minLength":0},"manufacturer":{"type":"string","maxLength":100,"minLength":0},"category":{"type":"string","enum":["FOOD_FRESH","FOOD_FROZEN","FOOD_DRY_GOODS","BEVERAGES_ALCOHOLIC","BEVERAGES_NON_ALCOHOLIC","BEVERAGES_HOT","BEVERAGES","FOOD","CLEANING_SUPPLIES","LAUNDRY_SUPPLIES","GUEST_AMENITIES","LINENS_TOWELS","MAINTENANCE_SUPPLIES","ELECTRICAL_SUPPLIES","PLUMBING_SUPPLIES","HVAC_SUPPLIES","STATIONERY","OFFICE_EQUIPMENT","PRINTING_SUPPLIES","MINIBAR_ITEMS","ROOM_SUPPLIES","WELCOME_ITEMS","KITCHEN_EQUIPMENT","TABLEWARE","DISPOSABLES","UNIFORMS","SAFETY_EQUIPMENT","MARKETING_MATERIALS","GENERAL_SUPPLIES","OTHER"]},"subcategory":{"type":"string","maxLength":100,"minLength":0},"status":{"type":"string","enum":["ACTIVE","INACTIVE","DISCONTINUED","DRAFT","ARCHIVED"]},"baseUnit":{"type":"string"},"purchaseUnit":{"type":"string"},"consumptionUnit":{"type":"string"},"conversionFactor":{"type":"number","format":"double","minimum":0.0},"standardCost":{"type":"number","minimum":0.0},"lastPurchasePrice":{"type":"number","minimum":0.0},"sellingPrice":{"type":"number","minimum":0.0},"valuationMethod":{"type":"string","enum":["FIFO","LIFO","WEIGHTED_AVERAGE","STANDARD_COST","SPECIFIC_IDENTIFICATION"]},"reorderLevel":{"type":"number","format":"double","minimum":0.0},"reorderQuantity":{"type":"number","format":"double","minimum":0.0},"minStockLevel":{"type":"number","format":"double","minimum":0.0},"maxStockLevel":{"type":"number","format":"double","minimum":0.0},"safetyStock":{"type":"number","format":"double","minimum":0.0},"leadTimeDays":{"type":"integer","format":"int32","minimum":0},"trackBatches":{"type":"boolean"},"trackExpiry":{"type":"boolean"},"trackSerialNumbers":{"type":"boolean"},"perishable":{"type":"boolean"},"storageRequirements":{"type":"string","maxLength":500,"minLength":0},"temperatureMin":{"type":"number","format":"double"},"temperatureMax":{"type":"number","format":"double"},"shelfLifeDays":{"type":"integer","format":"int32","minimum":0},"weight":{"type":"number","format":"double"},"length":{"type":"number","format":"double"},"width":{"type":"number","format":"double"},"height":{"type":"number","format":"double"},"preferredSupplierId":{"type":"string","maxLength":200,"minLength":0},"supplierPartNumber":{"type":"string","maxLength":100,"minLength":0},"imageUrl":{"type":"string","maxLength":500,"minLength":0},"notes":{"type":"string","maxLength":1000,"minLength":0},"internalNotes":{"type":"string","maxLength":1000,"minLength":0},"tags":{"type":"string","maxLength":200,"minLength":0},"taxRate":{"type":"number"},"taxCategory":{"type":"string","maxLength":50,"minLength":0},"accountCode":{"type":"string","maxLength":50,"minLength":0},"costCenter":{"type":"string","maxLength":100,"minLength":0}}}
```

## UpdatePurchaseOrderRequest
```json
{"type":"object","properties":{"supplierId":{"type":"string"},"supplierContactPerson":{"type":"string","maxLength":200,"minLength":0},"supplierContactPhone":{"type":"string","maxLength":100,"minLength":0},"supplierContactEmail":{"type":"string","maxLength":200,"minLength":0},"deliveryLocationId":{"type":"string"},"deliveryAddress":{"type":"string","maxLength":500,"minLength":0},"orderDate":{"type":"string","format":"date"},"expectedDeliveryDate":{"type":"string","format":"date"},"taxRate":{"type":"number"},"shippingCost":{"type":"number"},"otherCharges":{"type":"number"},"discountPercent":{"type":"number"},"currency":{"type":"string","maxLength":10,"minLength":0},"exchangeRate":{"type":"number","format":"double"},"paymentTerms":{"type":"string","maxLength":200,"minLength":0},"paymentDueDays":{"type":"integer","format":"int32"},"paymentMethod":{"type":"string","maxLength":100,"minLength":0},"items":{"type":"array","items":{"$ref":"#/components/schemas/PurchaseOrderItemRequest"}},"notes":{"type":"string","maxLength":2000,"minLength":0},"termsAndConditions":{"type":"string","maxLength":1000,"minLength":0},"deliveryInstructions":{"type":"string","maxLength":1000,"minLength":0},"internalNotes":{"type":"string","maxLength":1000,"minLength":0},"reason":{"type":"string","maxLength":1000,"minLength":0}},"required":["reason"]}
```

## UpdatePurchaseOrderStatusRequest
```json
{"type":"object","properties":{"status":{"type":"string","minLength":1},"notes":{"type":"string","maxLength":1000,"minLength":0}},"required":["status"]}
```

## UpdateRentalOrderStatusRequest
```json
{"type":"object","properties":{"status":{"type":"string","enum":["PENDING","CONFIRMED","PICKED_UP","ACTIVE","OVERDUE","RETURNED","COMPLETED","CANCELLED","LOST","DAMAGED"]},"notes":{"type":"string"},"staffId":{"type":"string"}},"required":["status"]}
```

## UpdateRoomRequest
```json
{"type":"object","properties":{"roomIdentifier":{"type":"string"},"roomType":{"type":"string"},"roomPrice":{"type":"number"},"roomStatus":{"type":"string"},"roomFacility":{"type":"array","items":{"type":"string"}}}}
```

## UpdateStockTakeRequest
```json
{"type":"object","properties":{"stockTakeType":{"type":"string","maxLength":100,"minLength":0},"scheduledDate":{"type":"string","format":"date"},"supervisorName":{"type":"string","maxLength":200,"minLength":0},"countedBy":{"type":"string","maxLength":500,"minLength":0},"acceptableVariancePercent":{"type":"number","maximum":100.0,"minimum":0.0},"stockFrozen":{"type":"boolean"},"productIds":{"type":"array","items":{"type":"string"}},"notes":{"type":"string","maxLength":2000,"minLength":0},"reason":{"type":"string","maxLength":1000,"minLength":0}},"required":["reason"]}
```

## UpdateSupplierRequest
```json
{"type":"object","properties":{"name":{"type":"string","maxLength":200,"minLength":0},"email":{"type":"string","maxLength":200,"minLength":0},"phone":{"type":"string","maxLength":20,"minLength":0},"productIds":{"type":"array","items":{"type":"string"}},"itemIds":{"type":"array","deprecated":true,"items":{"type":"string","deprecated":true}}}}
```

## UpdateUserPermissionsRequest
```json
{"type":"object","properties":{"permissions":{"type":"array","items":{"type":"string","enum":["FRONT_OFFICE","INVENTORY","RENTALS","LAUNDRY","FINANCE","MAINTENANCE","RESTAURANT","HOUSEKEEPING"]}}},"required":["permissions"]}
```

## UpdateUserRequest
```json
{"type":"object","properties":{"fullName":{"type":"string"},"email":{"type":"string"},"phoneNumber":{"type":"string"},"roles":{"type":"array","items":{"type":"string","enum":["SUPER_ADMIN","HOTEL_OWNER","MANAGER","INVENTORY","FRONT_DESK","RESTAURANT","MARKETER","RENTALS","LAUNDRY","FINANCIALS"]}}}}
```

## UserInfoResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"fullName":{"type":"string"},"email":{"type":"string"},"phoneNumber":{"type":"string"},"staffId":{"type":"string"},"userStatus":{"type":"string"},"roles":{"type":"array","items":{"type":"string"}},"verified":{"type":"boolean"},"changedPassword":{"type":"boolean"},"createdAt":{"type":"string","format":"date-time"},"permissions":{"type":"array","items":{"type":"string","enum":["FRONT_OFFICE","INVENTORY","RENTALS","LAUNDRY","FINANCE","MAINTENANCE","RESTAURANT","HOUSEKEEPING"]}},"hotels":{"type":"array","items":{"$ref":"#/components/schemas/HotelDto"}}}}
```

## UserModelResponse
```json
{"type":"object","properties":{"id":{"type":"string"},"customId":{"type":"string"},"fullName":{"type":"string"},"email":{"type":"string"},"phoneNumber":{"type":"string"},"staffId":{"type":"string"},"userStatus":{"type":"string"},"roles":{"type":"array","items":{"type":"string"}},"verified":{"type":"boolean"},"lastLogin":{"type":"string","format":"date-time"},"permissions":{"type":"array","items":{"type":"string","enum":["FRONT_OFFICE","INVENTORY","RENTALS","LAUNDRY","FINANCE","MAINTENANCE","RESTAURANT","HOUSEKEEPING"]}}}}
```

## UserPresenceResponse
```json
{"type":"object","properties":{"userId":{"type":"string"},"userName":{"type":"string"},"lastActiveAt":{"type":"string","format":"date-time"},"online":{"type":"boolean"}}}
```

## VerifyOtpRequest
```json
{"type":"object","properties":{"otp":{"type":"string"}}}
```

## VerifyOtpResponse
```json
{"type":"object","properties":{"resetToken":{"type":"string"},"message":{"type":"string"}}}
```


# Hospio360 — System Super Admin Panel
## Functional Requirements Document (FRD)

**Version:** 1.0
**Date:** February 28, 2026
**Product:** Hospio360 Hotel Management System
**Module:** Super Admin (Platform Owner) Dashboard
**Audience:** Design Team, Engineering Team

---

## 1. Executive Summary

The Super Admin Panel is the **platform-level control center** for the entire Hospio360 ecosystem. Unlike the Hotel Owner role (which manages their own hotels), the Super Admin has **complete visibility and control over every hotel business, user, subscription, transaction, and system configuration** on the platform.

This panel serves the platform operations team that manages Hospio360 as a SaaS business — handling onboarding, support, compliance, revenue, and system health.

---

## 2. User Persona

| Attribute | Description |
|-----------|-------------|
| **Role** | `SUPER_ADMIN` / `PLATFORM_OWNER` |
| **Goal** | Monitor, manage, and control the entire Hospio360 platform |
| **Access Level** | Unrestricted — read/write access to all hotels, users, and system settings |
| **Typical Users** | Hospio360 founding team, platform operations staff, support escalation team |

---

## 3. Information Architecture & Navigation

### 3.1 Primary Sidebar Navigation

```
Super Admin Panel
├── Dashboard (Platform Overview)
├── Hotel Businesses
│   ├── All Businesses
│   ├── Pending Approvals
│   └── Suspended / Flagged
├── Hotels
│   ├── All Hotels
│   └── Hotel Detail View
├── Users & Staff
│   ├── All Users
│   ├── Hotel Owners
│   ├── Managers
│   ├── Staff (by role)
│   └── Suspended Users
├── Subscriptions & Billing
│   ├── Active Plans
│   ├── Expired / Past Due
│   ├── Revenue & Invoices
│   └── Plan Management
├── Platform Analytics
│   ├── Revenue Overview
│   ├── Occupancy Metrics
│   ├── Module Usage
│   └── Growth Trends
├── Operations Monitor
│   ├── Bookings (Cross-Hotel)
│   ├── Restaurant (Cross-Hotel)
│   ├── Laundry (Cross-Hotel)
│   ├── Rentals (Cross-Hotel)
│   └── Inventory (Cross-Hotel)
├── Financial Oversight
│   ├── Platform Revenue
│   ├── Hotel Revenue Breakdown
│   ├── Marketer Commissions
│   └── Payout Management
├── System Configuration
│   ├── Roles & Permissions
│   ├── Subscription Plans
│   ├── Service Fees
│   ├── Email / WhatsApp Templates
│   └── Feature Flags
├── Audit & Compliance
│   ├── Audit Logs (Global)
│   ├── Login History
│   └── Data Export Requests
├── Support & Feedback
│   ├── Feedback / Tickets
│   ├── Announcements
│   └── System Notifications
├── System Health
│   ├── Service Status
│   ├── Scheduled Jobs
│   └── Error Logs
└── Settings
    ├── Admin Profile
    ├── Admin Team Management
    └── Platform Settings
```

---

## 4. Feature Specifications

### 4.1 Platform Dashboard

**Purpose:** At-a-glance health of the entire Hospio360 platform.

#### 4.1.1 Key Metric Cards (Top Row)
| Metric | Description | Source |
|--------|-------------|--------|
| Total Hotel Businesses | Count of registered HotelBiz entities | `HotelBiz` table |
| Active Hotels | Hotels with active subscriptions | `Hotel` + `Subscription` |
| Total Users | All platform users across all roles | `User` table |
| Monthly Recurring Revenue | Sum of active subscription fees | `Subscription` + `Payment` |
| Platform Occupancy Rate | Avg occupancy across all hotels | `Room` + `Booking` |
| Today's Check-ins | Total check-ins today across platform | `Booking` (CHECKED_IN today) |

#### 4.1.2 Trend Charts
- **Hotel Growth:** Line chart — new hotel signups per month (12-month view)
- **Revenue Trend:** Area chart — platform revenue over time (MRR, ARR)
- **User Growth:** Stacked bar — users by role over time
- **Booking Volume:** Bar chart — total bookings per week across all hotels

#### 4.1.3 Activity Feed
- Real-time feed of significant platform events:
  - New hotel business registrations
  - Subscription upgrades/downgrades
  - High-value transactions
  - System alerts (failed payments, expired subscriptions)
  - Staff suspensions

#### 4.1.4 Quick Actions
- Onboard new hotel business
- Send platform-wide announcement
- View pending approvals
- Export platform report

---

### 4.2 Hotel Business Management

**Purpose:** Full lifecycle management of hotel businesses on the platform.

#### 4.2.1 Hotel Businesses List
| Column | Description |
|--------|-------------|
| Business ID | Unique `customId` |
| Business Name | Owner's registered business name |
| Owner | Hotel owner's full name + email |
| Registration # | Business registration number |
| Hotels Count | Number of hotel properties |
| Status | `ACTIVE`, `PENDING`, `SUSPENDED`, `DEACTIVATED` |
| Email Verified | Yes/No indicator |
| Subscription | Current plan name + status |
| Registered Date | Account creation date |
| Actions | View, Edit, Suspend, Deactivate |

**Filters:** Status, subscription plan, date range, search by name/email/registration number

**Bulk Actions:** Suspend selected, export list, send bulk notification

#### 4.2.2 Business Detail View
**Business Information Panel:**
- Business name, registration number, address, timezone, currency
- Owner details (name, email, phone, position)
- Email verification status + verify manually button
- Account status with change dropdown + reason field

**Hotels Under This Business:**
- Table of all hotel properties with: name, location, room count, staff count, status
- Click to navigate to individual hotel detail

**Subscription & Billing:**
- Current plan, start date, end date, auto-renew status
- Payment history table
- Manually extend subscription, change plan, apply credit

**Activity Timeline:**
- Chronological log of all actions on this business (created, verified, plan changed, suspended, etc.)

#### 4.2.3 Pending Approvals Queue
- New hotel business registrations awaiting review
- Each entry shows: business info, owner info, documents submitted
- Actions: Approve, Reject (with reason), Request more info
- Approval triggers: email verification link, subscription setup

#### 4.2.4 Onboard New Hotel Business (Manual)
Form fields:
- Business name, registration number, owner position, address
- Owner: full name, email, phone
- Timezone selection, currency selection
- Initial subscription plan assignment
- Skip email verification toggle
- Send welcome email toggle

---

### 4.3 Hotels Management

**Purpose:** Drill into individual hotel properties across all businesses.

#### 4.3.1 All Hotels List
| Column | Description |
|--------|-------------|
| Hotel ID | Unique identifier |
| Hotel Name | Property name |
| Business | Parent hotel business name |
| Location | City/address |
| Total Rooms | Room count |
| Occupied Rooms | Currently checked-in |
| Staff Count | Assigned staff members |
| Status | Active/Inactive |
| Created | Registration date |

**Filters:** Business, location, room count range, occupancy %, status

#### 4.3.2 Hotel Detail View
**Overview Tab:**
- Hotel info: name, address, location, turnover buffer hours
- Manager assignment (with reassign capability)
- Room summary: total, occupied, available, reserved, out of service
- Staff list with roles

**Rooms Tab:**
- Full room inventory: room identifier, type, price, status, facilities
- Ability to add/edit/deactivate rooms
- Room type management for this hotel

**Bookings Tab:**
- All bookings for this hotel with search, date filter, status filter
- Booking detail with guest info, payment history, manual charges

**Operations Tab:**
- Sub-tabs for: Restaurant, Laundry, Rentals, Inventory
- Each showing key metrics and recent activity for that hotel
- Restaurant: orders today, revenue, pending orders, menu item count
- Laundry: active orders, revenue, items processed
- Rentals: active rentals, overdue items, revenue
- Inventory: stock value, low stock alerts, recent movements

**Financial Tab:**
- Revenue breakdown: rooms, restaurant, laundry, rentals, other
- Expense summary by category
- Profit/loss for configurable period
- Export capability

**Staff Tab:**
- All staff assigned to this hotel
- Role, status, last login, permissions
- Actions: reset password, suspend, change role, remove

**Audit Log Tab:**
- All audit trail entries for this hotel
- Filter by action type, user, date range

---

### 4.4 Users & Staff Management

**Purpose:** Manage every user account across the entire platform.

#### 4.4.1 All Users List
| Column | Description |
|--------|-------------|
| User ID | `customId` |
| Full Name | User's display name |
| Email | Login email |
| Phone | Phone number |
| Roles | Assigned roles (multi-role support) |
| Hotel(s) | Assigned hotel(s) |
| Status | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING` |
| Verified | Email verification status |
| Last Login | Last authentication timestamp |
| Created | Account creation date |

**Filters:** Role, status, hotel, verified status, last login range, date created range

**Search:** By name, email, phone, staff ID, custom ID

#### 4.4.2 User Detail View
**Profile Panel:**
- Full name, email, phone, staff ID
- Account status with change capability + reason
- Email verification status (with manual verify button)
- Password reset (force reset on next login)

**Roles & Permissions:**
- Current roles with hotel assignments
- Add/remove roles
- Per-role permissions matrix (FRONT_OFFICE, INVENTORY, RENTALS, LAUNDRY, FINANCE, MAINTENANCE, RESTAURANT, HOUSEKEEPING)
- Effective permissions summary

**Activity:**
- Login history (date, IP, device)
- Actions performed (from audit logs)
- Sessions management (active sessions, force logout)

**Associated Data:**
- If Hotel Owner: list of businesses and hotels
- If Manager: assigned hotels
- If Staff: hotel assignment, department
- If Marketer: commission summary, wallet balance, payout history

#### 4.4.3 Role-Based User Views
Quick-filter views:
- **Hotel Owners** — with hotel count, subscription status, revenue generated
- **Managers** — with assigned hotels, staff they manage
- **Front Desk** — with check-in/out stats
- **Restaurant Staff** — with order volume
- **Laundry Staff** — with order volume
- **Rental Staff** — with active rental count
- **Inventory Officers** — with stock value managed
- **Marketers** — with referral count, commission earned, wallet balance

#### 4.4.4 Create User
- Full name, email, phone
- Role assignment (with hotel if applicable)
- Send invitation email toggle
- Set temporary password option

---

### 4.5 Subscriptions & Billing

**Purpose:** Manage the SaaS subscription lifecycle and platform revenue.

#### 4.5.1 Active Subscriptions
| Column | Description |
|--------|-------------|
| Business | Hotel business name |
| Plan | Subscription plan name |
| Status | `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED` |
| Start Date | Subscription start |
| End Date | Current period end |
| Payment Method | Last payment method used |
| Amount | Monthly/annual fee |
| Auto-Renew | On/Off |

**Filters:** Plan, status, payment method, date range, amount range

#### 4.5.2 Plan Management
- Create/edit subscription plans:
  - Plan name, description
  - Pricing: monthly, quarterly, annual
  - Feature limits: max hotels, max rooms per hotel, max staff, module access
  - Trial period configuration
- Enable/disable plans
- Set default plan for new signups

#### 4.5.3 Revenue Dashboard
- **MRR (Monthly Recurring Revenue)** — current + trend
- **ARR (Annual Recurring Revenue)** — projected
- **Churn Rate** — cancellations this month
- **Average Revenue Per Hotel** — ARPU metric
- **Revenue by Plan** — pie chart breakdown
- **Payment Success Rate** — successful vs failed payments
- **Outstanding Invoices** — unpaid/overdue amounts

#### 4.5.4 Manual Billing Actions
- Apply credit to a business account
- Generate manual invoice
- Extend subscription period
- Override plan limits
- Process refund

---

### 4.6 Platform Analytics

**Purpose:** Deep analytics across all hotels for business intelligence.

#### 4.6.1 Revenue Overview
- Total platform revenue (all hotels combined)
- Revenue by module: Rooms, Restaurant, Laundry, Rentals, Other
- Revenue by hotel (top 10 earners)
- Revenue by region/location
- Configurable date ranges: today, this week, this month, custom

#### 4.6.2 Occupancy Metrics
- Platform-wide average occupancy rate
- Occupancy by hotel (ranked)
- Occupancy trend (daily/weekly/monthly)
- Average length of stay
- Check-in/check-out volumes

#### 4.6.3 Module Usage Analytics
- **Restaurant:** Total orders, avg order value, popular items, revenue per hotel
- **Laundry:** Total orders, avg turnaround, revenue per hotel
- **Rentals:** Total orders, overdue rate, popular items, revenue per hotel
- **Inventory:** Stock value across platform, movement volume, low stock alerts
- **Messaging:** Active conversations, messages per day, response times

#### 4.6.4 Growth Trends
- New hotel signups over time
- User growth by role
- Feature adoption rates (which modules are most used)
- Hotel performance scores (composite metric)

---

### 4.7 Operations Monitor

**Purpose:** Cross-hotel operational visibility for support and oversight.

#### 4.7.1 Bookings Monitor
- All bookings across all hotels (global view)
- Filter by hotel, status, date range, guest name, organization
- Booking volume heatmap (by day/hour)
- Flagged bookings (overdue payments, disputes)

#### 4.7.2 Restaurant Monitor
- Active orders across all hotels
- Order volume by hotel
- Popular menu items (platform-wide)
- Average order value trends
- Outstanding payments

#### 4.7.3 Laundry Monitor
- Active laundry orders across hotels
- Orders by status (Pending → Picked Up → In Progress → ... → Delivered)
- Turnaround time metrics
- Overdue deliveries

#### 4.7.4 Rentals Monitor
- Active rentals across hotels
- Overdue rentals (with hotel + guest details)
- Equipment condition summary
- Revenue leakage from overdue items

#### 4.7.5 Inventory Monitor
- Total stock value across platform
- Low stock alerts (per hotel)
- Out of stock items (per hotel)
- Stock movement anomalies (unusual spikes)

---

### 4.8 Financial Oversight

**Purpose:** Platform-level financial management and marketer payouts.

#### 4.8.1 Platform Revenue
- Subscription revenue breakdown
- Service fee revenue (% on transactions)
- Revenue by hotel business
- Revenue by module
- Exportable financial reports (CSV, Excel, PDF)

#### 4.8.2 Hotel Revenue Breakdown
- Per-hotel revenue with drill-down:
  - Room revenue, restaurant revenue, laundry revenue, rental revenue, other income
  - Expenses by category
  - Net profit/loss
- Comparison: hotel A vs hotel B
- Performance ranking

#### 4.8.3 Marketer Commissions
- All marketers with: name, hotel, share %, total earned, wallet balance
- Commission history with status (Pending, Paid, Failed)
- Due dates and overdue commissions
- Manual commission adjustment

#### 4.8.4 Payout Management
- Payout request queue (from marketers)
- Payout history with status tracking
- Manual payout processing
- Payout configuration: minimum amount, retry settings
- Bank detail verification

---

### 4.9 System Configuration

**Purpose:** Configure platform-wide settings that affect all hotels.

#### 4.9.1 Roles & Permissions
- View all system roles: `SUPER_ADMIN`, `HOTEL_OWNER`, `MANAGER`, `FRONT_DESK`, `RESTAURANT`, `LAUNDRY`, `RENTALS`, `INVENTORY`, `FINANCIALS`, `MARKETER`
- Per-role default permissions matrix
- Create custom roles (future)
- Permission descriptions and impact

#### 4.9.2 Subscription Plans Editor
- Create/edit/archive plans
- Feature flags per plan (which modules are included)
- Pricing tiers with trial periods
- Plan comparison table

#### 4.9.3 Service Fees Configuration
- Platform service fee percentage (default: 3%)
- Fee bearer setting: Guest / Hotel / Split
- Per-module fee overrides (if applicable)
- Payment gateway settings (Paystack mode: test/live)
- Payment link base URL and default expiry

#### 4.9.4 Communication Templates
- **Email Templates:** Edit subject and body for:
  - Welcome email, email verification, password reset
  - Booking confirmation, check-in/out, payment receipt
  - Subscription renewal, expiry warning
  - Platform announcements
- **WhatsApp Templates:** (Infobip integration)
  - Booking confirmation, payment receipt
  - Laundry ready, restaurant order, rental reminders
  - Check-in/out notifications
- **SMS Templates:** Notification templates
- Template preview and test send

#### 4.9.5 Feature Flags
- Toggle platform features on/off globally or per-plan:
  - WhatsApp notifications
  - Guest greeting scheduler
  - Auto-payout for marketers
  - Paystack terminal support
  - Bank transfer payments
  - Export functionality (CSV, Excel, PDF)
  - Chat/messaging module
  - Rental overdue auto-penalty

---

### 4.10 Audit & Compliance

**Purpose:** Complete audit trail and compliance oversight.

#### 4.10.1 Global Audit Logs
| Column | Description |
|--------|-------------|
| Timestamp | When the action occurred |
| User | Who performed the action (name + email) |
| Hotel | Which hotel (if applicable) |
| Action | CREATE, UPDATE, DELETE, EXPORT, etc. |
| Entity Type | Booking, Room, User, Payment, etc. |
| Entity ID | ID of the affected record |
| Old Value | Previous state (JSON diff) |
| New Value | New state (JSON diff) |

**Filters:** User, hotel, action type, entity type, date range
**Export:** CSV, Excel with full audit details

#### 4.10.2 Login History
- All login attempts across platform
- Columns: user, email, timestamp, IP address, status (success/failure), device
- Failed login patterns (brute force detection)
- Geo-location of logins (if available)

#### 4.10.3 Data Export Requests
- Log of all data exports performed by any user
- Export type, data scope, user who exported, timestamp
- GDPR-style data request tracking (future)

---

### 4.11 Support & Feedback

**Purpose:** Handle user feedback and platform-wide communications.

#### 4.11.1 Feedback / Tickets
- All feedback submitted by hotel staff
- Columns: ID, submitter, hotel, title, rating (1-5), type, status, date
- Status workflow: `New` → `In Progress` → `Resolved` → `Closed`
- Assign to admin team member
- Reply functionality
- Priority flagging

#### 4.11.2 Announcements
- Create platform-wide announcements
- Target: All users, specific role, specific hotel, specific business
- Delivery: In-app notification, email, WhatsApp (selectable)
- Schedule for future delivery
- View delivery stats (sent, read, clicked)

#### 4.11.3 System Notifications
- View all notifications sent by the platform
- Filter by type: `USER`, `ROLE`, `HOTEL`, `GLOBAL`
- Notification delivery status
- Resend failed notifications

---

### 4.12 System Health

**Purpose:** Monitor the technical health of the platform.

#### 4.12.1 Service Status
- Backend API health check status
- Database connection pool stats (active, idle, max)
- Response time metrics (avg, p95, p99)
- Error rate (5xx, 4xx)
- Uptime percentage

#### 4.12.2 Scheduled Jobs Monitor
| Job | Schedule | Last Run | Status | Next Run |
|-----|----------|----------|--------|----------|
| Marketer Share Processing | Daily 2:00 AM WAT | timestamp | Success/Failed | timestamp |
| Chat Message Cleanup | Daily 2:10 AM UTC | timestamp | Success/Failed | timestamp |
| Notification Cleanup | Daily 3:00 AM UTC | timestamp | Success/Failed | timestamp |
| Monthly Guest Greeting | 1st of month 8:00 AM WAT | timestamp | Success/Failed | timestamp |
| Rental Overdue Check | Daily 7:00 AM WAT | timestamp | Success/Failed | timestamp |
| Rental Intraday Check | Every 2hrs 8AM-10PM WAT | timestamp | Success/Failed | timestamp |
| Rental Due Reminders | Daily 8:00 AM WAT | timestamp | Success/Failed | timestamp |

- Manual trigger button for each job
- View last execution logs
- Enable/disable individual jobs

#### 4.12.3 Error Logs
- Recent application errors with stack traces
- Error frequency chart
- Group by: endpoint, error type, hotel
- Alert configuration for critical errors

---

### 4.13 Settings

#### 4.13.1 Admin Profile
- View/edit own profile
- Change password
- Two-factor authentication setup

#### 4.13.2 Admin Team Management
- Invite other super admins
- Manage admin permissions (if tiered admin roles exist)
- View admin activity logs

#### 4.13.3 Platform Settings
- Platform name, logo, favicon
- Default timezone and currency
- Support contact information
- Terms of service / privacy policy links
- API rate limiting configuration
- File upload size limits (currently 100MB max)
- Session timeout configuration
- JWT token expiration settings

---

## 5. Cross-Cutting Requirements

### 5.1 Global Search
- Accessible from any page via keyboard shortcut (Cmd/Ctrl + K)
- Search across: hotels, users, bookings, orders, businesses
- Results grouped by entity type
- Click-to-navigate to detail view

### 5.2 Export Capabilities
- Every table/list supports export to CSV, Excel, PDF
- Export respects current filters
- Background export for large datasets with email delivery

### 5.3 Date & Time
- All timestamps displayed in the admin's timezone (configurable)
- Date range picker on all data views
- Quick presets: Today, Yesterday, This Week, This Month, Last 30 Days, Custom

### 5.4 Responsive Design
- Desktop-first (primary use case)
- Tablet support for monitoring views
- Mobile: read-only dashboard access

### 5.5 Real-Time Updates
- Dashboard metrics auto-refresh (configurable interval)
- Live activity feed via WebSocket or polling
- Toast notifications for critical events

### 5.6 Access Control
- Super Admin role cannot be self-assigned
- All admin actions logged in audit trail
- Sensitive actions require confirmation dialog
- Session timeout with re-authentication

---

## 6. Data Model Summary

### Entities the Super Admin Interacts With

| Category | Entities | Count |
|----------|----------|-------|
| **Core** | User, Hotel, HotelBiz, Room, RoomType | 5 |
| **Booking** | Booking, BookingPayment, GuestLog, ManualCharge | 4 |
| **Restaurant** | RestaurantFoodItem, BarItem, KitchenSale, OrderItem, KitchenSalePayment, BarSale, BarSaleItem, RestaurantStock | 8 |
| **Laundry** | LaundryOrder, LaundryOrderItem, LaundryItem, LaundryPayment | 4 |
| **Rentals** | RentalOrder, RentalOrderItem, RentalItem, RentalPayment, RentalItemMaintenanceLog | 5 |
| **Inventory** | Product, ProductBatch, StockLevel, StockMovement, StockAdjustment, StockTake, StockTakeItem, StorageLocation, Supplier, Delivery, GoodsReceiptNote, PurchaseOrder | 12 |
| **Financial** | Financial, Expenditure, OtherIncome, Subscription, Payment | 5 |
| **Marketing** | Marketer, MarketerShare, Wallet, WalletTransaction, PayoutRequest | 5 |
| **Communication** | Notification, ChatConversation, ChatMessage, WhatsAppMessage, WhatsAppTemplate, Feedback | 6 |
| **Admin** | ApprovalRequest, AuditLog, Organization, Destination | 4 |
| **Total** | | **58** |

---

## 7. Role Permissions Matrix

| Feature | Super Admin | Hotel Owner | Manager | Front Desk | Restaurant | Laundry | Rentals | Inventory | Financials |
|---------|:-----------:|:-----------:|:-------:|:----------:|:----------:|:-------:|:-------:|:---------:|:----------:|
| View all hotels | X | Own only | Assigned | Assigned | Assigned | Assigned | Assigned | Assigned | Assigned |
| Manage subscriptions | X | — | — | — | — | — | — | — | — |
| Suspend users | X | Own staff | Own staff | — | — | — | — | — | — |
| View platform analytics | X | — | — | — | — | — | — | — | — |
| System configuration | X | — | — | — | — | — | — | — | — |
| Global audit logs | X | Own hotel | Own hotel | — | — | — | — | — | — |
| Manage admins | X | — | — | — | — | — | — | — | — |
| Cross-hotel reporting | X | Own hotels | — | — | — | — | — | — | — |
| Marketer payouts | X | — | — | — | — | — | — | — | — |
| Communication templates | X | — | — | — | — | — | — | — | — |

---

## 8. Existing API Endpoints Available

The Super Admin panel will leverage existing backend endpoints plus new admin-specific ones:

### Existing Endpoints (Reusable)
- `GET /api/platform-owners/*` — Platform management
- `GET /api/platform/manual/*` — Manual hotel/business creation
- `GET /api/hotel-owners/*` — Hotel owner operations (elevated access)
- `GET /api/managers/*` — Manager operations (elevated access)
- `GET /api/financials/*` — Financial reporting
- `GET /api/notifications/*` — Notification management
- `GET /api/chat/admin/*` — Chat administration
- `GET /api/feedback/*` — Feedback management
- `GET /api/marketing/*` — Marketer management
- All module APIs (front-desk, restaurant, laundry, rentals, inventory) — read access

### New Endpoints Required
- `GET /api/admin/dashboard` — Platform-wide metrics
- `GET /api/admin/businesses` — All hotel businesses with pagination + filters
- `PATCH /api/admin/businesses/{id}/status` — Approve/suspend/deactivate business
- `GET /api/admin/users` — All users with cross-hotel search
- `PATCH /api/admin/users/{id}/status` — Suspend/activate user
- `GET /api/admin/subscriptions` — All subscriptions
- `POST /api/admin/subscriptions/{id}/extend` — Extend subscription
- `GET /api/admin/analytics/*` — Platform analytics endpoints
- `GET /api/admin/audit-logs` — Global audit logs
- `GET /api/admin/login-history` — Login history
- `POST /api/admin/announcements` — Create announcement
- `GET /api/admin/system/health` — System health
- `GET /api/admin/system/jobs` — Scheduled job status
- `POST /api/admin/system/jobs/{id}/trigger` — Manually trigger job
- `CRUD /api/admin/plans` — Subscription plan management
- `CRUD /api/admin/templates` — Communication template management
- `GET /api/admin/config` — System configuration
- `PUT /api/admin/config` — Update configuration

---

## 9. Design Guidelines

### Visual Identity
- **Primary color:** Match existing Hospio360 brand (dark maroon/burgundy `#4A1D2E`)
- **Accent:** Use status-appropriate colors (green for positive, amber for warning, red for critical)
- **Typography:** Same as existing app — clean, professional
- **Cards:** Rounded corners (rounded-xl), subtle borders, white backgrounds

### Layout Patterns
- **Dashboard:** Metric cards + charts + activity feed (similar to existing hotel owner dashboard)
- **List pages:** Table with search bar, filter chips, bulk actions, pagination, export button
- **Detail pages:** Tabs for different data sections, breadcrumb navigation
- **Forms:** Modal dialogs for quick edits, full-page forms for complex creation

### Existing Component Library
The design team should reuse these existing components:
- `MetricCard` — Stats display with icon, value, subtitle, trend indicator
- `BreadCrumbWrapper` — Page layout with breadcrumb navigation
- `DataTablePagination` — Server-side paginated tables
- `TableFilter` — Filter popover with fields
- `ExportDialog` — Export format selection
- `Badge` — Status indicators (default, secondary, destructive, outline, green variants)
- `Sheet` — Side panel for detail views
- `AlertDialog` — Confirmation dialogs for destructive actions

---

## 10. Priority Phases

### Phase 1 — Foundation (MVP)
- Platform Dashboard with key metrics
- Hotel Business list + detail view + approval/suspension
- Users list + detail view + suspend/activate
- Global audit logs
- Admin authentication

### Phase 2 — Financial & Analytics
- Subscription & billing management
- Platform revenue analytics
- Cross-hotel financial reporting
- Marketer commission management & payouts

### Phase 3 — Operations & Monitoring
- Cross-hotel operations monitor (bookings, restaurant, laundry, rentals)
- Inventory monitoring
- System health dashboard
- Scheduled jobs monitor

### Phase 4 — Configuration & Communication
- Subscription plan editor
- Communication template editor
- Feature flags
- Announcement system
- Global search
- Support ticket management

---

*End of Document*

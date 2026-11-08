# Figma design map

File: https://www.figma.com/design/B9nW0aByCi7szZkTCspcl5/Hotel-Internal-System (key `B9nW0aByCi7szZkTCspcl5`).
Surveyed 2026-11-07 from node metadata. Node ids are given as `page:node`; open a node with
`?node-id=<id with : replaced by ->`. Screens are desktop 1440 wide unless marked tablet (1180x820).

## How the file is organised

- Four products: **Owner portal** (page Hotel Owner), **Manager portal** (page Manager portal), **Staff apps** (one tablet page per role plus Staff · Shared), **Platform admin** (page Platform admin (H.M.S), with a marketer portal).
- Every redesigned area is a `✦` section. Inside a section, each screen has a title text, a `__leads <screen>` note listing every button and where it goes, and `__flow` headings grouping screens into numbered flows. Each role page carries one `__page note`.
- Overlays (side panels, modals) are drawn over their parent screen; they are not separate screens.
- The **Build tracker** on the Manager page says "408 designed · 0 to design".
- The **Style Guide** page and the loose `Desktop - N` frames on the Manager page are the old design, not part of the `✦ REDESIGN` system.
- The library is built on SnowUI; font DM Sans; brand maroon `#4c091e`.

## Design & UX rules (from the rules board, 3134:29774)

- One section per area; screens read list → details → actions → notifications; one form per task; title pattern "Area — screen name".
- Side panel 520 wide (680 for wide), full height on the right. Modals 520 confirm, 600 form, 640 large, centred. 42% scrim. No scrim for dropdowns.
- Panel and modal header: icon badge, 20px bold title, one-line context, close top right. Footer: info left, Cancel then main action right, action names the result. Destructive: red top bar, "What happens" block, safer alternative offered.
- Success = toast bottom right for 5s, never a full-screen success. Show the effect before saving. Same people, rooms and numbers across screens. Naira everywhere.
- Manager-only actions carry a shield mark and are logged. Owner is view and download. Spend over ₦500,000 or discount over ₦50,000 goes to the owner.
- Nothing hotel-specific is hard-coded: shifts, job titles, areas, charge categories, payment methods, stores, suppliers, policies and reason lists come from Hotel setup. Owner sets currency, taxes and approval limits. Every dropdown links to "Manage … in Hotel setup". In-use items are hidden, never deleted.

## Components page (3313:3841)

Button (Primary/Secondary/Danger × Medium/Large), Status pill (Green/Amber/Red/Grey/Blue), Input field, Toggle, Radio, Checkbox, Toast (Success/Warning/Error/Info, 380x60), Modal (Confirm 520 / Form 600 / Large 640 / Danger 600), Side panel (520/680), Sidebar item (208x40), Rail item for staff tablet (80x56), KPI card (260x80), Table row (Header/Row 900x40), 60 icons at 24px.

Colour variables (Light/Dark, plus a "Hotel brand" mode): brand/primary, brand/primary-soft, brand/on-primary, text/primary, text/secondary, text/muted, surface/page, surface/card, surface/subtle, border/default, border/strong, status/{success,warning,danger,info}-{fg,bg}, nav/background, nav/text, nav/active, overlay/scrim. Map 1:1 to CSS tokens, e.g. brand/primary → `--color-brand-primary`. The hotel palette replaces brand/* and nav/* at sign-in; status colours are never overridden.

## Developer handoff (3318:3841)

One board, 12 cards: products and where they are; how to read a screen; prototypes (start frames "Manager", "Owner", "Admin", "Marketer"); who can do what (3 levels Full / Can edit / View only; manager-only and owner-only lists); what each hotel configures; components and variables; layout rules; money model (H.M.S share per business, marketers 20% of share for 24 months, 5% WHT) and example data (Royal Suites Ltd, Simpas Hotels, Simpas Ikeja 120 rooms, owner Godwin Kwin, GM Tunde Bakare); platform admin; POS payment model (Moniepoint/OPay); backend architecture (modular monolith, 14 modules, Postgres schema per module, outbox events); the 14 modules and their events.

## Hotel Owner (9:2) — 124 screens

Wrapper section `✦ REDESIGN — Hotel Owner (new screens)` (3025:14708) with 17 sub-sections:

| # | Section | Node | Screens |
|---|---|---|---|
| 01 | Dashboard | 3025:14709 | Dashboard (3005:14588); Approvals waiting (3279:11125); approve spend (3279:11593); decline (3279:11832); ask manager (3279:12063) |
| 02 | Hotels | 3025:14710 | List (3019:14612); Grid (3022:14640); No results (3022:15683); Add a hotel steps 1–5 (3172:16163, 3172:16266, 3173:16138, 3173:16251, 3173:16362) |
| 03 | Hotels actions | 3032:14708 | Row actions (3032:17025); Details & rooms (3032:17645); Edit (3032:18265); Contact manager (3032:18885); Delete (3032:19505); Notifications (3032:20125) |
| 04 | Bookings | 3044:14852 | All (3044:14854); Row actions (3045:14877); Details (3045:15469); Export (3045:16061); Export notifs (3045:16653); New booking (3053:15237); Check in (3053:15830); Record payment (3053:16447); Change dates (3053:17064); Message guest (3053:17681); Cancel (3053:18298) |
| 05 | Staff | 3048:14972 | All (3048:14974); Row actions (3049:14997); Add (3049:15559); Suspend (3049:16121); Notifs (3049:16683); Profile (3051:15093); Edit (3051:15679); Change shift (3051:16265); Reset password (3051:16851); Message (3051:17437); Remove (3051:18023) |
| 06 | Financials | 3057:15380 | Overview (3057:15382); Branch P&L (3062:15405); Transactions (3064:15429); Expenses & budgets (3065:15453); Payroll (3066:15477); Download report (3067:15501); Organizations (3154:32923); Approve org request (3154:33367) |
| 07 | Reports | 3069:15524 | Library (3069:15526); Preview (3070:15549); Download (3070:16209); Schedule (3070:16869); Notifs (3070:17529) |
| 08 | Users | 3079:15813 | All (3079:15815); Profile (3079:16416); Invite (3079:16799); Change role & branches (3079:17182); Remove access (3079:17565); Notifs (3079:17973) |
| 09 | Roles & permissions | 3074:15644 | Roles (3074:15646); Role permissions (3079:18356) |
| 10 | Profile & settings | 3085:15913 | Menu (3085:15915); My profile (3085:16647); Security (3087:16225); Notifications (3087:16461); Company (3087:16697); Change password (3087:16933); Taxes & currency (3211:33092); Approval limits (3211:33430); Sign in (3288:10847); 2-step code (3288:10869); Help (3288:10894); Backup codes (3288:11185); Change 2-step method (3288:11482); Transfer ownership (3288:11787) |
| 11 | Onboarding | 3163:16113 | Create account (3163:16114); Verify phone (3163:16180); Welcome (3163:16235); Business (3164:16113); First hotel (3164:16239); Rooms & prices (3164:16373); First manager (3165:16113); Secure account (3165:16236); All set (3165:16555); Manager's first day (3165:17210); Invite email (3167:16163); Accept invite (3167:16201) |
| 12 | Operations | 3295:11727 | All hotels (3295:11729); Departments (3295:12269); Department details (3295:12701); Activity log (3295:13108); Entry (3295:13534) |
| 13 | Messaging | 3301:11035 | Messages (3301:11037); New (3301:11350); Message all managers (3301:11596) |
| 14 | Inventory | 3301:11847 | Stock across hotels (3301:11849); One hotel (3301:12192); Download (3301:12452) |
| 15 | Notifications | 3301:12733 | All (3301:12735); Bell (3301:13028) |
| 16 | Changes by H.M.S | 3336:5419 | Notification (3336:5421); Activity log (3336:6155); Undo (3336:6539) |
| 17 | Payments | 3345:3951 | Payments & payouts (3345:3953) |

## Manager portal (11:3) — 227 screens

| Section | Node | Screens |
|---|---|---|
| Dashboard & branch switcher | 3133:17597 | Dashboard (3093:16273); Branch switcher (3097:16553); All branches (3098:16404); report issue (3157:18422); assign technician (3157:19080); new task (3157:19717); book a service (3157:20366); all actions (3157:20834); guest reviews (3206:19700); reply (3206:20325) |
| Rooms | 3133:17598 | board (3101:16348); details (3102:16734); out of order (3102:17179); types & prices (3103:16602); add room (3105:16448); add type (3105:16894); change price (3105:17180); special price (3105:17466); assign cleaning (3105:17752); notifs (3105:18198); edit room (3152:19614) |
| Bookings | 3133:17599 | list (3112:16823); details (3113:17170); new · normal + 50% deposit (3113:17826); new · complimentary (3130:18437); check in (3113:18481); check out (3113:19099); record payment (3113:19650); change dates (3113:20275); cancel (3113:20901); notifs (3113:21516); message guest (3109:19491); new · pay in full (3135:17397); pay at check-out (3135:18063); special + full (3135:18729); special + deposit (3135:19395); special + check-out (3135:20061); organization (3149:18388); late check-out (3152:17897); check in without payment (3152:18500) |
| Folios | 3133:17600 | open folios (3125:17373); guest folio (3125:17924); post charge (3127:17754); discount/void (3127:18217); split (3127:18680); transfer folio (3130:17523); transfer charges (3130:17975); notifs (3127:19143); print/email (3152:19100) |
| Staff | 3133:17601 | list (3116:17048); rota (3117:17382); find cover (3117:17920); leave request (3117:18458); add (3117:18996); profile (3117:19610); change shift (3117:20263); notifs (3117:20874); swap (3153:17997); decline leave (3153:18585); change leave dates (3153:19157); message (3153:19740); reset password (3153:20321); suspend (3153:20895); edit (3153:21483); auto-fill gaps (3153:22085) |
| Financials | 3133:17602 | overview (3121:17248); record expense (3123:17656); review request (3123:18073); end-of-day cash (3123:18490); notifs (3123:18907); expenses (3154:18197); transactions (3154:18807); spend requests (3154:19418); decline (3154:20008); ask (3154:20322); choose category (3213:20760); send to owner (3278:8889) |
| Organizations | 3138:17522 | all (3138:17525); overview (3138:17966); invoice (3142:17622); staff (3145:17673); agreement (3145:17961); new org (3145:18249); add staff (3147:17963); stays & bills (3148:17773); statements (3148:18076); over daily cap (3148:18379); create statement (3149:18069); edit agreement (3155:31022); import staff (3155:31391, 3285:11785); payment reminder (3155:31834, 3285:12130); record payment (3155:32170) |
| Night audit | 3138:17523 | checklist (3138:18428); close day (3142:17910); report (3142:18140); extend or check out (3205:19648); past audits (3205:19927) |
| Everywhere | 3159:18547 | bell (3159:18548); profile menu (3159:19221); filters (3159:19848); my profile & security (3285:8292); notification settings (3285:8993); help (3285:9737); sign in (3285:10444); 2-step (3285:10466) |
| Inventory | 3175:18622 | stock list (3175:18624); item (3178:18648); order (3178:19145); receive delivery (3178:19642); stock count (3178:20139); notifs (3178:20636); issue (3198:19398); adjust (3198:20042); purchase orders (3198:20691); past counts (3198:21685); PO details (3199:19681); start count (3200:19691) |
| Tasks | 3182:18772 | board (3182:18774); details (3184:18798); new (3184:19208); maintenance schedule (3184:19618); notifs (3184:20028); another quote (3204:19548); mark done (3204:20127); repeating job (3204:20599); row menu (3204:21070); past jobs (3285:10491); pause job (3285:10923); delete job (3285:11352) |
| Roles & permissions | 3186:18897 | roles (3186:18899); staff access (3188:18923); front office perms (3188:19315); Ada's roles (3189:18973); give role (3189:19402); notifs (3189:19831); per-module "what it allows" (3192:19048 … 3192:23766); row menu (3195:19223); change level (3195:19679); managers-only (3195:20215); remove role (3196:19298); pause access (3196:19855); paused (3196:20431); temporary (3196:20909) |
| Hotel setup | 3208:19747 | 41 screens: stay rules (3208:19749); charges & payments (3208:20361); staff & shifts (3210:19798); money (3210:20412); stock & suppliers (3210:20942); rooms & areas (3210:33827); reasons & lists (3210:34311); taxes & currency (3214:20046); approval limits (3214:20433); restaurants & tables (3256:11392 …); front desk (3258:11823); staff sign-in & leave (3258:12850); housekeeping (3259:11523); laundry (3259:12777); maintenance (3260:11623); kitchen & bar (3260:12166); inventory rules (3289:8942); cash, banking & night audit (3289:9544); organizations & billing (3289:10129); guest feedback (3289:10659); WhatsApp (3297:8955); Payments & POS (3354:12095 … 3354:13812); Brand & colours (3378:9042 … 3378:10991) |
| Departments & activity log | 3292:8616 | all departments (3292:8618); one per department (3292:9418 … 3292:12140); activity log (3293:8842); entry (3293:9385); export (3293:9754) |
| Messaging | 3297:9476 | inbox (3297:9478); guest conversation (3297:10197); reassign (3297:10889); new message (3297:11117); staff on shift (3298:9042); team conversation (3298:9322); templates (3298:9600); notifs (3298:9903) |
| Reports | 3298:10182 | list (3298:10184); preview & download (3298:10536); schedule (3298:10804) |
| Payments | 3357:13116 | all payments (3357:13118); POS terminals (3357:13697); approve refund (3357:14199); disputes (3357:14500) |

Legacy loose frames (old design, ignore): Desktop - 17/18/26/31/138/139/168. Note boards: Design & UX rules (3134:29774), Build tracker (3202:19547), Setup coverage map (3290:8639).

## Staff apps (tablet 1180x820)

**Staff · Shared (3373:2)**, 18 screens, section 3201:19653: sign in (3219:20047); set PIN (3223:20047); wrong PIN (3223:20104); clock in (3223:20170); choose role (3219:20104); role switcher (3222:20048); my shifts (3219:20130); shift details (3222:20196); swap shift (3222:20364); ask for leave (3222:20545); clock out (3222:20725); alerts (3219:20259); message thread (3222:20895); notifications (3222:21470); me (3219:20367); change PIN (3222:21041); language (3222:21187); still there? (3222:21317).

**Front office (3373:124)**, 45 desktop screens at 1440x1221, section 3201:19689. Flows: Today (1.1 3228:20047); Bookings (2.1–2.10: 3225:21063, 3225:22300, 3225:21629, 3357:11875, 3225:24908, 3357:12549, 3225:25549, 3357:13040, 3357:13101, 3356:13181); Rooms (3225:20051, 3225:20505); Guest folio (4.1–4.6: 3225:26220, 3225:26688, 3225:27256, 3225:27724, 3270:10385, 3270:10906); Guests & messages (3228:20726, 3228:21325, 3225:28248); Till & handover (3229:20065, 3229:20655, 3229:20872, 3356:13658); Notifications (3229:21141, 3356:13853); Taking payment (8.1–8.12: 3355:11388, 3355:11894, 3355:12391, 3355:12872, 3355:13326, 3355:13802, 3355:14284, 3355:14754, 3355:15222, 3355:15697, 3355:16180, 3355:16657); My payments (3356:11575, 3356:12237, 3356:12471, 3356:12708, 3356:12944).

**Housekeeping (3373:814)**, 15 screens, section 3201:19760: my rooms (3238:14342); checklist (3238:14501); minibar (3238:15085); report problem (3238:14631); ask for linen (3238:14853); can't clean (3238:15286); lost & found (3240:14342); log found item (3240:14594); hand back (3240:14799); supervisor: assign rooms (3241:14341), rooms to inspect (3241:14592), inspect (3241:14696), send back (3241:14863), approve write-off (3278:9226); notifications (3241:15054).

**Laundry (3373:1167)**, 15 screens, section 3201:19817: jobs (3243:13987); new guest order (3243:14330); order details (3243:14125); found in pocket (3243:14730); mark delivered (3243:14550); take payment (3364:13165); linen in/out (3244:13987); count linen in (3244:14211); machine load (3244:14643); send clean linen (3244:14428); damaged linen (3244:14844); write off (3244:15041); notifications (3244:15194); my payments (3356:14438); verify (3364:13392).

**Maintenance (3373:1432)**, 13 screens, section 3201:19846: my repairs (3247:13987); repair details (3247:14121); add update (3247:14255); ask for parts (3247:14436); reassign (3247:14807); mark done (3247:14611); room out of order (3248:13987); back in service (3248:14186); scheduled jobs (3248:14362); do scheduled job (3248:14555); spare parts (3248:14721); use a part (3248:14924); notifications (3248:15090).

**Kitchen (3373:1762)**, 23 screens, section 3201:19882: orders board (3250:12362); start order (3253:11348); new order (3250:12700); item with choices (3253:11586); charge to room (3250:12839); can't charge (3250:13011); ticket (3250:12507); take payment (3364:12470); processing (3364:12685); menu & prices (3251:12362); sold out (3251:12578); change price (3251:12750); manage menu (3254:11348); add item (3254:11519); edit item (3254:11774); categories (3254:12034); approve price (3254:12300); kitchen store (3251:12915); ask the store (3251:13119); use or waste (3251:13301); notifications (3251:13468); my payments (3364:12826); verify (3364:13009).

**Bar (3373:2168)**, 27 screens, section 3201:19911: bar today (3262:11673); start sale (3262:11817); hotel guest sale (3266:10385); new sale (3262:12025); drink with choices (3262:12174); charge to room (3262:12364); take payment (3356:14102); processing (3356:14282); sale done (3262:12738); open tabs (3262:12915); tab details (3262:13019); move tab (3262:13168); menu & prices (3264:11673); sold out (3264:11841); change price (3264:12003); manage menu (3264:12169); add drink (3264:12369); happy hours (3264:12595); approve price (3278:9518); bar stock (3264:12805); ask the store (3264:12968); breakage (3264:13155); end-of-night count (3264:13329); close shift (3264:13465); notifications (3264:13654); my payments (3364:12093); verify (3364:12301).

**Inventory (3373:2570)**, 17 desktop + 1 tablet, section 3201:19940: stores & stock (3271:10386); item (3271:10963); add item (3272:10397); correct level (3271:11640); requests (3272:10936); request details (3272:11492); issue (3271:12373); purchase orders (3271:13097); new order (3271:13541); order details (3271:14212); receive delivery (3271:14738); count sheet tablet (3272:11744); count results (3271:15405); past counts (3271:15723); start count (3271:16079); suppliers (3272:11850); add supplier (3272:12409); notifications (3272:12663).

**Finance (3373:3090)**, 21 desktop screens, section 3201:19976: today's money (3275:8827); match payment (3275:9285); month at a glance (3274:8267); expenses (3276:8266); record expense (3274:8759); over limit (3275:9485); request status (3278:8266); answer question (3278:8585); tills (3275:9913); cash close (3275:8267); bank cash (3275:10381); night audit checklist (3274:9321); close day (3274:9625); audit report (3274:9973); past audits (3274:10265); organizations (3274:10606); org account (3274:11046); statement (3274:11423); invoice (3274:11791); record org payment (3275:10605); notifications (3275:10936).

## Platform admin (H.M.S) (3304:3841) — 77 screens

Sections: Sign in / Dashboard / Hotel businesses (3304:3908); Fees & billing, Marketers (3305:3841); Marketer portal, Support, Admin team, Settings (3306:3841); Phase 1 Businesses & hotels (3321:327); Phase 2 Back-office onboarding & handover (3328:661); Phase 3 Edit as H.M.S & governance (3334:1454); Payments (3345:7509). Base template frame `__admin base` (3304:3842).

## Style Guide (0:1)

Old design: colour swatches (11:128), legacy Desktop - N screens, Login (510:14395), First password (510:14432), Forgot password (510:14470), Task Management and Analytics & Reporting boards. Not part of the redesign.

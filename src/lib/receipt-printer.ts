export interface ReceiptItem {
	name: string;
	quantity: number;
	price: number;
	rate?: number;
	note?: string;
	itemType: "FOOD" | "DRINK";
}

export interface ReceiptData {
	hotelName: string;
	orderId?: string;
	destination: string;
	items: ReceiptItem[];
	total: number;
	note?: string;
	isPaid?: boolean;
	paymentMethod?: string;
	paymentReference?: string;
	guestBookingId?: string;
	printedAt: Date;
}

function formatAmount(amount: number): string {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 2,
	}).format(amount);
}

function formatDateTime(date: Date): string {
	return new Intl.DateTimeFormat("en-NG", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
}

function formatPaymentMethod(method?: string): string {
	if (!method) return "—";
	return method
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Opens a new popup window, writes receipt HTML into it, and triggers print. */
function openPrintWindow(html: string) {
	const win = window.open("", "_blank", "width=400,height=600,scrollbars=yes");
	if (!win) {
		alert(
			"Pop-up was blocked. Please allow pop-ups for this site to print receipts.",
		);
		return;
	}
	win.document.open();
	win.document.write(html);
	win.document.close();
	// Small delay to ensure fonts/styles are loaded before print dialog opens
	win.onload = () => {
		setTimeout(() => {
			win.focus();
			win.print();
		}, 200);
	};
}

/**
 * Shared base CSS for both receipt types.
 * Targets 80mm thermal paper (≈302px at 96dpi).
 */
function baseStyles(): string {
	return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        color: #000;
        background: #fff;
        width: 302px;
        padding: 8px;
      }
      .center { text-align: center; }
      .right  { text-align: right; }
      .bold   { font-weight: bold; }
      .divider { border-top: 1px dashed #000; margin: 6px 0; }
      .divider-solid { border-top: 1px solid #000; margin: 6px 0; }
      .hotel-name { font-size: 15px; font-weight: bold; letter-spacing: 1px; }
      .copy-label {
        font-size: 10px;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin: 2px 0 4px;
      }
      .meta { font-size: 11px; margin: 2px 0; }
      table { width: 100%; border-collapse: collapse; }
      th { font-size: 10px; text-align: left; border-bottom: 1px solid #000; padding-bottom: 3px; }
      th.right, td.right { text-align: right; }
      td { font-size: 11px; padding: 2px 0; vertical-align: top; }
      .item-note { font-size: 10px; color: #444; padding-left: 8px; }
      .total-row td { font-weight: bold; font-size: 13px; padding-top: 4px; }
      .status-paid {
        display: inline-block;
        border: 1px solid #000;
        padding: 1px 6px;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 1px;
      }
      .footer { font-size: 10px; margin-top: 8px; text-align: center; }
      @media print {
        @page { margin: 0; size: 80mm auto; }
        body { width: 100%; padding: 4px; }
      }
    </style>
  `;
}

/** Customer-facing receipt — shows prices, totals, and payment info. */
export function printCustomerReceipt(data: ReceiptData) {
	const itemRows = data.items
		.map((item) => {
			const effectivePrice = item.price * (item.rate ?? 1);
			const lineTotal = effectivePrice * item.quantity;
			const noteRow = item.note
				? `<tr><td colspan="3" class="item-note">↳ ${item.note}</td></tr>`
				: "";
			const discountLabel =
				item.rate && item.rate < 1
					? ` <span style="font-size:9px">(${Math.round(item.rate * 100)}%)</span>`
					: "";
			return `
        <tr>
          <td>${item.name}${discountLabel}</td>
          <td class="right">${item.quantity}</td>
          <td class="right">${formatAmount(lineTotal)}</td>
        </tr>
        ${noteRow}
      `;
		})
		.join("");

	const paymentSection = data.isPaid
		? `
      <tr><td colspan="3"><div class="divider"></div></td></tr>
      <tr><td colspan="2" class="bold">Payment</td><td class="right">${formatPaymentMethod(data.paymentMethod)}</td></tr>
      ${data.paymentReference ? `<tr><td colspan="2" style="font-size:10px">Ref:</td><td class="right" style="font-size:10px">${data.paymentReference}</td></tr>` : ""}
    `
		: `
      <tr><td colspan="3"><div class="divider"></div></td></tr>
      <tr><td colspan="3" style="font-size:10px;font-style:italic">Payment due on delivery / charged to room</td></tr>
    `;

	const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyles()}</head><body>
    <div class="center">
      <div class="hotel-name">${data.hotelName}</div>
      <div class="copy-label">Customer Receipt</div>
    </div>
    <div class="divider-solid"></div>
    <div class="meta">Date: ${formatDateTime(data.printedAt)}</div>
    ${data.orderId ? `<div class="meta">Order: <span class="bold">${data.orderId}</span></div>` : ""}
    <div class="meta">Destination: <span class="bold">${data.destination}</span></div>
    ${data.guestBookingId ? `<div class="meta">Booking: ${data.guestBookingId}</div>` : ""}
    <div class="divider"></div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="right">Qty</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr><td colspan="3"><div class="divider"></div></td></tr>
        <tr class="total-row">
          <td colspan="2">TOTAL</td>
          <td class="right">${formatAmount(data.total)}</td>
        </tr>
        ${paymentSection}
      </tbody>
    </table>
    ${data.note ? `<div class="divider"></div><div class="meta"><span class="bold">Note:</span> ${data.note}</div>` : ""}
    <div class="divider"></div>
    <div class="center">
      <span class="status-paid">${data.isPaid ? "✓ PAID" : "PENDING PAYMENT"}</span>
    </div>
    <div class="footer">
      <div>Thank you for your order!</div>
      <div>${data.hotelName} — Food &amp; Beverages</div>
    </div>
  </body></html>`;

	openPrintWindow(html);
}

/** Kitchen-facing order ticket — items and instructions only, no prices. */
export function printKitchenTicket(data: ReceiptData) {
	const itemRows = data.items
		.map((item) => {
			const noteRow = item.note
				? `<tr><td colspan="2" class="item-note">↳ ${item.note}</td></tr>`
				: "";
			const typeIcon = item.itemType === "FOOD" ? "🍽" : "🥤";
			return `
        <tr>
          <td>${typeIcon} ${item.name}</td>
          <td class="right bold" style="font-size:14px">${item.quantity}</td>
        </tr>
        ${noteRow}
      `;
		})
		.join("");

	const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyles()}</head><body>
    <div class="center">
      <div class="hotel-name">${data.hotelName}</div>
      <div class="copy-label">*** Kitchen Ticket ***</div>
    </div>
    <div class="divider-solid"></div>
    <div class="meta bold" style="font-size:13px">Destination: ${data.destination}</div>
    <div class="meta">Time: ${formatDateTime(data.printedAt)}</div>
    ${data.orderId ? `<div class="meta">Order Ref: <span class="bold">${data.orderId}</span></div>` : ""}
    <div class="divider-solid"></div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="right">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
    ${data.note ? `<div class="divider-solid"></div><div class="meta bold">⚠ Special Instructions:</div><div class="meta">${data.note}</div>` : ""}
    <div class="divider-solid"></div>
    <div class="center footer">— END OF ORDER —</div>
  </body></html>`;

	openPrintWindow(html);
}

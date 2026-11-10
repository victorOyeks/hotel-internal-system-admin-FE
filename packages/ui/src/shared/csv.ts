/** A spreadsheet cell: text or a number (money in naira, unformatted, so a spreadsheet can add it up). */
export type CsvCell = string | number | boolean | null | undefined;

const cell = (v: CsvCell) => {
	if (v === null || v === undefined) return "";
	const s = String(v);
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Rows (the first is the header) as CSV text. */
export function toCsv(rows: CsvCell[][]): string {
	return rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

/** A file name from words and the date: "Staff · Simpas Ikeja" → staff-simpas-ikeja-2026-11-10.csv. */
export function csvName(
	what: string,
	day = new Date().toISOString().slice(0, 10),
): string {
	const slug = what
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
	return `${slug || "export"}-${day}.csv`;
}

/** Download rows as a CSV the browser saves (with a BOM so Excel reads ₦ and accents). */
export function downloadCsv(filename: string, rows: CsvCell[][]) {
	const blob = new Blob([`﻿${toCsv(rows)}`], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

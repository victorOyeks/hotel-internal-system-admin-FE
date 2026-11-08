"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MessageCircleIcon, PlusIcon, UserIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { AvatarName, DetailList, Note } from "@/components/shared/detail-list";
import { TextareaField, TextField } from "@/components/shared/field";
import { fmtDay, fmtLongDate, naira, plural } from "@/components/shared/format";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import type { BookingRow, GuestRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { statusPill } from "./bookings";

/** Front office 5.1 · Guests directory + guest panel. */
export function GuestsScreen({ guests: initial, bookings }: { guests: GuestRow[]; bookings: BookingRow[] }) {
	const [guests, setGuests] = useState(initial);
	const [openId, setOpenId] = useQueryState("open");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [adding, setAdding] = useState(false);
	const [note, setNote] = useState("");
	const [form, setForm] = useState({ name: "", phone: "", email: "" });
	const { run, pending } = useDemoAction();
	const active = tab ?? "all";
	const inHouseIds = new Set(bookings.filter((b) => b.status === "CHECKED_IN").map((b) => b.guestId));
	const shown = guests.filter((g) => (active === "all" ? true : active === "in-house" ? inHouseIds.has(g.id) : active === "repeat" ? g.stays > 1 : g.blacklisted));
	const guest = guests.find((g) => g.id === openId) ?? null;
	const stays = guest ? bookings.filter((b) => b.guestId === guest.id) : [];

	const columns = useMemo<ColumnDef<GuestRow, unknown>[]>(
		() => [
			{ accessorKey: "fullName", header: "Guest", cell: ({ row }) => <AvatarName name={row.original.fullName} secondary={row.original.phone} size="sm" /> },
			{ accessorKey: "organizationName", header: "Company", cell: ({ row }) => row.original.organizationName ?? <span className="text-ink-3">—</span> },
			{ accessorKey: "stays", header: "Stays", cell: ({ row }) => <TwoLine primary={plural(row.original.stays, "stay")} secondary={row.original.lastStay ? `last ${fmtDay(row.original.lastStay)}` : "first time"} /> },
			{ accessorKey: "preferences", header: "Preferences", cell: ({ row }) => <span className="text-ink-2">{row.original.preferences ?? "—"}</span>, enableSorting: false },
			{ id: "status", header: "", enableSorting: false, cell: ({ row }) => (row.original.blacklisted ? <StatusPill tone="danger">Blacklisted</StatusPill> : inHouseIds.has(row.original.id) ? <StatusPill tone="success">In house</StatusPill> : row.original.stays > 3 ? <StatusPill tone="brand">Regular</StatusPill> : null) },
		],
		[inHouseIds],
	);

	return (
		<>
			<PageHeader title="Guests" subtitle={`${guests.length} guests on record · ${inHouseIds.size} in house now`}>
				<button type="button" className={btn.primary} onClick={() => setAdding(true)}><PlusIcon className="mr-1 inline size-4" /> Add guest</button>
			</PageHeader>
			<Toolbar left={<PillTabs value={active} onChange={(k) => void setTab(k === "all" ? null : k)} tabs={[{ key: "all", label: "All", count: guests.length }, { key: "in-house", label: "In house", count: inHouseIds.size }, { key: "repeat", label: "Repeat", count: guests.filter((g) => g.stays > 1).length }, { key: "blacklisted", label: "Blacklisted", count: guests.filter((g) => g.blacklisted).length }]} />} right={<SearchBox value={search} onChange={setSearch} placeholder="Name, phone, company…" />} />
			<DataTable columns={columns} data={shown} search={search} onRowClick={(g) => void setOpenId(g.id)} />

			<SidePanel open={!!guest} onOpenChange={(o) => !o && void setOpenId(null)} title={guest?.fullName ?? ""} subtitle={guest ? `${guest.phone}${guest.email ? ` · ${guest.email}` : ""}` : undefined} icon={UserIcon} width="lg" footer={guest && <><a href={`/dashboard/messages?open=${guest.id}`} className={btn.secondary}><MessageCircleIcon className="mr-1 inline size-4" /> Message</a><a href="/dashboard/bookings?new=1" className={btn.primary}>New booking</a></>} footerInfo={guest?.blacklisted ? <StatusPill tone="danger">Blacklisted</StatusPill> : guest && guest.stays > 3 ? <StatusPill tone="brand">Regular guest</StatusPill> : undefined}>
				{guest && (
					<div className="flex flex-col gap-6">
						{guest.blacklisted && <Note tone="danger">Blacklisted · {guest.notes}. A manager must approve any new booking.</Note>}
						<PanelSection title="Details">
							<DetailList columns={2} items={[{ label: "ID", value: guest.idType ? `${guest.idType} · ${guest.idNumber}` : "Not captured" }, { label: "Nationality", value: guest.nationality ?? "—" }, { label: "Company", value: guest.organizationName ?? "—" }, { label: "Stays", value: `${guest.stays} · last ${guest.lastStay ? fmtLongDate(guest.lastStay) : "never"}` }, { label: "Preferences", value: guest.preferences ?? "—" }, { label: "Notes", value: guest.notes ?? "—" }]} />
						</PanelSection>
						<PanelSection title="Add a note">
							<TextareaField label="" value={note} onChange={setNote} rows={2} placeholder="Allergies, likes a quiet room…" />
							<button type="button" className={`${btn.secondary} self-start`} disabled={!note || pending} onClick={() => void run("Note saved", () => { setGuests((xs) => xs.map((g) => (g.id === guest.id ? { ...g, notes: [g.notes, note].filter(Boolean).join(" · ") } : g))); setNote(""); })}>Save note</button>
						</PanelSection>
						<PanelSection title={`Stays (${stays.length})`}>
							{stays.length === 0 ? <p className="text-[13px] text-ink-3">No bookings on record.</p> : (
								<ul className="divide-y divide-line">
									{stays.map((b) => (
										<li key={b.id} className="flex items-center gap-3 py-2">
											<div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{fmtLongDate(b.checkInDate)} → {fmtLongDate(b.checkOutDate)}</p><p className="text-xs text-ink-3">{b.roomNumber ?? b.roomTypeName} · {plural(b.nights, "night")} · {naira(b.totalAmount)}</p></div>
											{statusPill(b)}
											<a href={`/dashboard/bookings?open=${b.id}&tab=all`} className="text-[13px] font-semibold text-brand">Open</a>
										</li>
									))}
								</ul>
							)}
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<SidePanel open={adding} onOpenChange={setAdding} title="Add a guest" subtitle="Without a booking · for walk-ins and companies" icon={PlusIcon} footer={<><button type="button" className={btn.secondary} onClick={() => setAdding(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!form.name || !form.phone || pending} onClick={() => void run("Guest added", () => { setGuests((xs) => [{ id: `g-${Date.now()}`, fullName: form.name, phone: form.phone, email: form.email || undefined, stays: 0, blacklisted: false }, ...xs]); setForm({ name: "", phone: "", email: "" }); setAdding(false); })}>Save guest</button></>}>
				<div className="flex flex-col gap-4">
					<TextField label="Full name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
					<TextField label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} required placeholder="+234 …" />
					<TextField label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
				</div>
			</SidePanel>
		</>
	);
}

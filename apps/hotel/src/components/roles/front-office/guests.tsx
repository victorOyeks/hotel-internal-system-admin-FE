"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MessageCircleIcon, PlusIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import type { PageResult } from "@hospio/api/data/paging";
import { useListParams } from "@hospio/ui/shared/list-params";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName, DetailList, Note } from "@hospio/ui/shared/detail-list";
import { TextareaField, TextField } from "@hospio/ui/shared/field";
import { fmtDay, fmtLongDate, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { BookingRow, GuestRow } from "@hospio/api/data/types";
import { saveGuest } from "@hospio/api/actions/reservation";
import { useAction } from "@hospio/api/actions/use-action";
import { statusPill } from "./bookings";

/**
 * Front office 5.1 · Guests directory + guest panel. The directory is one page from reservation-service (business-wide,
 * newest first; `?tab=`, `?q=`, `?page=` in the URL) with the tab counts over every guest; the open guest's stays come
 * with the page.
 */
export function GuestsScreen({ guests: result, opened, stays: openStays }: { guests: PageResult<GuestRow>; opened?: GuestRow | null; stays: BookingRow[] }) {
	const router = useRouter();
	const list = useListParams({ extra: ["tab"] });
	const [guests, setGuests] = useState(result.data.content);
	useEffect(() => setGuests(result.data.content), [result]);
	const [openId, setOpenId] = useQueryState("open", { shallow: false });
	const tab = list.params.tab;
	const [adding, setAdding] = useState(false);
	const [note, setNote] = useState("");
	const [form, setForm] = useState({ name: "", phone: "", email: "" });
	const { run, pending } = useAction();
	const active = tab ?? "all";
	const counts = result.data.counts ?? {};
	const inHouseIds = new Set(guests.filter((g) => g.inHouse).map((g) => g.id));
	const guest = guests.find((g) => g.id === openId) ?? (opened && opened.id === openId ? opened : null);
	const stays = guest ? openStays.filter((b) => b.guestId === guest.id) : [];

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
			<PageHeader title="Guests" subtitle={`${counts.all ?? result.data.total} guests on record · ${counts["in-house"] ?? 0} in house now`}>
				<button type="button" className={btn.primary} onClick={() => setAdding(true)}><PlusIcon className="mr-1 inline size-4" /> Add guest</button>
			</PageHeader>
			<Toolbar left={<PillTabs value={active} onChange={(k) => list.set({ tab: k === "all" ? null : k })} tabs={[{ key: "all", label: "All", count: counts.all ?? 0 }, { key: "in-house", label: "In house", count: counts["in-house"] ?? 0 }, { key: "repeat", label: "Repeat", count: counts.repeat ?? 0 }, { key: "blacklisted", label: "Blacklisted", count: counts.blacklisted ?? 0 }]} />} right={<SearchBox value={list.search} onChange={list.setSearch} placeholder="Name, phone or email…" />} />
			<DataTable columns={columns} data={guests} server={{ page: result.data, onPage: list.goTo, sort: list.sort, onSort: list.setSort, sortKeys: { fullName: "fullName", stays: "stays" } }} filtered={!!list.params.q} onClearFilters={() => { list.setSearch(""); list.set({ q: null }); }} error={result.ok ? null : result.error} onRetry={() => router.refresh()} emptyTitle="No guests here yet" onRowClick={(g) => void setOpenId(g.id)} />

			<SidePanel open={!!guest} onOpenChange={(o) => !o && void setOpenId(null)} title={guest?.fullName ?? ""} subtitle={guest ? `${guest.phone}${guest.email ? ` · ${guest.email}` : ""}` : undefined} icon={UserIcon} width="lg" footer={guest && <><a href={`/dashboard/messages?open=${guest.id}`} className={btn.secondary}><MessageCircleIcon className="mr-1 inline size-4" /> Message</a><a href="/dashboard/bookings?new=1" className={btn.primary}>New booking</a></>} footerInfo={guest?.blacklisted ? <StatusPill tone="danger">Blacklisted</StatusPill> : guest && guest.stays > 3 ? <StatusPill tone="brand">Regular guest</StatusPill> : undefined}>
				{guest && (
					<div className="flex flex-col gap-6">
						{guest.blacklisted && <Note tone="danger">Blacklisted · {guest.notes}. A manager must approve any new booking.</Note>}
						<PanelSection title="Details">
							<DetailList columns={2} items={[{ label: "ID", value: guest.idType ? `${guest.idType} · ${guest.idNumber}` : "Not captured" }, { label: "Nationality", value: guest.nationality ?? "—" }, { label: "Company", value: guest.organizationName ?? "—" }, { label: "Stays", value: `${guest.stays} · last ${guest.lastStay ? fmtLongDate(guest.lastStay) : "never"}` }, { label: "Preferences", value: guest.preferences ?? "—" }, { label: "Notes", value: guest.notes ?? "—" }]} />
						</PanelSection>
						<PanelSection title="Add a note">
							<TextareaField label="" value={note} onChange={setNote} rows={2} placeholder="Allergies, likes a quiet room…" />
							<button type="button" className={`${btn.secondary} self-start`} disabled={!note || pending} onClick={() => { const notes = [guest.notes, note].filter(Boolean).join(" · "); void run(() => saveGuest({ fullName: guest.fullName, phone: guest.phone, email: guest.email, idType: guest.idType, idNumber: guest.idNumber, nationality: guest.nationality, preferences: guest.preferences, notes }, guest.id, { ...guest, notes }), "Note saved", (saved) => { setGuests((xs) => xs.map((g) => (g.id === guest.id ? { ...g, ...saved } : g))); setNote(""); }); }}>Save note</button>
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

			<SidePanel open={adding} onOpenChange={setAdding} title="Add a guest" subtitle="Without a booking · for walk-ins and companies" icon={PlusIcon} footer={<><button type="button" className={btn.secondary} onClick={() => setAdding(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!form.name || !form.phone || pending} onClick={() => void run(() => saveGuest({ fullName: form.name, phone: form.phone, email: form.email || undefined }, undefined, { id: `g-${Date.now()}`, fullName: form.name, phone: form.phone, email: form.email || undefined, stays: 0, blacklisted: false }), "Guest added", (saved) => { setGuests((xs) => [saved, ...xs]); setForm({ name: "", phone: "", email: "" }); setAdding(false); router.refresh(); })}>Save guest</button></>}>
				<div className="flex flex-col gap-4">
					<TextField label="Full name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
					<TextField label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} required placeholder="+234 …" />
					<TextField label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
				</div>
			</SidePanel>
		</>
	);
}

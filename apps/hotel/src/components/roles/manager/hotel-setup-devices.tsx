"use client";

import { PencilIcon, TabletSmartphoneIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	changeDevice,
	listDevices,
	revokeDevice,
} from "@hospio/api/actions/devices";
import { useAction } from "@hospio/api/actions/use-action";
import type { SharedDevice } from "@hospio/api/api/routes-devices";
import { isHotelRole, roleLabels } from "@hospio/api/roles";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtWhen } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";

const roleText = (roles: string[]) =>
	roles.map((r) => (isHotelRole(r) ? roleLabels[r] : r)).join(", ");
const MINUTES = ["1", "2", "5", "10", "15", "30", "60"];

/**
 * Manager · Hotel setup · Shared devices (docs/shared-devices.md in hospio-backend): every tablet set up at this hotel with
 * the desk it is for, when and by whom it was last unlocked, and its auto-lock. Rename, change the auto-lock, or remove it;
 * a removed device goes to the normal sign-in page at its next request. Devices are set up from the device itself.
 */
export function SharedDevicesSection({ hotelId }: { hotelId?: string }) {
	const [devices, setDevices] = useState<SharedDevice[] | null>(null);
	const [edit, setEdit] = useState<{
		device: SharedDevice;
		name: string;
		minutes: string;
	} | null>(null);
	const [remove, setRemove] = useState<SharedDevice | null>(null);
	const { run, pending } = useAction();

	const load = useCallback(() => {
		listDevices(hotelId)
			.then(setDevices)
			.catch(() => setDevices([]));
	}, [hotelId]);
	useEffect(load, [load]);

	return (
		<section className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-card p-5">
			<div>
				<h2 className="text-base font-bold text-ink">Shared devices</h2>
				<p className="text-[13px] text-ink-3">
					Tablets at the desks where staff switch in with their PIN. Everything
					is recorded under the person who unlocked.
				</p>
			</div>
			{devices === null ? (
				<p className="text-[13px] text-ink-3">Loading…</p>
			) : devices.length === 0 ? (
				<Note tone="info">
					No shared devices yet. On the tablet, sign in as a manager (or with
					Full access), open the menu under your name and choose "Use this
					device as a shared device".
				</Note>
			) : (
				<div className="overflow-x-auto rounded-xl border border-line">
					<table className="w-full min-w-[640px] text-left">
						<thead>
							<tr className={tableHead}>
								<th className="px-4 py-3">Device</th>
								<th className="px-4 py-3">Desk</th>
								<th className="px-4 py-3">Last used</th>
								<th className="px-4 py-3">Last person</th>
								<th className="px-4 py-3">Auto-lock</th>
								<th className="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{devices.map((d) => (
								<tr key={d.id} className={tableRow}>
									<td className={cell}>
										<span className="flex items-center gap-2 font-semibold">
											<TabletSmartphoneIcon className="size-4 text-ink-3" />{" "}
											{d.name}
										</span>
										{d.createdByName && (
											<span className="text-xs text-ink-3">
												Set up by {d.createdByName}
											</span>
										)}
									</td>
									<td className={cell}>{roleText(d.roles)}</td>
									<td className={cell}>
										{d.lastUsedAt ? fmtWhen(d.lastUsedAt) : "Not yet"}
									</td>
									<td className={cell}>{d.lastUserName ?? "—"}</td>
									<td className={cell}>{d.autoLockMinutes} min</td>
									<td className={`${cell} text-right`}>
										<span className="inline-flex gap-2">
											<button
												type="button"
												className={btn.icon}
												aria-label={`Edit ${d.name}`}
												onClick={() =>
													setEdit({
														device: d,
														name: d.name,
														minutes: String(d.autoLockMinutes),
													})
												}
											>
												<PencilIcon className="size-4" />
											</button>
											<button
												type="button"
												className={`${btn.icon} text-danger`}
												aria-label={`Remove ${d.name}`}
												onClick={() => setRemove(d)}
											>
												<Trash2Icon className="size-4" />
											</button>
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<Modal
				open={!!edit}
				onOpenChange={(o) => !o && setEdit(null)}
				title={edit ? `Edit ${edit.device.name}` : "Edit device"}
				subtitle="The new auto-lock applies from the device's next page"
				icon={TabletSmartphoneIcon}
				size="form"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setEdit(null)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pending || !edit || edit.name.trim().length < 2}
							onClick={() =>
								edit &&
								run(
									() =>
										changeDevice(
											edit.device.id,
											{
												name: edit.name.trim(),
												autoLockMinutes: Number(edit.minutes),
											},
											hotelId,
										),
									"Device saved",
									(saved) => {
										setDevices(
											(all) =>
												all?.map((x) => (x.id === saved.id ? saved : x)) ??
												null,
										);
										setEdit(null);
									},
								)
							}
						>
							Save
						</Button>
					</>
				}
			>
				{edit && (
					<div className="flex flex-col gap-4">
						<TextField
							label="Name"
							value={edit.name}
							onChange={(v) => setEdit({ ...edit, name: v })}
						/>
						<SelectField
							label="Lock after"
							value={edit.minutes}
							onChange={(v) => setEdit({ ...edit, minutes: v })}
							options={MINUTES.map((m) => ({
								value: m,
								label: `${m} ${m === "1" ? "minute" : "minutes"} without use`,
							}))}
						/>
					</div>
				)}
			</Modal>

			<ConfirmModal
				open={!!remove}
				onOpenChange={(o) => !o && setRemove(null)}
				title={remove ? `Remove ${remove.name}?` : "Remove device"}
				subtitle="Whoever is using it is signed out, and it shows the normal sign-in page"
				tone="danger"
				confirmLabel="Remove device"
				pending={pending}
				onConfirm={() =>
					remove &&
					run(
						() => revokeDevice(remove.id, hotelId),
						`${remove.name} removed`,
						() => {
							setDevices(
								(all) => all?.filter((x) => x.id !== remove.id) ?? null,
							);
							setRemove(null);
						},
					)
				}
			>
				<p className="text-[13px] text-ink-2">
					To use it as a shared device again, a manager signs in on it and sets
					it up again.
				</p>
			</ConfirmModal>
		</section>
	);
}

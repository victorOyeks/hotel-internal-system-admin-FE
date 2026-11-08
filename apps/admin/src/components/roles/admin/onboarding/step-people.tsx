"use client";

import { ClipboardPasteIcon, UserPlusIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { createUser, resendInvite } from "@hospio/api/actions/identity";
import type { PortalUserRow } from "@hospio/api/data/types";
import { type HotelRole, isHotelRole, roleLabels } from "@hospio/api/roles";
import type { OnboardingLogin } from "@hospio/api/types";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	FieldRow,
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import { fmtAgo } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import type { WizardCtx } from "./wizard";
import {
	inviteLink,
	nextStep,
	parseRows,
	prevStep,
	ResultLine,
	StepFrame,
	useWizardSave,
	type WizardHotel,
} from "./shared";

/**
 * J9/J10 · step 7: the business's logins. "Add a person" creates the user on identity with `businessId`
 * and `hotelId`; the temporary password and invite token come back once and are kept in the draft
 * (`people.logins`) for the handover pack, so the draft is saved right after every creation.
 */

export const PEOPLE_ROLES: HotelRole[] = [
	"MANAGER",
	"FRONT_OFFICE",
	"HOUSEKEEPING",
	"LAUNDRY",
	"MAINTENANCE",
	"KITCHEN",
	"BAR",
	"FINANCE",
	"INVENTORY",
];

type LoginRow = OnboardingLogin & {
	fromDirectory?: boolean;
	status?: PortalUserRow["status"];
	inviteStatus?: PortalUserRow["inviteStatus"];
	lastSignIn?: string;
};

/** Logins kept in the draft, then anyone else identity lists for the business (owner included). */
function mergeLogins(
	logins: OnboardingLogin[],
	users: PortalUserRow[],
	hotels: WizardHotel[],
): LoginRow[] {
	const names = new Map(hotels.map((h) => [h.id, h.name]));
	const byId = new Map(users.map((u) => [u.userId, u]));
	const rows: LoginRow[] = logins.map((l) => {
		const u = byId.get(l.userId);
		return {
			...l,
			hotelName: l.hotelName ?? (l.hotelId ? names.get(l.hotelId) : undefined),
			status: u?.status,
			inviteStatus: u?.inviteStatus,
			lastSignIn: u?.lastSignIn,
		};
	});
	const known = new Set(logins.map((l) => l.userId));
	for (const u of users) {
		if (known.has(u.userId)) continue;
		rows.push({
			userId: u.userId,
			fullName: u.fullName,
			email: u.email,
			role: u.role,
			hotelId: u.hotelIds[0],
			hotelName: u.hotel,
			fromDirectory: true,
			status: u.status,
			inviteStatus: u.inviteStatus,
			lastSignIn: u.lastSignIn,
		});
	}
	return rows;
}

const roleOf = (value: string): HotelRole | null => {
	const key = value
		.trim()
		.toUpperCase()
		.replace(/[\s-]+/g, "_");
	if (isHotelRole(key) && PEOPLE_ROLES.includes(key)) return key;
	const byLabel = PEOPLE_ROLES.find(
		(r) => roleLabels[r].toLowerCase() === value.trim().toLowerCase(),
	);
	return byLabel ?? null;
};

export function PeopleStep({ ctx }: { ctx: WizardCtx }) {
	const { business, hotels, users, data } = ctx;
	const [logins, setLogins] = useState<OnboardingLogin[]>(
		data.people?.logins ?? [],
	);
	// The latest list, for saves that run back to back (the paste import) before React re-renders.
	const loginsRef = useRef(logins);
	loginsRef.current = logins;
	const [panel, setPanel] = useState<"add" | "import" | null>(null);
	const [lastResult, setLastResult] = useState<string | null>(null);
	const { pending, call, busy } = useWizardSave();
	const rows = mergeLogins(logins, users, hotels);
	const managers = rows.filter((r) => r.role === "MANAGER").length;

	const persist = async (next: OnboardingLogin[]): Promise<boolean> => {
		loginsRef.current = next;
		setLogins(next);
		return (await ctx.saveStep("people", { logins: next })) !== null;
	};

	const addPerson = async (input: {
		fullName: string;
		email: string;
		phone: string;
		role: HotelRole;
		hotelId: string;
	}): Promise<boolean> => {
		const created = await call(() =>
			createUser({
				fullName: input.fullName,
				email: input.email,
				phone: input.phone || null,
				role: input.role,
				level: "FULL",
				hotelId: input.hotelId,
				businessId: business.id,
			}),
		);
		if (!created) return false;
		const login: OnboardingLogin = {
			userId: created.userId,
			fullName: input.fullName,
			email: input.email,
			role: input.role,
			hotelId: input.hotelId,
			hotelName: hotels.find((h) => h.id === input.hotelId)?.name,
			temporaryPassword: created.temporaryPassword ?? undefined,
			temporaryPasswordExpiresAt:
				created.temporaryPasswordExpiresAt ?? undefined,
			inviteToken: created.inviteToken ?? undefined,
			inviteExpiresAt: created.inviteExpiresAt ?? undefined,
		};
		ctx.setUsers((list) => [
			...list,
			{
				id: created.userId,
				userId: created.userId,
				businessId: business.id,
				fullName: input.fullName,
				email: input.email,
				phone: input.phone,
				role: input.role,
				level: "FULL",
				hotels: [login.hotelName ?? "Hotel"],
				hotelIds: [input.hotelId],
				hotel: login.hotelName,
				grants: [
					{
						id: `${created.userId}-g0`,
						role: input.role,
						level: "FULL",
						hotelId: input.hotelId,
						hotelName: login.hotelName,
						paused: false,
					},
				],
				status: "INVITED",
				inviteStatus: "PENDING",
				mustChangePassword: true,
				twoStep: false,
			},
		]);
		return persist([...loginsRef.current, login]);
	};

	const resend = (row: LoginRow) =>
		busy(async () => {
			const fresh = await call(
				() => resendInvite(row.userId, business.id),
				`New invite for ${row.fullName}`,
			);
			if (!fresh) return;
			const current = loginsRef.current;
			const next = current.some((l) => l.userId === row.userId)
				? current.map((l) =>
						l.userId === row.userId
							? {
									...l,
									temporaryPassword:
										fresh.temporaryPassword ?? l.temporaryPassword,
									temporaryPasswordExpiresAt:
										fresh.temporaryPasswordExpiresAt ?? undefined,
									inviteToken: fresh.inviteToken ?? l.inviteToken,
									inviteExpiresAt: fresh.inviteExpiresAt ?? undefined,
								}
							: l,
					)
				: [
						...current,
						{
							userId: row.userId,
							fullName: row.fullName,
							email: row.email,
							role: row.role,
							hotelId: row.hotelId,
							hotelName: row.hotelName,
							temporaryPassword: fresh.temporaryPassword ?? undefined,
							temporaryPasswordExpiresAt:
								fresh.temporaryPasswordExpiresAt ?? undefined,
							inviteToken: fresh.inviteToken ?? undefined,
							inviteExpiresAt: fresh.inviteExpiresAt ?? undefined,
						},
					];
			await persist(next);
		});

	const copy = (text: string | undefined, what: string) => {
		if (!text) {
			toast.error(`No ${what} to copy. Resend the invite for a fresh one`);
			return;
		}
		navigator.clipboard
			?.writeText(text)
			.then(() =>
				toast.success(`${what[0].toUpperCase()}${what.slice(1)} copied`),
			)
			.catch(() => toast.error("Could not copy"));
	};

	const save = () =>
		busy(async () => {
			const row = await ctx.saveStep("people", { logins });
			if (row) ctx.goTo(nextStep("people"));
		});

	return (
		<StepFrame
			step="people"
			onBack={() => ctx.goTo(prevStep("people"))}
			onContinue={ctx.editable ? save : undefined}
			pending={pending}
			footerNote={
				managers === 0
					? "Add at least one manager before go-live; the checklist looks for one."
					: `${rows.length} ${rows.length === 1 ? "person" : "people"} · ${managers} ${managers === 1 ? "manager" : "managers"}`
			}
		>
			<Note tone="warning">
				Temporary passwords are shown here and in the handover pack only. They
				expire in 72 hours; the invite link works for 7 days.
			</Note>
			<DataTable
				data={rows}
				columns={[
					{
						accessorKey: "fullName",
						header: "Name",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.fullName}
								secondary={row.original.email}
							/>
						),
					},
					{
						accessorKey: "hotelName",
						header: "Hotel",
						cell: ({ row }) =>
							row.original.hotelName ??
							(row.original.role === "OWNER" ? "All hotels" : "—"),
					},
					{
						accessorKey: "role",
						header: "Role",
						cell: ({ row }) =>
							isHotelRole(row.original.role)
								? roleLabels[row.original.role]
								: row.original.role,
					},
					{
						id: "password",
						header: "Temporary password",
						cell: ({ row }) =>
							row.original.temporaryPassword ? (
								<span className="font-mono text-[13px] font-semibold text-brand">
									{row.original.temporaryPassword}
								</span>
							) : (
								<span className="text-xs text-ink-3">
									{row.original.fromDirectory ? "Made before this step" : "—"}
								</span>
							),
					},
					{
						id: "status",
						header: "Status",
						cell: ({ row }) => {
							const s = row.original.status;
							const inv = row.original.inviteStatus;
							if (!s) return <StatusPill tone="info">invited</StatusPill>;
							if (s === "ACTIVE")
								return (
									<StatusPill tone="success">
										{row.original.lastSignIn
											? `signed in ${fmtAgo(row.original.lastSignIn)}`
											: "active"}
									</StatusPill>
								);
							if (s === "INVITED")
								return (
									<StatusPill tone={inv === "EXPIRED" ? "warning" : "info"}>
										{inv === "EXPIRED" ? "invite expired" : "invited"}
									</StatusPill>
								);
							return <StatusPill tone="grey">{s.toLowerCase()}</StatusPill>;
						},
					},
					{
						id: "actions",
						header: "",
						cell: ({ row }) =>
							ctx.editable ? (
								<RowActions
									actions={[
										{
											label: "Copy password",
											onClick: () =>
												copy(row.original.temporaryPassword, "password"),
											disabled: !row.original.temporaryPassword,
										},
										{
											label: "Copy invite link",
											onClick: () =>
												copy(
													row.original.inviteToken
														? inviteLink(row.original.inviteToken)
														: undefined,
													"invite link",
												),
											disabled: !row.original.inviteToken,
										},
										{
											label: "Resend invite",
											separatorBefore: true,
											onClick: () => resend(row.original),
											disabled: row.original.status === "ACTIVE",
										},
									]}
								/>
							) : null,
					},
				]}
				emptyTitle="Nobody yet"
				emptyHint="Add the general manager first; staff can follow."
			/>
			{ctx.editable && (
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => setPanel("add")}
						disabled={hotels.length === 0}
					>
						<UserPlusIcon className="size-4" /> Add a person
					</button>
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => setPanel("import")}
						disabled={hotels.length === 0}
					>
						<ClipboardPasteIcon className="size-4" /> Paste a staff list
					</button>
					{hotels.length === 0 && (
						<span className="text-xs text-ink-3">
							Add a hotel first; every role except the owner belongs to one.
						</span>
					)}
				</div>
			)}
			{lastResult && <ResultLine>{lastResult}</ResultLine>}

			<AddPersonPanel
				open={panel === "add"}
				onOpenChange={(o) => setPanel(o ? "add" : null)}
				hotels={hotels}
				onAdd={addPerson}
			/>
			<ImportPeopleModal
				open={panel === "import"}
				onOpenChange={(o) => setPanel(o ? "import" : null)}
				hotels={hotels}
				pending={pending}
				onImport={(people) =>
					busy(async () => {
						let made = 0;
						const failed: string[] = [];
						for (const p of people) {
							const ok = await addPerson(p);
							if (ok) made += 1;
							else failed.push(p.fullName);
						}
						setLastResult(
							`${made} of ${people.length} people added${failed.length ? ` · not added: ${failed.join(", ")}` : ""}`,
						);
						setPanel(null);
					})
				}
			/>
		</StepFrame>
	);
}

/** One person: name, email, phone, role, hotel. */
function AddPersonPanel({
	open,
	onOpenChange,
	hotels,
	onAdd,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	hotels: WizardHotel[];
	onAdd: (p: {
		fullName: string;
		email: string;
		phone: string;
		role: HotelRole;
		hotelId: string;
	}) => Promise<boolean>;
}) {
	const [fullName, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [role, setRole] = useState<string>("MANAGER");
	const [hotelId, setHotelId] = useState(hotels[0]?.id ?? "");
	const { pending, busy } = useWizardSave();
	const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
	const valid =
		fullName.trim().length > 1 &&
		emailOk &&
		isHotelRole(role) &&
		(hotelId || hotels[0]?.id);
	const reset = () => {
		setName("");
		setEmail("");
		setPhone("");
	};
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title="Add a person"
			subtitle="They get a temporary password and an invite link to set their own"
			icon={UserPlusIcon}
			width="md"
			footerInfo="Managers run a hotel; every other role is one department."
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!valid || pending}
						onClick={() =>
							busy(async () => {
								if (!isHotelRole(role)) return;
								const ok = await onAdd({
									fullName: fullName.trim(),
									email: email.trim().toLowerCase(),
									phone: phone.trim(),
									role,
									hotelId: hotelId || hotels[0].id,
								});
								if (ok) {
									toast.success(`${fullName.trim()} added`);
									reset();
									onOpenChange(false);
								}
							})
						}
					>
						Add person
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<PanelSection title="Person">
					<TextField
						label="Full name"
						value={fullName}
						onChange={setName}
						placeholder="Grace Okafor"
						required
					/>
					<FieldRow>
						<TextField
							label="Email"
							type="email"
							value={email}
							onChange={setEmail}
							placeholder="grace@abujapalms.ng"
							required
							error={
								email && !emailOk
									? "That does not look like an email"
									: undefined
							}
						/>
						<TextField
							label="Phone"
							value={phone}
							onChange={setPhone}
							placeholder="+234 …"
						/>
					</FieldRow>
				</PanelSection>
				<PanelSection title="Access">
					<FieldRow>
						<SelectField
							label="Role"
							value={role}
							onChange={setRole}
							options={PEOPLE_ROLES.map((r) => ({
								value: r,
								label: roleLabels[r],
							}))}
							required
						/>
						<SelectField
							label="Hotel"
							value={hotelId || hotels[0]?.id || ""}
							onChange={setHotelId}
							options={hotels.map((h) => ({ value: h.id, label: h.name }))}
							required
						/>
					</FieldRow>
				</PanelSection>
			</div>
		</SidePanel>
	);
}

/** J10 · paste `name, email, phone, role, hotel` per line. The hotel is matched by name; the role by key or label. */
function ImportPeopleModal({
	open,
	onOpenChange,
	hotels,
	pending,
	onImport,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	hotels: WizardHotel[];
	pending: boolean;
	onImport: (
		people: {
			fullName: string;
			email: string;
			phone: string;
			role: HotelRole;
			hotelId: string;
		}[],
	) => void;
}) {
	const [text, setText] = useState("");
	const parsed = parseRows(text, [
		"name",
		"email",
		"phone",
		"role",
		"hotel",
	]).map((c) => {
		const role = roleOf(c[3] ?? "");
		const hotel =
			hotels.find(
				(h) => h.name.toLowerCase() === (c[4] ?? "").trim().toLowerCase(),
			) ?? (hotels.length === 1 ? hotels[0] : undefined);
		return {
			fullName: c[0] ?? "",
			email: (c[1] ?? "").toLowerCase(),
			phone: c[2] ?? "",
			role,
			hotelId: hotel?.id ?? "",
			problem: !c[0]
				? "no name"
				: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c[1] ?? "")
					? "bad email"
					: !role
						? `unknown role "${c[3] ?? ""}"`
						: !hotel
							? `unknown hotel "${c[4] ?? ""}"`
							: null,
		};
	});
	const good = parsed.filter(
		(p): p is typeof p & { role: HotelRole } =>
			p.problem === null && p.role !== null,
	);
	const bad = parsed.filter((p) => p.problem !== null);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Paste a staff list"
			subtitle="One person per line: name, email, phone, role, hotel"
			icon={ClipboardPasteIcon}
			size="form"
			footerInfo={
				parsed.length > 0
					? `${good.length} ready${bad.length ? ` · ${bad.length} with problems (skipped)` : ""}`
					: `Roles: ${PEOPLE_ROLES.map((r) => roleLabels[r]).join(", ")}`
			}
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={pending || good.length === 0}
						onClick={() =>
							onImport(
								good.map(({ fullName, email, phone, role, hotelId }) => ({
									fullName,
									email,
									phone,
									role,
									hotelId,
								})),
							)
						}
					>
						Add {good.length || ""} people
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-3">
				<TextareaField
					label="People"
					value={text}
					onChange={setText}
					rows={8}
					placeholder={`Grace Okafor, grace@abujapalms.ng, +2348030000000, Manager, ${hotels[0]?.name ?? "Abuja Palms Wuse"}\nEmeka Nwosu, emeka@abujapalms.ng, , Front office, ${hotels[0]?.name ?? "Abuja Palms Wuse"}`}
					hint="Commas or tabs. The hotel column can be left out when there is only one hotel."
				/>
				{bad.length > 0 && (
					<Note tone="warning">
						Skipped:{" "}
						{bad
							.slice(0, 5)
							.map((p) => `${p.fullName || p.email || "a line"} (${p.problem})`)
							.join("; ")}
						{bad.length > 5 ? ` and ${bad.length - 5} more` : ""}
					</Note>
				)}
				<Note tone="info">
					Each person is created one by one; a duplicate email is reported and
					the rest continue.
				</Note>
			</div>
		</Modal>
	);
}

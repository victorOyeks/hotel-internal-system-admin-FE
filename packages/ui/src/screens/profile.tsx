"use client";

import {
	CameraIcon,
	CopyIcon,
	DownloadIcon,
	KeyRoundIcon,
	LogOutIcon,
	MonitorSmartphoneIcon,
	ShieldCheckIcon,
	TabletIcon,
	Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@hospio/ui/primitives/button";
import { Switch } from "@hospio/ui/primitives/switch";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtAgo, fmtWhen, initials } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PinSection } from "@hospio/ui/shared/shared-device";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import {
	changePassword,
	disableTwoStep,
	enableTwoStep,
	endSession,
	newRecoveryCodes,
	removePhoto,
	saveEmailPrefs,
	signOutOthers,
	startTwoStep,
	updateProfile,
} from "@hospio/api/actions";
import { useAction } from "@hospio/api/actions/use-action";
import type { Me } from "@hospio/api/api/schema";
import {
	EMAIL_CATEGORIES,
	type EmailPrefs,
	LANGUAGES,
	MAX_PHOTO_BYTES,
	type ProfileSession,
	photoUrl,
	type TwoStepState,
} from "@hospio/api/profile-options";
import { type HotelRole, isHotelRole, roleLabels } from "@hospio/api/roles";

type Setup = { secret: string; otpauthUri: string; qrSvg: string };

function svgSrc(svg: string) {
	return `data:image/svg+xml;base64,${typeof window === "undefined" ? "" : window.btoa(svg)}`;
}

function downloadCodes(codes: string[], email: string) {
	const text = `Hospio360 recovery codes for ${email}\nEach works once. Keep them somewhere safe.\n\n${codes.join("\n")}\n`;
	const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
	const a = document.createElement("a");
	a.href = url;
	a.download = "hospio360-recovery-codes.txt";
	a.click();
	URL.revokeObjectURL(url);
}

function CodesList({ codes, email }: { codes: string[]; email: string }) {
	return (
		<div className="flex flex-col gap-3">
			<Note tone="warning">
				Shown once. Each code signs you in one time if you lose your phone. Save
				them now.
			</Note>
			<div
				className="grid grid-cols-2 gap-2 rounded-xl bg-subtle p-4 font-mono text-[13px] text-ink"
				data-testid="recovery-codes"
			>
				{codes.map((c) => (
					<span key={c}>{c}</span>
				))}
			</div>
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					className={`${btn.secondary} ${btn.small} flex items-center gap-1`}
					onClick={() =>
						void navigator.clipboard
							?.writeText(codes.join("\n"))
							.then(() => toast.success("Codes copied"))
					}
				>
					<CopyIcon className="size-3" /> Copy
				</button>
				<button
					type="button"
					className={`${btn.secondary} ${btn.small} flex items-center gap-1`}
					onClick={() => downloadCodes(codes, email)}
				>
					<DownloadIcon className="size-3" /> Download
				</button>
			</div>
		</div>
	);
}

/** Everywhere · My profile & security, notification settings. Role-neutral; docs/profile.md in hospio-backend. */
export function ProfileScreen({
	user,
	role,
	sessions,
	twoStep,
	emailPrefs,
}: {
	user: Me;
	role: HotelRole | null;
	sessions: ProfileSession[];
	twoStep: TwoStepState | null;
	emailPrefs: EmailPrefs;
}) {
	const router = useRouter();
	const [tab, setTab] = useQueryState("tab");
	const active = (tab ?? "profile") as "profile" | "security" | "notifications";
	const { run, pending } = useAction();

	// profile
	const [me, setMe] = useState(user);
	const [name, setName] = useState(user.fullName);
	const [phone, setPhone] = useState(user.phoneNumber ?? "");
	const [language, setLanguage] = useState(user.language ?? "");
	const [uploading, setUploading] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);
	const photo = photoUrl(me.id, me.photoVersion);

	// security
	const [pwOpen, setPwOpen] = useState(false);
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [pwError, setPwError] = useState<string | undefined>();
	const [pwPending, setPwPending] = useState(false);
	const [signOutOthersOpen, setSignOutOthersOpen] = useState(false);
	const [ending, setEnding] = useState<ProfileSession | null>(null);

	// 2-step
	const [setup, setSetup] = useState<Setup | null>(null);
	const [setupCode, setSetupCode] = useState("");
	const [codes, setCodes] = useState<string[] | null>(null);
	const [offOpen, setOffOpen] = useState(false);
	const [offPassword, setOffPassword] = useState("");
	const [offCode, setOffCode] = useState("");
	const [newCodesOpen, setNewCodesOpen] = useState(false);
	const [newCodesCode, setNewCodesCode] = useState("");

	// notifications
	const [prefs, setPrefs] = useState(emailPrefs);
	const prefsChanged = EMAIL_CATEGORIES.some(
		(c) => prefs[c.key] !== emailPrefs[c.key],
	);

	const detailsChanged =
		name.trim() !== me.fullName ||
		phone.trim() !== (me.phoneNumber ?? "") ||
		language !== (me.language ?? "");

	function saveDetails() {
		const body: { fullName?: string; phone?: string; language?: string } = {};
		if (name.trim() !== me.fullName) body.fullName = name;
		if (phone.trim() !== (me.phoneNumber ?? "")) body.phone = phone;
		if (language !== (me.language ?? "")) body.language = language;
		void run(
			() => updateProfile(body),
			"Profile saved",
			(fresh) => {
				setMe(fresh);
				setName(fresh.fullName);
				setPhone(fresh.phoneNumber ?? "");
				setLanguage(fresh.language ?? "");
				router.refresh();
			},
		);
	}

	async function uploadPhoto(file: File) {
		if (!["image/jpeg", "image/png"].includes(file.type))
			return toast.error("The photo must be a JPEG or PNG image");
		if (file.size > MAX_PHOTO_BYTES)
			return toast.error("The photo is too big · keep it under 2 MB");
		setUploading(true);
		try {
			const body = new FormData();
			body.set("file", file, file.name);
			const res = await fetch("/api/profile/photo", { method: "POST", body });
			const json = (await res.json().catch(() => null)) as {
				ok: boolean;
				data?: Me;
				error?: string;
			} | null;
			if (!json?.ok || !json.data) {
				toast.error(json?.error ?? "The photo could not be saved", {
					duration: 8000,
				});
				return;
			}
			setMe(json.data);
			toast.success("Photo saved");
			router.refresh();
		} catch {
			toast.error("Can't reach the server. Check your connection");
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	}

	async function submitPassword() {
		setPwError(undefined);
		if (next.length < 8) return setPwError("At least 8 characters");
		if (next !== confirm) return setPwError("The passwords don't match");
		setPwPending(true);
		const result = await changePassword({
			currentPassword: current,
			newPassword: next,
		});
		setPwPending(false);
		if (!result.ok) return setPwError(result.error);
		toast.success("Password changed", {
			description:
				"Your other devices were signed out. You stay signed in here.",
		});
		setPwOpen(false);
		setCurrent("");
		setNext("");
		setConfirm("");
		router.refresh();
	}

	async function beginTwoStep() {
		await run(
			() => startTwoStep(),
			"Scan the QR code with your authenticator app",
			(s) => {
				setSetup(s);
				setSetupCode("");
			},
		);
	}

	const passwordSubtitle = me.passwordChangedAt
		? `Last changed ${fmtAgo(me.passwordChangedAt)}`
		: "Not changed here yet";
	const otherSessions = sessions.filter((s) => !s.current);

	return (
		<>
			<PageHeader
				title="My profile & security"
				subtitle={`${me.email}${role ? ` · signed in as ${roleLabels[role]}` : ""}`}
			/>
			<PillTabs
				tabs={[
					{ key: "profile", label: "My profile" },
					{ key: "security", label: "Security" },
					{ key: "notifications", label: "Notification settings" },
				]}
				value={active}
				onChange={(k) => void setTab(k === "profile" ? null : k)}
			/>

			{active === "profile" && (
				<div className="grid gap-4 xl:grid-cols-[1fr_360px]">
					<SectionCard
						title="Profile"
						subtitle="What your colleagues see"
						bodyClassName="gap-4 pt-3"
					>
						<div className="flex items-center gap-4">
							{photo ? (
								<img
									src={photo}
									alt="Your profile"
									className="size-16 rounded-full object-cover"
								/>
							) : (
								<span className="flex size-16 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
									{initials(me.fullName)}
								</span>
							)}
							<div className="flex flex-col gap-1">
								<p className="text-[13px] font-semibold text-ink">Photo</p>
								<p className="text-xs text-ink-3">
									JPEG or PNG, up to 2 MB · cropped to a square
								</p>
								<div className="mt-1 flex flex-wrap gap-2">
									<input
										ref={fileRef}
										type="file"
										accept="image/jpeg,image/png"
										className="hidden"
										aria-label="Choose a photo"
										onChange={(e) => {
											const f = e.target.files?.[0];
											if (f) void uploadPhoto(f);
										}}
									/>
									<button
										type="button"
										disabled={uploading}
										className={`${btn.secondary} ${btn.small} flex w-fit items-center gap-1`}
										onClick={() => fileRef.current?.click()}
									>
										<CameraIcon className="size-3" />{" "}
										{uploading ? "Uploading…" : photo ? "Replace" : "Upload"}
									</button>
									{photo && (
										<button
											type="button"
											disabled={pending || uploading}
											className={`${btn.secondary} ${btn.small} flex w-fit items-center gap-1`}
											onClick={() =>
												void run(
													() => removePhoto(),
													"Photo removed",
													(fresh) => {
														setMe(fresh);
														router.refresh();
													},
												)
											}
										>
											<Trash2Icon className="size-3" /> Remove
										</button>
									)}
								</div>
							</div>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<TextField
								label="Full name"
								value={name}
								onChange={setName}
								required
							/>
							<TextField
								label="Phone"
								value={phone}
								onChange={setPhone}
								hint="Like +234 803 555 0192"
							/>
							<TextField
								label="Email"
								value={me.email}
								onChange={() => undefined}
								disabled
								hint="Ask your manager to change your email"
							/>
							<SelectField
								label="Language"
								value={language}
								onChange={setLanguage}
								placeholder="Not set"
								options={LANGUAGES.map((l) => ({
									value: l.value,
									label: l.label,
								}))}
							/>
						</div>
						<div className="flex justify-end gap-2 border-t border-line pt-4">
							<Button
								variant="outline"
								className={btn.secondary}
								disabled={!detailsChanged || pending}
								onClick={() => {
									setName(me.fullName);
									setPhone(me.phoneNumber ?? "");
									setLanguage(me.language ?? "");
								}}
							>
								Discard
							</Button>
							<Button
								className={btn.primary}
								disabled={pending || !detailsChanged}
								onClick={saveDetails}
							>
								Save changes
							</Button>
						</div>
					</SectionCard>
					<SectionCard
						title="Your access"
						subtitle="Roles and hotels you can work in"
						bodyClassName="gap-3 pt-3"
					>
						<DetailList
							items={[
								{
									label: "Roles",
									value: (
										<span className="flex flex-wrap gap-1">
											{me.roles.map((r) => (
												<StatusPill
													key={r}
													dot={false}
													tone={r === role ? "brand" : "grey"}
												>
													{isHotelRole(r) ? roleLabels[r] : r}
												</StatusPill>
											))}
										</span>
									),
								},
								{
									label: "Hotels",
									value: `${me.hotelIds.length} ${me.hotelIds.length === 1 ? "hotel" : "hotels"}`,
								},
								{
									label: "Member since",
									value: fmtWhen(me.createdAt).replace(/,.*$/, ""),
								},
							]}
						/>
						<Note tone="info">
							Switch role from the menu under your name. Ask your manager in
							Roles & permissions for more access.
						</Note>
					</SectionCard>
				</div>
			)}

			{active === "security" && (
				<div className="grid gap-4 xl:grid-cols-2">
					<SectionCard
						title="Password"
						subtitle={passwordSubtitle}
						bodyClassName="gap-3 pt-3"
					>
						<p className="text-[13px] text-ink-2">
							Use at least 8 characters. We sign out your other devices when you
							change it; you stay signed in here.
						</p>
						<Button
							variant="outline"
							className={`${btn.secondary} w-fit`}
							onClick={() => setPwOpen(true)}
						>
							<KeyRoundIcon className="size-4" /> Change password
						</Button>
					</SectionCard>
					{me.businessId && !me.roles.includes("OWNER") && (
						<SectionCard
							title="PIN for shared devices"
							subtitle={me.hasPin ? "Set" : "Not set yet"}
							bodyClassName="gap-3 pt-3"
						>
							<PinSection hasPin={!!me.hasPin} />
						</SectionCard>
					)}
					<SectionCard
						title="2-step sign-in"
						subtitle={
							twoStep?.enabled
								? `On · authenticator app${twoStep.enabledAt ? ` since ${fmtWhen(twoStep.enabledAt).replace(/,.*$/, "")}` : ""}`
								: "Off · recommended for managers and finance"
						}
						bodyClassName="gap-3 pt-3"
					>
						{!twoStep ? (
							<Note tone="info">2-step sign-in needs the live services.</Note>
						) : twoStep.enabled ? (
							<>
								<div className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
									<ShieldCheckIcon className="size-5 text-success" />
									<span className="flex-1 text-[13px] font-medium text-ink">
										After your password we ask for the code from your
										authenticator app.
									</span>
								</div>
								<p className="text-xs text-ink-3">
									{twoStep.recoveryCodesLeft} of 10 recovery codes left.
									{twoStep.recoveryCodesLeft <= 3 ? " Make new ones soon." : ""}
								</p>
								<div className="flex flex-wrap gap-2">
									<button
										type="button"
										className={`${btn.secondary} ${btn.small}`}
										onClick={() => setNewCodesOpen(true)}
									>
										New recovery codes
									</button>
									<button
										type="button"
										className={`${btn.dangerSoft} ${btn.small}`}
										onClick={() => setOffOpen(true)}
									>
										Turn off
									</button>
								</div>
							</>
						) : (
							<>
								<p className="text-[13px] text-ink-2">
									Use an authenticator app (Google Authenticator, Microsoft
									Authenticator, 1Password or similar). After your password,
									sign-in asks for the 6-digit code it shows.
								</p>
								{twoStep.required && (
									<Note tone="warning">
										Your role will need 2-step sign-in. Turn it on now.
									</Note>
								)}
								<Button
									className={`${btn.primary} w-fit`}
									disabled={pending}
									onClick={() => void beginTwoStep()}
								>
									<ShieldCheckIcon className="size-4" /> Turn on
								</Button>
							</>
						)}
						<p className="text-xs text-ink-3">
							SMS and WhatsApp codes are coming soon. A PIN on a shared device
							doesn&apos;t ask for a code: that device was set up with a full
							sign-in.
						</p>
					</SectionCard>
					<SectionCard
						title="Where you're signed in"
						subtitle={`${sessions.length} ${sessions.length === 1 ? "session" : "sessions"}`}
						className="xl:col-span-2"
						flush
					>
						<ul className="divide-y divide-line">
							{sessions.length === 0 && (
								<li className="px-5 py-4 text-[13px] text-ink-3">
									No sessions to show.
								</li>
							)}
							{sessions.map((s) => {
								const Icon =
									s.kind === "PIN" ? TabletIcon : MonitorSmartphoneIcon;
								return (
									<li
										key={s.id}
										className="flex items-center gap-3 px-5 py-3"
										data-testid="session-row"
									>
										<Icon className="size-5 shrink-0 text-ink-3" />
										<div className="min-w-0 flex-1">
											<p className="truncate text-[13px] font-semibold text-ink">
												{s.kind === "PIN"
													? `${s.deviceName ?? "Shared device"} · PIN`
													: s.device}
											</p>
											<p className="truncate text-xs text-ink-3">
												{[
													s.kind === "PIN" ? s.device : null,
													s.location,
													`last used ${fmtAgo(s.lastUsedAt)}`,
													`signed in ${fmtWhen(s.signedInAt)}`,
												]
													.filter(Boolean)
													.join(" · ")}
											</p>
										</div>
										{s.current ? (
											<StatusPill tone="success">This device</StatusPill>
										) : (
											<button
												type="button"
												className="shrink-0 text-xs font-semibold text-danger hover:underline"
												onClick={() => setEnding(s)}
											>
												Sign out
											</button>
										)}
									</li>
								);
							})}
						</ul>
						<div className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-xs text-ink-3">
								Last used is updated when you sign in and about every hour while
								the app is open. No IP addresses are kept.
							</p>
							<Button
								variant="outline"
								className={btn.dangerSoft}
								disabled={otherSessions.length === 0}
								onClick={() => setSignOutOthersOpen(true)}
							>
								<LogOutIcon className="size-4" /> Sign out all other devices
							</Button>
						</div>
					</SectionCard>
				</div>
			)}

			{active === "notifications" && (
				<SectionCard
					title="What we tell you about, and where"
					subtitle="In-app alerts are always on"
					flush
				>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[560px] text-left">
							<thead>
								<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
									<th className="px-5 py-3">Event</th>
									<th className="py-3 text-center">In app</th>
									<th className="py-3 text-center">Email</th>
									<th className="py-3 text-center">SMS</th>
									<th className="py-3 text-center">WhatsApp</th>
								</tr>
							</thead>
							<tbody>
								{EMAIL_CATEGORIES.map((c) => (
									<tr key={c.key} className="border-b border-line">
										<td className="px-5 py-3">
											<p className="text-[13px] font-medium text-ink">
												{c.label}
											</p>
											<p className="text-xs text-ink-3">{c.hint}</p>
										</td>
										<td className="py-3 text-center">
											<Switch
												checked
												disabled
												aria-label={`${c.label} in app (always on)`}
												className="data-[state=checked]:bg-brand"
											/>
										</td>
										<td className="py-3 text-center">
											<Switch
												checked={prefs[c.key]}
												aria-label={`${c.label} by email`}
												onCheckedChange={(v) =>
													setPrefs((p) => ({ ...p, [c.key]: v }))
												}
												className="data-[state=checked]:bg-brand"
											/>
										</td>
										<td className="py-3 text-center">
											<StatusPill dot={false} tone="grey">
												Coming soon
											</StatusPill>
										</td>
										<td className="py-3 text-center">
											<StatusPill dot={false} tone="grey">
												Coming soon
											</StatusPill>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs text-ink-3">
							Invites, temporary passwords and password resets are always
							emailed.
						</p>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								className={btn.secondary}
								disabled={!prefsChanged || pending}
								onClick={() => setPrefs(emailPrefs)}
							>
								Reset
							</Button>
							<Button
								className={btn.primary}
								disabled={pending || !prefsChanged}
								onClick={() =>
									void run(
										() => saveEmailPrefs(prefs),
										"Notification settings saved",
										(saved) => {
											setPrefs(saved);
											router.refresh();
										},
									)
								}
							>
								Save
							</Button>
						</div>
					</div>
				</SectionCard>
			)}

			{/* Change password */}
			<Modal
				open={pwOpen}
				onOpenChange={setPwOpen}
				title="Change password"
				subtitle="You stay signed in here; other devices are signed out"
				icon={KeyRoundIcon}
				size="form"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setPwOpen(false)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pwPending || !current || !next || !confirm}
							onClick={submitPassword}
						>
							Change password
						</Button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<TextField
						label="Current password"
						type="password"
						value={current}
						onChange={setCurrent}
					/>
					<TextField
						label="New password"
						type="password"
						value={next}
						onChange={setNext}
						hint="At least 8 characters"
					/>
					<TextField
						label="New password again"
						type="password"
						value={confirm}
						onChange={setConfirm}
						error={pwError}
					/>
				</div>
			</Modal>

			{/* 2-step setup: scan, confirm a code, then the recovery codes once */}
			<Modal
				open={!!setup || !!codes}
				onOpenChange={(o) => {
					if (!o) {
						if (codes) router.refresh();
						setSetup(null);
						setCodes(null);
					}
				}}
				title={codes ? "Your recovery codes" : "Turn on 2-step sign-in"}
				subtitle={
					codes
						? "Each works once · keep them somewhere safe"
						: "Scan with your authenticator app, then type the code it shows"
				}
				icon={ShieldCheckIcon}
				size="form"
				footer={
					codes ? (
						<Button
							className={btn.primary}
							onClick={() => {
								setCodes(null);
								setSetup(null);
								router.refresh();
							}}
						>
							I&apos;ve saved them
						</Button>
					) : (
						<>
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => setSetup(null)}
							>
								Cancel
							</Button>
							<Button
								className={btn.primary}
								disabled={pending || setupCode.replace(/\s/g, "").length !== 6}
								onClick={() =>
									void run(
										() => enableTwoStep(setupCode),
										"2-step sign-in is on",
										(r) => {
											setCodes(r.recoveryCodes);
											setSetup(null);
										},
									)
								}
							>
								Turn on
							</Button>
						</>
					)
				}
			>
				{codes ? (
					<CodesList codes={codes} email={me.email} />
				) : setup ? (
					<div className="flex flex-col items-center gap-4">
						<img
							src={svgSrc(setup.qrSvg)}
							alt="QR code for your authenticator app"
							className="size-48 rounded-lg border border-line"
							data-testid="two-step-qr"
						/>
						<div className="w-full text-center">
							<p className="text-xs text-ink-3">
								Can&apos;t scan? Enter this key in the app (time-based):
							</p>
							<p
								className="mt-1 break-all font-mono text-[13px] font-semibold text-ink"
								data-testid="two-step-secret"
							>
								{setup.secret}
							</p>
						</div>
						<TextField
							label="6-digit code from the app"
							value={setupCode}
							onChange={setSetupCode}
							placeholder="123 456"
							className="w-full"
						/>
					</div>
				) : null}
			</Modal>

			{/* New recovery codes */}
			<Modal
				open={newCodesOpen}
				onOpenChange={(o) => {
					setNewCodesOpen(o);
					if (!o) setNewCodesCode("");
				}}
				title="New recovery codes"
				subtitle="Your old codes stop working"
				icon={KeyRoundIcon}
				size="form"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setNewCodesOpen(false)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pending || !newCodesCode.trim()}
							onClick={() =>
								void run(
									() => newRecoveryCodes(newCodesCode),
									"New codes made",
									(r) => {
										setNewCodesOpen(false);
										setNewCodesCode("");
										setCodes(r.recoveryCodes);
									},
								)
							}
						>
							Make new codes
						</Button>
					</>
				}
			>
				<TextField
					label="Code from your authenticator app"
					value={newCodesCode}
					onChange={setNewCodesCode}
					placeholder="123 456"
				/>
			</Modal>

			{/* Turn off */}
			<Modal
				open={offOpen}
				onOpenChange={(o) => {
					setOffOpen(o);
					if (!o) {
						setOffPassword("");
						setOffCode("");
					}
				}}
				title="Turn off 2-step sign-in"
				subtitle="Sign-in will only ask for your password"
				icon={ShieldCheckIcon}
				tone="danger"
				size="form"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setOffOpen(false)}
						>
							Cancel
						</Button>
						<Button
							className={btn.danger}
							disabled={pending || !offPassword || !offCode.trim()}
							onClick={() =>
								void run(
									() =>
										disableTwoStep({ password: offPassword, code: offCode }),
									"2-step sign-in is off",
									() => {
										setOffOpen(false);
										setOffPassword("");
										setOffCode("");
										router.refresh();
									},
								)
							}
						>
							Turn off
						</Button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<TextField
						label="Your password"
						type="password"
						value={offPassword}
						onChange={setOffPassword}
					/>
					<TextField
						label="Code from your app, or a recovery code"
						value={offCode}
						onChange={setOffCode}
					/>
				</div>
			</Modal>

			<ConfirmModal
				open={!!ending}
				onOpenChange={(o) => !o && setEnding(null)}
				title="Sign out this device"
				subtitle={
					ending
						? ending.kind === "PIN"
							? `${ending.deviceName ?? "Shared device"} · PIN`
							: ending.device
						: undefined
				}
				tone="danger"
				confirmLabel="Sign out"
				pending={pending}
				onConfirm={() => {
					const s = ending;
					if (!s) return;
					void run(
						() => endSession(s.id),
						"Device signed out",
						() => {
							setEnding(null);
							router.refresh();
						},
					);
				}}
			>
				<p className="text-[13px] text-ink-2">
					That device goes back to the sign-in page
					{ending?.kind === "PIN"
						? " (the lock screen on a shared device)"
						: ""}{" "}
					within a few seconds.
				</p>
			</ConfirmModal>

			<ConfirmModal
				open={signOutOthersOpen}
				onOpenChange={setSignOutOthersOpen}
				title="Sign out all other devices"
				subtitle="You stay signed in here"
				tone="danger"
				confirmLabel="Sign out others"
				pending={pending}
				onConfirm={() =>
					void run(
						() => signOutOthers(),
						(r) =>
							r.ended === 1
								? "1 other device signed out"
								: `${r.ended} other devices signed out`,
						() => {
							setSignOutOthersOpen(false);
							router.refresh();
						},
					)
				}
			>
				<p className="text-[13px] text-ink-2">
					Use this if you lost a phone or signed in on a shared tablet. Those
					devices will ask for your password
					{twoStep?.enabled ? " and a code" : ""} next time.
				</p>
			</ConfirmModal>
		</>
	);
}

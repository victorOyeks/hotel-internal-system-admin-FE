"use client";

import { CameraIcon, KeyRoundIcon, LogOutIcon, MonitorSmartphoneIcon, ShieldCheckIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@hospio/ui/primitives/button";
import { Switch } from "@hospio/ui/primitives/switch";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtWhen, initials } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { changePassword } from "@hospio/api/actions";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { Me } from "@hospio/api/api/schema";
import { type HotelRole, isHotelRole, roleLabels } from "@hospio/api/roles";

type Session = { id: string; device: string; where: string; at: string; current: boolean };
type Pref = { key: string; label: string; inApp: boolean; email: boolean; whatsapp: boolean };

/** Everywhere · My profile & security, notification settings. Role-neutral. */
export function ProfileScreen({ user, role, sessions, prefs }: { user: Me; role: HotelRole | null; sessions: Session[]; prefs: Pref[] }) {
	const [tab, setTab] = useQueryState("tab");
	const active = (tab ?? "profile") as "profile" | "security" | "notifications";
	const { run, pending } = useDemoAction();

	// profile
	const [name, setName] = useState(user.fullName);
	const [phone, setPhone] = useState(user.phoneNumber ?? "");
	const [language, setLanguage] = useState("English");

	// security
	const [pwOpen, setPwOpen] = useState(false);
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [pwError, setPwError] = useState<string | undefined>();
	const [pwPending, setPwPending] = useState(false);
	const [twoStep, setTwoStep] = useState(user.twoStepEnabled);
	const [methodOpen, setMethodOpen] = useState(false);
	const [method, setMethod] = useState<"WHATSAPP" | "SMS" | "APP">("WHATSAPP");
	const [codesOpen, setCodesOpen] = useState(false);
	const [signOutOthers, setSignOutOthers] = useState(false);

	// notifications
	const [matrix, setMatrix] = useState(prefs);

	async function submitPassword() {
		setPwError(undefined);
		if (next.length < 8) return setPwError("At least 8 characters");
		if (next !== confirm) return setPwError("The passwords don't match");
		setPwPending(true);
		const result = await changePassword({ currentPassword: current, newPassword: next });
		setPwPending(false);
		if (!result.ok) return setPwError(result.error);
		toast.success("Password changed", { description: "Use it the next time you sign in." });
		setPwOpen(false);
		setCurrent(""); setNext(""); setConfirm("");
	}

	return (
		<>
			<PageHeader title="My profile & security" subtitle={`${user.email}${role ? ` · signed in as ${roleLabels[role]}` : ""}`} />
			<PillTabs tabs={[{ key: "profile", label: "My profile" }, { key: "security", label: "Security" }, { key: "notifications", label: "Notification settings" }]} value={active} onChange={(k) => void setTab(k === "profile" ? null : k)} />

			{active === "profile" && (
				<div className="grid gap-4 xl:grid-cols-[1fr_360px]">
					<SectionCard title="Profile" subtitle="What your colleagues and guests see" bodyClassName="gap-4 pt-3">
						<div className="flex items-center gap-4">
							<span className="flex size-16 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">{initials(name)}</span>
							<div className="flex flex-col gap-1">
								<p className="text-[13px] font-semibold text-ink">Photo</p>
								<p className="text-xs text-ink-3">Shown on the rota and in messages</p>
								<button type="button" className={`${btn.secondary} ${btn.small} mt-1 flex w-fit items-center gap-1`} onClick={() => run("Photo uploaded", undefined, { tone: "info" })}><CameraIcon className="size-3" /> Upload</button>
							</div>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<TextField label="Full name" value={name} onChange={setName} />
							<TextField label="Phone" value={phone} onChange={setPhone} hint="Used for WhatsApp codes and alerts" />
							<TextField label="Email" value={user.email} onChange={() => undefined} disabled hint="Ask your manager to change your email" />
							<SelectField label="Language" value={language} onChange={setLanguage} options={["English", "Yoruba", "Hausa", "Igbo", "Pidgin"]} />
						</div>
						<div className="flex justify-end gap-2 border-t border-line pt-4">
							<Button variant="outline" className={btn.secondary} onClick={() => { setName(user.fullName); setPhone(user.phoneNumber ?? ""); }}>Discard</Button>
							<Button className={btn.primary} disabled={pending} onClick={() => run("Profile saved")}>Save changes</Button>
						</div>
					</SectionCard>
					<SectionCard title="Your access" subtitle="Roles and hotels you can work in" bodyClassName="gap-3 pt-3">
						<DetailList items={[{ label: "Roles", value: <span className="flex flex-wrap gap-1">{user.roles.map((r) => <StatusPill key={r} dot={false} tone={r === role ? "brand" : "grey"}>{isHotelRole(r) ? roleLabels[r] : r}</StatusPill>)}</span> }, { label: "Hotels", value: `${user.hotelIds.length} ${user.hotelIds.length === 1 ? "hotel" : "hotels"}` }, { label: "Member since", value: fmtWhen(user.createdAt).replace(/,.*$/, "") }]} />
						<Note tone="info">Switch role from the menu under your name. Ask your manager in Roles & permissions for more access.</Note>
					</SectionCard>
				</div>
			)}

			{active === "security" && (
				<div className="grid gap-4 xl:grid-cols-2">
					<SectionCard title="Password" subtitle="Last changed 42 days ago" bodyClassName="gap-3 pt-3">
						<p className="text-[13px] text-ink-2">Use at least 8 characters. We sign out your other devices when you change it.</p>
						<Button variant="outline" className={`${btn.secondary} w-fit`} onClick={() => setPwOpen(true)}><KeyRoundIcon className="size-4" /> Change password</Button>
					</SectionCard>
					<SectionCard title="2-step sign-in" subtitle={twoStep ? `On · code by ${method === "APP" ? "authenticator app" : method === "SMS" ? "SMS" : "WhatsApp"}` : "Off · recommended for managers and finance"} bodyClassName="gap-3 pt-3">
						<div className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
							<ShieldCheckIcon className="size-5 text-brand" />
							<span className="flex-1 text-[13px] font-medium text-ink">Ask for a code on new devices</span>
							<Switch checked={twoStep} aria-label="2-step sign-in" onCheckedChange={(v) => { if (v) setMethodOpen(true); else void run("2-step turned off", () => setTwoStep(false), { tone: "warning" }); }} className="data-[state=checked]:bg-brand" />
						</div>
						{twoStep && (
							<div className="flex gap-2">
								<button type="button" className={`${btn.secondary} ${btn.small}`} onClick={() => setMethodOpen(true)}>Change method</button>
								<button type="button" className={`${btn.secondary} ${btn.small}`} onClick={() => setCodesOpen(true)}>Backup codes</button>
							</div>
						)}
					</SectionCard>
					<SectionCard title="Where you're signed in" subtitle={`${sessions.length} devices`} action={undefined} className="xl:col-span-2" flush>
						<ul className="divide-y divide-line">
							{sessions.map((s) => (
								<li key={s.id} className="flex items-center gap-3 px-5 py-3">
									<MonitorSmartphoneIcon className="size-5 text-ink-3" />
									<div className="min-w-0 flex-1">
										<p className="text-[13px] font-semibold text-ink">{s.device}</p>
										<p className="text-xs text-ink-3">{s.where} · {fmtWhen(s.at)}</p>
									</div>
									{s.current ? <StatusPill tone="success">This device</StatusPill> : <button type="button" className="text-xs font-semibold text-danger hover:underline" onClick={() => run("Device signed out", undefined, { tone: "info" })}>Sign out</button>}
								</li>
							))}
						</ul>
						<div className="flex justify-end px-5 py-3">
							<Button variant="outline" className={btn.dangerSoft} onClick={() => setSignOutOthers(true)}><LogOutIcon className="size-4" /> Sign out all other devices</Button>
						</div>
					</SectionCard>
				</div>
			)}

			{active === "notifications" && (
				<SectionCard title="What we tell you about, and where" subtitle="In-app alerts are always on for anything that needs your decision" flush>
					<table className="w-full text-left">
						<thead>
							<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
								<th className="px-5 py-3">Event</th><th className="py-3 text-center">In app</th><th className="py-3 text-center">Email</th><th className="py-3 text-center">WhatsApp</th>
							</tr>
						</thead>
						<tbody>
							{matrix.map((p, i) => (
								<tr key={p.key} className="border-b border-line">
									<td className="px-5 py-3 text-[13px] font-medium text-ink">{p.label}</td>
									{(["inApp", "email", "whatsapp"] as const).map((ch) => (
										<td key={ch} className="py-3 text-center">
											<Switch checked={p[ch]} aria-label={`${p.label} by ${ch}`} onCheckedChange={(v) => setMatrix((m) => m.map((row, j) => (j === i ? { ...row, [ch]: v } : row)))} className="data-[state=checked]:bg-brand" />
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
					<div className="flex justify-end gap-2 px-5 py-4">
						<Button variant="outline" className={btn.secondary} onClick={() => setMatrix(prefs)}>Reset</Button>
						<Button className={btn.primary} disabled={pending} onClick={() => run("Notification settings saved")}>Save</Button>
					</div>
				</SectionCard>
			)}

			{/* Change password */}
			<Modal open={pwOpen} onOpenChange={setPwOpen} title="Change password" subtitle="You stay signed in here; other devices are signed out" icon={KeyRoundIcon} size="form"
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => setPwOpen(false)}>Cancel</Button><Button className={btn.primary} disabled={pwPending || !current || !next || !confirm} onClick={submitPassword}>Change password</Button></>}>
				<div className="flex flex-col gap-4">
					<TextField label="Current password" type="password" value={current} onChange={setCurrent} />
					<TextField label="New password" type="password" value={next} onChange={setNext} hint="At least 8 characters" />
					<TextField label="New password again" type="password" value={confirm} onChange={setConfirm} error={pwError} />
				</div>
			</Modal>

			{/* 2-step method */}
			<Modal open={methodOpen} onOpenChange={setMethodOpen} title="How should we send your code?" subtitle="You'll need it on devices we haven't seen" icon={ShieldCheckIcon} size="form"
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => setMethodOpen(false)}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run("2-step sign-in is on", () => { setTwoStep(true); setMethodOpen(false); setCodesOpen(true); })}>Turn on</Button></>}>
				<ChoiceCards value={method} onChange={setMethod} options={[{ value: "WHATSAPP", label: "WhatsApp", hint: `To ${phone || "your phone"}` }, { value: "SMS", label: "SMS", hint: "Works without data" }, { value: "APP", label: "Authenticator app", hint: "Google Authenticator or similar" }]} />
			</Modal>

			{/* Backup codes */}
			<Modal open={codesOpen} onOpenChange={setCodesOpen} title="Backup codes" subtitle="Each works once · keep them somewhere safe" icon={KeyRoundIcon} size="confirm"
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => run("New codes generated", undefined, { tone: "info" })}>Generate new</Button><Button className={btn.primary} onClick={() => setCodesOpen(false)}>Done</Button></>}>
				<div className="grid grid-cols-2 gap-2 rounded-xl bg-subtle p-4 font-mono text-[13px] text-ink">
					{["4H2K-91PL", "ZX7Q-00AB", "M1NE-77RT", "BB29-K4LO", "TT05-PQ8Z", "9AAD-13VV", "C0DE-RUNS", "LAG0-S2026"].map((c) => <span key={c}>{c}</span>)}
				</div>
			</Modal>

			<ConfirmModal open={signOutOthers} onOpenChange={setSignOutOthers} title="Sign out all other devices" subtitle="You stay signed in here" tone="danger" confirmLabel="Sign out others" pending={pending} onConfirm={() => run("Other devices signed out", () => setSignOutOthers(false))}>
				<p className="text-[13px] text-ink-2">Use this if you lost a phone or signed in on a shared tablet. Those devices will ask for your password{twoStep ? " and a code" : ""} next time.</p>
			</ConfirmModal>
		</>
	);
}

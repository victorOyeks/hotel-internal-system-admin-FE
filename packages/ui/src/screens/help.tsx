"use client";

import {
	ArrowRightIcon,
	HeadsetIcon,
	MailIcon,
	SendIcon,
	SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { openSupportTicket } from "@hospio/api/actions/payment";
import { useAction } from "@hospio/api/actions/use-action";
import type { HelpContent, HelpGuide } from "@hospio/ui/help";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@hospio/ui/primitives/accordion";
import { Button } from "@hospio/ui/primitives/button";
import { ChoiceCards, TextField, TextareaField } from "@hospio/ui/shared/field";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { SearchBox } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

type Guide = HelpGuide & { open: boolean };

const haystack = (g: Guide) =>
	[g.title, g.when, g.topic, g.screen ?? "", ...g.steps, ...g.goodToKnow]
		.join(" ")
		.toLowerCase();

/** Everywhere · Help: task guides for the roles the person holds, what's new, and a ticket to H.M.S support. */
export function HelpScreen({
	content,
	app,
}: {
	/** From `helpFor` in @hospio/ui/help, worked out on the server for the signed-in person. */
	content: HelpContent;
	/** The admin app is H.M.S itself: no tickets, a link to the Support queue instead. */
	app: "hotel" | "admin";
}) {
	const [search, setSearch] = useState("");
	const [section, setSection] = useState<string>("all");
	const [contact, setContact] = useState(false);
	const q = search.trim().toLowerCase();

	const sections = useMemo(() => {
		const words = q.split(/\s+/).filter(Boolean);
		return content.sections
			.filter((s) => section === "all" || s.key === section)
			.map((s) => ({
				...s,
				guides: s.guides.filter((g) =>
					words.every((w) => haystack(g).includes(w)),
				),
			}))
			.filter((s) => s.guides.length > 0);
	}, [content.sections, section, q]);
	const found = sections.reduce((n, s) => n + s.guides.length, 0);
	const total = content.sections.reduce((n, s) => n + s.guides.length, 0);

	return (
		<>
			<PageHeader
				title="Help"
				subtitle="Short guides for the work you do in Hospio360, and H.M.S support when you need a person"
			>
				{app === "hotel" ? (
					<Button className={btn.primary} onClick={() => setContact(true)}>
						<HeadsetIcon className="size-4" /> Contact support
					</Button>
				) : null}
			</PageHeader>

			<div className="flex flex-col gap-3">
				<SearchBox
					value={search}
					onChange={setSearch}
					placeholder="Search guides, e.g. receipt, PIN, check in…"
					className="w-full max-w-[520px]"
				/>
				{content.sections.length > 1 && (
					<div
						className="flex flex-wrap gap-2"
						role="tablist"
						aria-label="Guides for"
					>
						{[
							{ key: "all", label: `All guides (${total})` },
							...content.sections.map((s) => ({
								key: s.key,
								label: `${s.label} (${s.guides.length})`,
							})),
						].map((t) => (
							<button
								key={t.key}
								type="button"
								role="tab"
								aria-selected={section === t.key}
								onClick={() => setSection(t.key)}
								className={cn(
									"rounded-full border px-3 py-[6px] text-xs font-semibold transition-colors",
									section === t.key
										? "border-brand bg-brand text-white"
										: "border-line bg-card text-ink-2 hover:bg-subtle",
								)}
							>
								{t.label}
							</button>
						))}
					</div>
				)}
			</div>

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
				<div className="flex min-w-0 flex-col gap-4">
					{q && (
						<p className="text-[13px] text-ink-2" data-testid="help-results">
							{found === 0
								? `Nothing matches “${search.trim()}”. Try fewer words${app === "hotel" ? " or contact support" : ""}.`
								: `${found} ${found === 1 ? "guide matches" : "guides match"} “${search.trim()}”`}
						</p>
					)}
					{sections.map((s) => (
						<SectionCard
							key={s.key}
							title={s.label}
							subtitle={
								s.current ? `${s.intro} · the role you're working as` : s.intro
							}
							count={s.guides.length}
							bodyClassName="pt-1"
						>
							<GuideList guides={s.guides} expandAll={!!q} />
						</SectionCard>
					))}
				</div>

				<div className="flex min-w-0 flex-col gap-4">
					{!q && content.whatsNew.length > 0 && (
						<SectionCard
							title="What's new"
							subtitle={content.whatsNewWeek}
							bodyClassName="gap-3 pt-2"
						>
							<ul className="flex flex-col gap-3" data-testid="whats-new">
								{content.whatsNew.map((n) => (
									<li key={n.title} className="flex gap-2">
										<SparklesIcon className="mt-[2px] size-4 shrink-0 text-brand" />
										<span className="flex flex-col gap-[2px]">
											<span className="text-[13px] font-semibold text-ink">
												{n.title}
											</span>
											<span className="text-[13px] text-ink-2">{n.body}</span>
										</span>
									</li>
								))}
							</ul>
						</SectionCard>
					)}
					{app === "hotel" ? (
						<SectionCard
							title="Talk to H.M.S"
							subtitle="When a guide doesn't answer it"
							bodyClassName="gap-3 pt-2"
						>
							<p className="text-[13px] text-ink-2">
								Send a ticket and you get its number on screen straight away.
								H.M.S replies by email to the address you sign in with.
							</p>
							<p className="flex items-center gap-2 text-[13px] text-ink-2">
								<MailIcon className="size-4 shrink-0 text-ink-3" /> Choose
								“Urgent” only when guests or money are affected right now.
							</p>
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => setContact(true)}
							>
								Send a ticket
							</Button>
						</SectionCard>
					) : (
						<SectionCard
							title="Hotel tickets"
							subtitle="Questions from hotels arrive in Support"
							bodyClassName="gap-3 pt-2"
						>
							<p className="text-[13px] text-ink-2">
								Every ticket a hotel sends from its Help page lands in the
								Support queue, with the business and the person who sent it.
							</p>
							<Link
								href="/dashboard/support"
								className={cn(
									btn.secondary,
									"inline-flex items-center justify-center gap-2",
								)}
							>
								Open Support <ArrowRightIcon className="size-4" />
							</Link>
						</SectionCard>
					)}
				</div>
			</div>

			{app === "hotel" && (
				<ContactPanel open={contact} onOpenChange={setContact} />
			)}
		</>
	);
}

function GuideList({
	guides,
	expandAll,
}: {
	guides: Guide[];
	expandAll: boolean;
}) {
	const topics = [...new Set(guides.map((g) => g.topic))];
	return (
		<div className="flex flex-col gap-3">
			{topics.map((topic) => {
				const inTopic = guides.filter((g) => g.topic === topic);
				return (
					<div key={topic} className="flex flex-col">
						<p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
							{topic}
						</p>
						{/* Remounted when a search starts or ends: matches open, browsing starts closed. */}
						<Accordion
							key={expandAll ? "search" : "browse"}
							type="multiple"
							defaultValue={expandAll ? inTopic.map((g) => g.id) : []}
							className="w-full"
						>
							{inTopic.map((g) => (
								<AccordionItem
									key={g.id}
									value={g.id}
									className="border-line"
									data-guide={g.id}
								>
									<AccordionTrigger className="py-3 text-left hover:no-underline">
										<span className="flex flex-col gap-[2px]">
											<span className="text-[14px] font-semibold text-ink">
												{g.title}
											</span>
											<span className="text-xs font-normal text-ink-3">
												{g.when}
											</span>
										</span>
									</AccordionTrigger>
									<AccordionContent className="flex flex-col gap-3 pb-4">
										<ol className="flex list-decimal flex-col gap-[6px] pl-5 text-[13px] text-ink">
											{g.steps.map((s) => (
												<li key={s}>{s}</li>
											))}
										</ol>
										{g.goodToKnow.length > 0 && (
											<div className="rounded-[10px] bg-subtle px-3 py-[10px]">
												<p className="pb-1 text-xs font-semibold text-ink">
													Good to know
												</p>
												<ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-ink-2">
													{g.goodToKnow.map((s) => (
														<li key={s}>{s}</li>
													))}
												</ul>
											</div>
										)}
										{g.open && g.route && (
											<Link
												href={g.route}
												className={cn(
													btn.secondary,
													btn.small,
													"inline-flex w-fit items-center gap-2",
												)}
												data-testid="help-open"
											>
												Open {g.screen ?? "screen"}{" "}
												<ArrowRightIcon className="size-[14px]" />
											</Link>
										)}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				);
			})}
		</div>
	);
}

/** Contact support: a real platform support ticket for the signed-in person's business. */
function ContactPanel({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [priority, setPriority] = useState<
		"LOW" | "NORMAL" | "HIGH" | "URGENT"
	>("NORMAL");
	const ticket = useAction();
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title="Contact H.M.S support"
			subtitle="You get a ticket number on screen straight away"
			icon={HeadsetIcon}
			footerInfo="H.M.S replies by email to the address you sign in with"
			footer={
				<>
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={ticket.pending || !subject.trim() || !body.trim()}
						onClick={() =>
							ticket.run(
								() => openSupportTicket({ subject, body, priority }),
								"Ticket sent to H.M.S support",
								(r) => {
									toast.info(
										`Ticket ${r.reference} opened · H.M.S replies by email`,
									);
									onOpenChange(false);
									setSubject("");
									setBody("");
									setPriority("NORMAL");
								},
							)
						}
					>
						<SendIcon className="size-4" /> Send ticket
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<TextField
					label="What is it about?"
					value={subject}
					onChange={setSubject}
					placeholder="e.g. Bar sales not showing payments"
				/>
				<TextareaField
					label="Tell us what happened"
					value={body}
					onChange={setBody}
					rows={5}
					placeholder="What you did, what you expected, what you saw"
				/>
				<ChoiceCards
					label="How urgent"
					value={priority}
					onChange={setPriority}
					columns={2}
					options={[
						{ value: "LOW", label: "Low", hint: "A question or idea" },
						{
							value: "NORMAL",
							label: "Normal",
							hint: "Something is wrong, there's a workaround",
						},
						{ value: "HIGH", label: "High", hint: "A team is slowed down" },
						{
							value: "URGENT",
							label: "Urgent",
							hint: "Guests or money are affected now",
						},
					]}
				/>
				<PanelSection title="Sent with your ticket">
					<p className="text-xs text-ink-3">
						Your business, your hotel and your name, so support knows who to
						answer.
					</p>
				</PanelSection>
			</div>
		</SidePanel>
	);
}

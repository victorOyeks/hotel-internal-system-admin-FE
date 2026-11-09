"use client";

import { BookOpenIcon, HeadsetIcon, LifeBuoyIcon, MessageSquareIcon, PhoneIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@hospio/ui/primitives/accordion";
import { Button } from "@hospio/ui/primitives/button";
import { ChoiceCards, TextField, TextareaField } from "@hospio/ui/shared/field";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { SearchBox } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { toast } from "sonner";
import { openSupportTicket } from "@hospio/api/actions/payment";
import { useAction } from "@hospio/api/actions/use-action";
import { useNotConnectedAction } from "@hospio/api/demo/actions";

type Topic = { key: string; title: string; body: string; articles: number };
type Faq = { q: string; a: string };

/** Everywhere · Help: topics, FAQ and a line to H.M.S support. */
export function HelpScreen({ topics, faq, tickets = true }: { topics: Topic[]; faq: Faq[]; /** false where there is no business to open a ticket for (the admin app). */ tickets?: boolean }) {
	const [search, setSearch] = useState("");
	const [contact, setContact] = useState(false);
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
	const { run } = useNotConnectedAction();
	const ticket = useAction();
	const q = search.toLowerCase();
	const visibleTopics = topics.filter((t) => !q || `${t.title} ${t.body}`.toLowerCase().includes(q));
	const visibleFaq = faq.filter((f) => !q || `${f.q} ${f.a}`.toLowerCase().includes(q));

	return (
		<>
			<PageHeader title="Help" subtitle="Short guides for every screen, answers to common questions, and H.M.S support when you need a person">
				<Button className={btn.primary} onClick={() => setContact(true)}><HeadsetIcon className="size-4" /> Contact support</Button>
			</PageHeader>

			<SearchBox value={search} onChange={setSearch} placeholder="Search help…" className="w-full max-w-[520px]" />

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{visibleTopics.map((t) => (
					<button key={t.key} type="button" onClick={() => run(`Opening “${t.title}” guides`, undefined, { tone: "info", description: "Guides open in a new tab when the help centre is live." })} className="flex flex-col gap-2 rounded-card border border-line bg-card p-[18px] text-left transition-colors hover:bg-brand-soft/20">
						<span className="flex size-8 items-center justify-center rounded-[10px] bg-brand-soft text-brand"><BookOpenIcon className="size-4" /></span>
						<span className="text-[15px] font-bold text-ink">{t.title}</span>
						<span className="text-[13px] text-ink-2">{t.body}</span>
						<span className="mt-auto text-xs text-ink-3">{t.articles} guides</span>
					</button>
				))}
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_340px]">
				<SectionCard title="Common questions" subtitle="The things managers ask most">
					{visibleFaq.length === 0 ? (
						<p className="py-4 text-sm text-ink-3">Nothing matches “{search}”. Try fewer words or contact support.</p>
					) : (
						<Accordion type="single" collapsible className="w-full">
							{visibleFaq.map((f, i) => (
								<AccordionItem key={f.q} value={`q-${i}`} className="border-line">
									<AccordionTrigger className="py-3 text-left text-[13px] font-semibold text-ink hover:no-underline">{f.q}</AccordionTrigger>
									<AccordionContent className="text-[13px] text-ink-2">{f.a}</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					)}
				</SectionCard>
				<SectionCard title="Talk to H.M.S" subtitle="Support hours 7am–11pm, every day" bodyClassName="gap-3 pt-2">
					<p className="flex items-center gap-2 text-[13px] text-ink"><PhoneIcon className="size-4 text-ink-3" /> +234 700 HOSPIO (467 746)</p>
					<p className="flex items-center gap-2 text-[13px] text-ink"><MessageSquareIcon className="size-4 text-ink-3" /> WhatsApp +234 901 000 0000</p>
					<p className="flex items-center gap-2 text-[13px] text-ink"><LifeBuoyIcon className="size-4 text-ink-3" /> Urgent · a terminal or sign-in is down: call, don’t write</p>
					<Button variant="outline" className={btn.secondary} onClick={() => setContact(true)}>Send a ticket</Button>
				</SectionCard>
			</div>

			<SidePanel open={contact} onOpenChange={setContact} title="Contact H.M.S support" subtitle="You get a ticket number by WhatsApp within a minute" icon={HeadsetIcon}
				footerInfo="Support can see your screens only with your permission, and every change they make is logged"
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => setContact(false)}>Cancel</Button><Button className={btn.primary} disabled={!tickets || ticket.pending || !subject.trim() || !body.trim()} title={tickets ? undefined : "Not connected yet for this app"} onClick={() => ticket.run(() => openSupportTicket({ subject, body, priority }), "Ticket sent to H.M.S support", (r) => { toast.info(`Ticket ${r.reference} opened · H.M.S replies in Notifications`); setContact(false); setSubject(""); setBody(""); })}><SendIcon className="size-4" /> Send ticket</Button></>}>
				<div className="flex flex-col gap-5">
					<TextField label="What is it about?" value={subject} onChange={setSubject} placeholder="e.g. Bar POS not showing payments" />
					<TextareaField label="Tell us what happened" value={body} onChange={setBody} rows={5} placeholder="What you did, what you expected, what you saw" />
					<ChoiceCards label="How urgent" value={priority} onChange={setPriority} columns={2} options={[{ value: "LOW", label: "Low", hint: "A question or idea" }, { value: "NORMAL", label: "Normal", hint: "Something is wrong, there's a workaround" }, { value: "HIGH", label: "High", hint: "A team is slowed down" }, { value: "URGENT", label: "Urgent", hint: "Guests or money are affected now" }]} />
					<PanelSection title="Attached automatically">
						<p className="text-xs text-ink-3">Your hotel, role, the screen you were on and the last 10 actions in the activity log, so support does not have to ask.</p>
					</PanelSection>
				</div>
			</SidePanel>
		</>
	);
}

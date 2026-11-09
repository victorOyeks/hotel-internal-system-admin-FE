"use client";

import { CopyIcon, Trash2Icon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "../utils";

/**
 * Staging API log: lists the backend calls the server made for this session (server components and
 * actions, which the browser Network tab cannot see). Only renders when NEXT_PUBLIC_API_LOG=true.
 */
type Entry = { at: string; method: string; path: string; status: number; ms: number; request: unknown; response: unknown };

const ENABLED = process.env.NEXT_PUBLIC_API_LOG === "true";

const statusClass = (s: number) => (s >= 500 || s === 0 ? "text-red-600" : s >= 400 ? "text-amber-600" : "text-emerald-600");
const pretty = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));

export function ApiLog() {
	if (!ENABLED) return null;
	return <Panel />;
}

function Panel() {
	const [open, setOpen] = useState(false);
	const [entries, setEntries] = useState<Entry[]>([]);
	const [expanded, setExpanded] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await fetch("/api/debug/calls", { cache: "no-store" });
			if (res.ok) setEntries((await res.json()) as Entry[]);
		} catch {}
	}, []);

	useEffect(() => {
		if (!open) return;
		void load();
		const t = setInterval(load, 3000);
		return () => clearInterval(t);
	}, [open, load]);

	const clear = async () => {
		await fetch("/api/debug/calls", { method: "DELETE" }).catch(() => {});
		setEntries([]);
	};
	const copy = (value: unknown) => {
		navigator.clipboard?.writeText(pretty(value)).then(() => toast.success("Copied"), () => toast.error("Could not copy"));
	};

	return (
		<>
			<button type="button" onClick={() => setOpen(true)} className="fixed bottom-3 left-3 z-[60] rounded-full bg-neutral-900 px-3 py-1.5 font-mono text-xs font-semibold text-white shadow-lg hover:bg-neutral-700">
				API
			</button>
			{open && (
				<aside className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-xl flex-col border-l bg-white text-neutral-900 shadow-2xl">
					<header className="flex items-center justify-between border-b px-4 py-3">
						<h2 className="text-sm font-semibold">API calls ({entries.length})</h2>
						<div className="flex items-center gap-2">
							<button type="button" onClick={clear} className="flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-neutral-100"><Trash2Icon className="size-3.5" /> Clear</button>
							<button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 hover:bg-neutral-100"><XIcon className="size-4" /></button>
						</div>
					</header>
					<ul className="flex-1 overflow-y-auto font-mono text-xs">
						{entries.length === 0 && <li className="p-4 text-neutral-500">No calls yet. Use the app; this list refreshes every 3 seconds.</li>}
						{entries.map((e) => {
							const key = `${e.at}-${e.method}-${e.path}`;
							const isOpen = expanded === key;
							return (
								<li key={key} className="border-b">
									<button type="button" onClick={() => setExpanded(isOpen ? null : key)} className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-neutral-50">
										<span className="w-12 shrink-0 font-semibold">{e.method}</span>
										<span className="min-w-0 flex-1 truncate">{e.path}</span>
										<span className={cn("shrink-0 font-semibold", statusClass(e.status))}>{e.status || "ERR"}</span>
										<span className="w-14 shrink-0 text-right text-neutral-500">{e.ms}ms</span>
										<span className="w-16 shrink-0 text-right text-neutral-500">{new Date(e.at).toLocaleTimeString()}</span>
									</button>
									{isOpen && (
										<div className="flex flex-col gap-3 bg-neutral-50 px-4 py-3">
											{(["request", "response"] as const).map((part) => (
												<div key={part}>
													<div className="mb-1 flex items-center justify-between font-sans text-[11px] font-semibold uppercase text-neutral-500">
														{part}
														<button type="button" onClick={() => copy(e[part])} className="flex items-center gap-1 normal-case hover:text-neutral-900"><CopyIcon className="size-3" /> Copy</button>
													</div>
													<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded border bg-white p-2">{e[part] == null ? "—" : pretty(e[part])}</pre>
												</div>
											))}
										</div>
									)}
								</li>
							);
						})}
					</ul>
				</aside>
			)}
		</>
	);
}

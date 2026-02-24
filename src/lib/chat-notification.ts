"use client";

import { toast } from "sonner";

let audioCtx: AudioContext | null = null;
let audioUnlocked = false;

// Unlock AudioContext on first user interaction
if (typeof window !== "undefined") {
	const unlock = () => {
		if (audioUnlocked) return;
		audioUnlocked = true;
		if (!audioCtx) {
			audioCtx = new AudioContext();
		}
		if (audioCtx.state === "suspended") {
			audioCtx.resume();
		}
		window.removeEventListener("click", unlock);
		window.removeEventListener("keydown", unlock);
	};
	window.addEventListener("click", unlock, { once: true });
	window.addEventListener("keydown", unlock, { once: true });
}

/**
 * Plays a short notification chime using the Web Audio API.
 * Two-tone chime: first tone then second tone slightly higher.
 */
export function playNotificationSound() {
	try {
		if (!audioCtx) {
			audioCtx = new AudioContext();
		}

		// Resume if suspended (browser autoplay policy)
		if (audioCtx.state === "suspended") {
			audioCtx.resume();
		}

		const now = audioCtx.currentTime;

		// First tone
		const osc1 = audioCtx.createOscillator();
		const gain1 = audioCtx.createGain();
		osc1.type = "sine";
		osc1.frequency.value = 587.33; // D5
		gain1.gain.setValueAtTime(0.15, now);
		gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
		osc1.connect(gain1);
		gain1.connect(audioCtx.destination);
		osc1.start(now);
		osc1.stop(now + 0.15);

		// Second tone (slightly higher)
		const osc2 = audioCtx.createOscillator();
		const gain2 = audioCtx.createGain();
		osc2.type = "sine";
		osc2.frequency.value = 783.99; // G5
		gain2.gain.setValueAtTime(0.15, now + 0.12);
		gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		osc2.connect(gain2);
		gain2.connect(audioCtx.destination);
		osc2.start(now + 0.12);
		osc2.stop(now + 0.3);
	} catch {
		// AudioContext not supported or blocked
	}
}

/**
 * Request notification permission if not already granted.
 */
export function requestNotificationPermission() {
	if (typeof window === "undefined" || !("Notification" in window)) return;
	if (Notification.permission === "default") {
		Notification.requestPermission();
	}
}

/**
 * Show an in-app toast notification AND a browser desktop notification.
 * - Toast always shows (bottom-right, like WhatsApp desktop)
 * - Browser notification shows only when tab is not focused
 */
export function showMessageNotification(
	senderName: string,
	messageContent: string,
) {
	const body =
		messageContent.length > 100
			? `${messageContent.slice(0, 100)}...`
			: messageContent;

	// In-app toast — always visible
	toast.message(senderName, {
		description: body,
		position: "bottom-right",
		duration: 4000,
	});

	// Browser desktop notification — only when tab is not focused
	if (
		typeof window !== "undefined" &&
		"Notification" in window &&
		Notification.permission === "granted" &&
		!document.hasFocus()
	) {
		const notification = new Notification(senderName, {
			body,
			icon: "/favicon.ico",
			tag: "chat-message",
			silent: true,
		});

		notification.onclick = () => {
			window.focus();
			notification.close();
		};

		setTimeout(() => notification.close(), 5000);
	}
}

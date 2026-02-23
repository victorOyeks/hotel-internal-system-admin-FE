"use client";

let audioCtx: AudioContext | null = null;

/**
 * Plays a short notification chime using the Web Audio API.
 * Two-tone chime: first tone then second tone slightly higher.
 */
export function playNotificationSound() {
	try {
		if (!audioCtx) {
			audioCtx = new AudioContext();
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
 * Show a desktop notification for a new chat message.
 * Only shows when the tab is not focused (like WhatsApp desktop).
 */
export function showMessageNotification(
	senderName: string,
	messageContent: string,
	onClick?: () => void,
) {
	if (typeof window === "undefined" || !("Notification" in window)) return;
	if (Notification.permission !== "granted") return;
	if (document.hasFocus()) return; // Don't show if tab is focused

	const body =
		messageContent.length > 80
			? `${messageContent.slice(0, 80)}...`
			: messageContent;

	const notification = new Notification(senderName, {
		body,
		icon: "/favicon.ico",
		tag: "chat-message", // Replaces previous notification instead of stacking
		silent: true, // We play our own sound
	});

	notification.onclick = () => {
		window.focus();
		notification.close();
		onClick?.();
	};

	// Auto-close after 5 seconds
	setTimeout(() => notification.close(), 5000);
}

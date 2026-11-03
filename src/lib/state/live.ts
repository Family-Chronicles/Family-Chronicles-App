import { effect, signal } from "@bquery/bquery/reactive";
import { API_URL } from "../api/client";
import { sessionSignal } from "./session";
import { fromSignal } from "./svelte";
import { isOwnWrite } from "./ownWrites";
import { notify } from "./toasts";
import { translate } from "../i18n";

/** Change event sent by the server (see server docs/websocket.md) */
export interface LiveChange {
	entity: string;
	action: "created" | "updated" | "deleted";
	ids: string[] | null;
}

type Listener = (change: LiveChange) => void;

const listeners = new Set<Listener>();
const connectedSignal = signal(false);
/** True while the live connection is open */
export const liveConnected = fromSignal(connectedSignal);

function liveUrl(): string {
	const base = new URL(API_URL, window.location.href);
	base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
	return `${base.toString().replace(/\/$/, "")}/live`;
}

let socket: WebSocket | null = null;
let retry: ReturnType<typeof setTimeout> | undefined;
let attempts = 0;

function connect(token: string) {
	socket = new WebSocket(liveUrl());
	socket.onopen = () => socket?.send(JSON.stringify({ type: "auth", token }));
	socket.onmessage = (event) => {
		const message = JSON.parse(event.data);
		if (message.type === "ready") {
			attempts = 0;
			connectedSignal.value = true;
		}
		if (message.type === "change")
			listeners.forEach((l) => l(message as LiveChange));
	};
	socket.onclose = (event) => {
		connectedSignal.value = false;
		socket = null;
		// 4001: token invalid – the next login opens a new connection
		if (event.code !== 4001 && sessionSignal.peek()?.token === token) {
			attempts++;
			retry = setTimeout(
				() => connect(token),
				Math.min(30000, 1000 * 2 ** attempts),
			);
		}
	};
}

function disconnect() {
	clearTimeout(retry);
	socket?.close();
	socket = null;
	connectedSignal.value = false;
}

/** Opens the live connection while somebody is logged in */
export function startLive(): () => void {
	if (typeof WebSocket === "undefined") return () => undefined;
	return effect(() => {
		const token = sessionSignal.value?.token;
		disconnect();
		if (token) connect(token);
	});
}

/**
 * Calls `handler` when one of the given entities changes.
 * Several changes in a short time (e.g. an import) are combined into one call.
 * Returns an unsubscribe function – use it as cleanup in `onMount`.
 */
export function onLiveChange(
	entities: string[],
	handler: (changes: LiveChange[]) => void,
	delay = 300,
) {
	let pending: LiveChange[] = [];
	let timer: ReturnType<typeof setTimeout> | undefined;
	const listener: Listener = (change) => {
		if (!entities.includes(change.entity)) return;
		pending.push(change);
		clearTimeout(timer);
		timer = setTimeout(() => {
			const batch = pending;
			pending = [];
			handler(batch);
		}, delay);
	};
	listeners.add(listener);
	return () => {
		clearTimeout(timer);
		listeners.delete(listener);
	};
}

/**
 * Reloads a page's data when one of the entities changes and tells the user
 * when the change came from someone else.
 */
export function autoReload(
	entities: string[],
	reload: () => Promise<unknown> | unknown,
) {
	return onLiveChange(entities, async () => {
		const own = isOwnWrite();
		await reload();
		if (!own) notify(translate("common.updatedElsewhere"), "info");
	});
}

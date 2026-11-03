import { signal } from "@bquery/bquery/reactive";
import { announceToScreenReader } from "@bquery/bquery/a11y";
import { fromSignal } from "./svelte";

export interface Toast {
	id: number;
	kind: "success" | "error" | "info";
	message: string;
}

const toastSignal = signal<Toast[]>([]);
export const toasts = fromSignal(toastSignal);
let nextId = 1;

export function dismiss(id: number): void {
	toastSignal.update((list) => list.filter((t) => t.id !== id));
}

export function notify(message: string, kind: Toast["kind"] = "success"): void {
	const id = nextId++;
	toastSignal.update((list) => [...list, { id, kind, message }]);
	announceToScreenReader(message, kind === "error" ? "assertive" : "polite");
	setTimeout(() => dismiss(id), kind === "error" ? 8000 : 4000);
}

export function notifyError(error: unknown): void {
	notify(error instanceof Error ? error.message : String(error), "error");
}

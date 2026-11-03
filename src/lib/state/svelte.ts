import { readable, type Readable } from "svelte/store";
import { effect } from "@bquery/bquery/reactive";

/**
 * Bridges a bQuery signal (or computed) into a Svelte store,
 * so components can use `$store` syntax on bQuery state.
 */
export function fromSignal<T>(source: { readonly value: T }): Readable<T> {
	return readable(source.value, (set) => effect(() => set(source.value)));
}

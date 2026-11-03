<script lang="ts">
	import type { Snippet } from "svelte";
	import Modal from "./Modal.svelte";
	import { t } from "../lib/i18n";

	let {
		title,
		message,
		confirmLabel,
		class: className = "btn-danger",
		onconfirm,
		children,
	}: {
		title?: string;
		message: string;
		confirmLabel?: string;
		class?: string;
		onconfirm: () => Promise<void> | void;
		children: Snippet;
	} = $props();

	let open = $state(false);
	let busy = $state(false);

	async function confirm() {
		busy = true;
		try {
			await onconfirm();
			open = false;
		} finally {
			busy = false;
		}
	}
</script>

<button type="button" class={className} onclick={() => (open = true)}
	>{@render children()}</button
>

<Modal bind:open title={title ?? $t("common.confirmDelete")} size="sm">
	<p class="text-sm text-stone-700">{message}</p>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (open = false)}
			>{$t("common.cancel")}</button
		>
		<button class="btn-danger" disabled={busy} onclick={confirm}
			>{confirmLabel ?? $t("common.delete")}</button
		>
	{/snippet}
</Modal>

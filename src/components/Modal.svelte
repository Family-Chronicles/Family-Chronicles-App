<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		open = $bindable(false),
		title,
		size = "md",
		children,
		footer,
	}: {
		open?: boolean;
		title: string;
		size?: "sm" | "md" | "lg" | "xl";
		children: Snippet;
		footer?: Snippet;
	} = $props();

	let dialog = $state<HTMLDialogElement | undefined>();
	const widths = {
		sm: "max-w-md",
		md: "max-w-xl",
		lg: "max-w-3xl",
		xl: "max-w-5xl",
	};

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	onclick={(e) => e.target === dialog && (open = false)}
	class="m-auto w-[calc(100%-2rem)] {widths[
		size
	]} rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
	aria-labelledby="modal-title"
>
	{#if open}
		<div
			class="flex items-center justify-between border-b border-bark-100 px-6 py-4"
		>
			<h2 id="modal-title" class="text-lg font-semibold text-bark-900">
				{title}
			</h2>
			<button
				class="text-stone-400 hover:text-stone-700"
				onclick={() => (open = false)}
				aria-label="Schließen">✕</button
			>
		</div>
		<div class="max-h-[70vh] overflow-y-auto px-6 py-4">
			{@render children()}
		</div>
		{#if footer}
			<div class="flex justify-end gap-2 border-t border-bark-100 px-6 py-4">
				{@render footer()}
			</div>
		{/if}
	{/if}
</dialog>

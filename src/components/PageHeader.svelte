<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		title,
		subtitle,
		actions,
	}: { title: string; subtitle?: string; actions?: Snippet } = $props();
</script>

<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="text-3xl font-semibold text-bark-900">{title}</h1>
		{#if subtitle}<p class="mt-1 text-stone-600">{subtitle}</p>{/if}
	</div>
	{#if actions}<div class="flex flex-wrap gap-2">{@render actions()}</div>{/if}
</div>

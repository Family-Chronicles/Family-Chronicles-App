<script lang="ts">
	import type { Snippet } from "svelte";
	let { message, children }: { message: string; children?: Snippet } = $props();
</script>

<div
	class="rounded-xl border border-dashed border-bark-200 p-8 text-center text-sm text-stone-500"
>
	<p>{message}</p>
	{#if children}<div class="mt-4">{@render children()}</div>{/if}
</div>

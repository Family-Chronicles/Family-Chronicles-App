<script lang="ts">
	import type { DateString } from "../lib/api/types";
	import { formatDate, parseDateInput } from "../lib/format";

	let {
		value = $bindable<DateString>(null),
		label,
		id,
	}: { value?: DateString; label: string; id: string } = $props();

	let text = $state(formatDate(value));
	let invalid = $state(false);

	function commit() {
		const parsed = parseDateInput(text);
		invalid = parsed === undefined;
		if (!invalid) value = parsed ?? null;
	}
</script>

<div>
	<label class="label" for={id}>{label}</label>
	<input
		{id}
		class="input"
		class:border-red-500={invalid}
		placeholder="TT.MM.JJJJ, MM.JJJJ oder JJJJ"
		bind:value={text}
		oninput={commit}
		aria-invalid={invalid}
		aria-describedby={invalid ? `${id}-error` : undefined}
	/>
	{#if invalid}
		<p id="{id}-error" class="mt-1 text-xs text-red-700">
			Bitte z. B. 12.04.1901, 04.1901 oder 1901 eingeben.
		</p>
	{/if}
</div>

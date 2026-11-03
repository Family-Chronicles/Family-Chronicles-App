<script lang="ts">
	import { onMount } from "svelte";
	import { api } from "../lib/api/client";
	import type { Person } from "../lib/api/types";
	import { fullName, years } from "../lib/format";

	let {
		value = $bindable<string | null>(null),
		exclude = [],
		label = "Person",
		id = "person-picker",
	}: {
		value?: string | null;
		exclude?: string[];
		label?: string;
		id?: string;
	} = $props();

	let persons = $state<Person[]>([]);
	let query = $state("");
	let focused = $state(false);

	onMount(async () => {
		persons = await api.persons.list();
	});

	let selected = $derived(persons.find((p) => p.Id === value) ?? null);
	let matches = $derived.by(() => {
		const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
		return persons
			.filter((p) => !exclude.includes(p.Id))
			.filter((p) => terms.every((t) => fullName(p).toLowerCase().includes(t)))
			.slice(0, 8);
	});

	function choose(p: Person) {
		value = p.Id;
		query = "";
		focused = false;
	}
</script>

<div class="relative">
	<label class="label" for={id}>{label}</label>
	{#if selected}
		<div
			class="flex items-center justify-between rounded-lg border border-bark-200 bg-bark-50 px-3 py-2 text-sm"
		>
			<span
				>{fullName(selected)}
				<span class="text-stone-500">{years(selected)}</span></span
			>
			<button type="button" class="link text-xs" onclick={() => (value = null)}
				>ändern</button
			>
		</div>
	{:else}
		<input
			{id}
			class="input"
			placeholder="Name eingeben …"
			autocomplete="off"
			bind:value={query}
			onfocus={() => (focused = true)}
			onblur={() => setTimeout(() => (focused = false), 150)}
		/>
		{#if focused && matches.length}
			<ul
				class="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-bark-100 bg-white py-1 shadow-lg"
				role="listbox"
			>
				{#each matches as p (p.Id)}
					<li role="option" aria-selected="false">
						<button
							type="button"
							class="w-full px-3 py-2 text-left text-sm hover:bg-bark-50"
							onmousedown={() => choose(p)}
						>
							{fullName(p)} <span class="text-stone-500">{years(p)}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

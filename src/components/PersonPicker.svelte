<script lang="ts">
	import { t } from "../lib/i18n";
	import { api } from "../lib/api/client";
	import type { Person } from "../lib/api/types";
	import { fullName, years } from "../lib/format";

	let {
		value = $bindable<string | null>(null),
		exclude = [],
		label,
		id = "person-picker",
	}: {
		value?: string | null;
		exclude?: string[];
		label?: string;
		id?: string;
	} = $props();

	let results = $state<Person[]>([]);
	let selected = $state<Person | null>(null);
	let query = $state("");
	let focused = $state(false);

	// search on the server while typing
	let timer: ReturnType<typeof setTimeout> | undefined;
	let requestId = 0;
	$effect(() => {
		const q = query.trim();
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const id = ++requestId;
			const page = await api.persons.search({ q, limit: 8 + exclude.length });
			if (id === requestId) results = page.items;
		}, 150);
	});

	// keep the selected person in sync with the bound value
	$effect(() => {
		const id = value;
		if (!id) {
			selected = null;
			return;
		}
		if (selected?.Id === id) return;
		api.persons.byIds([id]).then((found) => (selected = found[0] ?? null));
	});

	let matches = $derived(
		results.filter((p) => !exclude.includes(p.Id)).slice(0, 8),
	);

	function choose(p: Person) {
		selected = p;
		value = p.Id;
		query = "";
		focused = false;
	}
</script>

<div class="relative">
	<label class="label" for={id}>{label ?? $t("common.person")}</label>
	{#if selected}
		<div
			class="flex items-center justify-between rounded-lg border border-bark-200 bg-bark-50 px-3 py-2 text-sm"
		>
			<span
				>{fullName(selected)}
				<span class="text-stone-500">{years(selected)}</span></span
			>
			<button type="button" class="link text-xs" onclick={() => (value = null)}
				>{$t("common.change")}</button
			>
		</div>
	{:else}
		<input
			{id}
			class="input"
			placeholder={$t("common.typeName")}
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

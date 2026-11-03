<script lang="ts">
	import { onMount } from "svelte";
	import { api } from "../lib/api/client";
	import type { Person } from "../lib/api/types";
	import { fullName, lifespan } from "../lib/format";
	import { href } from "../lib/router";
	import { canEdit } from "../lib/state/session";
	import { notifyError } from "../lib/state/toasts";
	import PageHeader from "../components/PageHeader.svelte";
	import Loading from "../components/Loading.svelte";
	import Empty from "../components/Empty.svelte";
	import Avatar from "../components/Avatar.svelte";

	let persons = $state<Person[]>([]);
	let loading = $state(true);
	let query = $state("");
	let filter = $state<"all" | "living" | "deceased">("all");

	onMount(async () => {
		try {
			persons = await api.persons.list();
		} catch (e) {
			notifyError(e);
		} finally {
			loading = false;
		}
	});

	const norm = (s: string) =>
		s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
	let shown = $derived.by(() => {
		const terms = norm(query).split(/\s+/).filter(Boolean);
		return persons
			.filter(
				(p) => filter === "all" || (filter === "living") === !p.DateOfDeath,
			)
			.filter((p) => {
				const hay = norm(
					`${fullName(p)} ${p.BirthName ?? ""} ${p.PlaceOfBirth ?? ""}`,
				);
				return terms.every((t) => hay.includes(t));
			});
	});
</script>

<PageHeader
	title="Personen"
	subtitle="{persons.length} Personen in der Chronik"
>
	{#snippet actions()}
		{#if $canEdit}<a class="btn-primary" href={href("/persons/new")}
				>+ Person anlegen</a
			>{/if}
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-wrap gap-3">
	<label class="sr-only" for="search">Suchen</label>
	<input
		id="search"
		class="input max-w-sm"
		type="search"
		placeholder="Name, Geburtsname oder Ort …"
		bind:value={query}
	/>
	<div
		class="inline-flex rounded-lg border border-bark-200 bg-white p-0.5 text-sm"
		role="group"
		aria-label="Filter"
	>
		{#each [["all", "Alle"], ["living", "Lebend"], ["deceased", "Verstorben"]] as [key, label] (key)}
			<button
				class="rounded-md px-3 py-1.5 {filter === key
					? 'bg-bark-100 font-medium text-bark-900'
					: 'text-stone-600'}"
				aria-pressed={filter === key}
				onclick={() => (filter = key as typeof filter)}>{label}</button
			>
		{/each}
	</div>
</div>

{#if loading}
	<Loading />
{:else if shown.length === 0}
	<Empty
		message={persons.length
			? "Keine Person passt zur Suche."
			: "Noch keine Personen erfasst."}
	/>
{:else}
	<ul class="card divide-y divide-bark-50">
		{#each shown as p (p.Id)}
			<li>
				<a
					href={href(`/persons/${p.Id}`)}
					class="flex items-center gap-4 px-4 py-3 hover:bg-bark-50"
				>
					<Avatar person={p} />
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium text-bark-900">
							{fullName(p)}
							{#if p.BirthName}<span class="font-normal text-stone-500"
									>geb. {p.BirthName}</span
								>{/if}
						</p>
						<p class="truncate text-sm text-stone-500">
							{lifespan(p)}{#if p.PlaceOfBirth}{lifespan(p)
									? " · "
									: ""}{p.PlaceOfBirth}{/if}
						</p>
					</div>
					<span class="text-bark-300" aria-hidden="true">›</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}

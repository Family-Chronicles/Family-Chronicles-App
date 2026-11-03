<script lang="ts">
	import { onMount } from "svelte";
	import { api } from "../lib/api/client";
	import type { Person } from "../lib/api/types";
	import { fullName, lifespan } from "../lib/format";
	import { href } from "../lib/router";
	import { canEdit } from "../lib/state/session";
	import { notifyError } from "../lib/state/toasts";
	import { autoReload } from "../lib/state/live";
	import { t } from "../lib/i18n";
	import PageHeader from "../components/PageHeader.svelte";
	import Loading from "../components/Loading.svelte";
	import Empty from "../components/Empty.svelte";
	import Avatar from "../components/Avatar.svelte";

	let persons = $state<Person[]>([]);
	let loading = $state(true);
	let query = $state("");
	let filter = $state<"all" | "living" | "deceased">("all");

	async function load() {
		try {
			persons = await api.persons.list();
		} catch (e) {
			notifyError(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		load();
		return autoReload(["persons"], load);
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
				return terms.every((term) => hay.includes(term));
			});
	});
	const filters = ["all", "living", "deceased"] as const;
</script>

<PageHeader
	title={$t("persons.title")}
	subtitle={$t("persons.count", { count: persons.length })}
>
	{#snippet actions()}
		{#if $canEdit}<a class="btn-primary" href={href("/persons/new")}
				>{$t("persons.create")}</a
			>{/if}
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-wrap gap-3">
	<label class="sr-only" for="search">{$t("common.search")}</label>
	<input
		id="search"
		class="input max-w-sm"
		type="search"
		placeholder={$t("persons.searchPlaceholder")}
		bind:value={query}
	/>
	<div
		class="inline-flex rounded-lg border border-bark-200 bg-white p-0.5 text-sm"
		role="group"
		aria-label={$t("persons.filter")}
	>
		{#each filters as key (key)}
			<button
				class="rounded-md px-3 py-1.5 {filter === key
					? 'bg-bark-100 font-medium text-bark-900'
					: 'text-stone-600'}"
				aria-pressed={filter === key}
				onclick={() => (filter = key)}>{$t(`persons.${key}`)}</button
			>
		{/each}
	</div>
</div>

{#if loading}
	<Loading />
{:else if shown.length === 0}
	<Empty
		message={persons.length ? $t("persons.noMatch") : $t("persons.empty")}
	/>
{:else}
	<ul class="card divide-y divide-bark-50" data-testid="person-list">
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
									>{$t("persons.born", { name: p.BirthName })}</span
								>{/if}
						</p>
						<p class="truncate text-sm text-stone-500">
							{[lifespan(p), p.PlaceOfBirth].filter(Boolean).join(" · ")}
						</p>
					</div>
					<span class="text-bark-300" aria-hidden="true">›</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}

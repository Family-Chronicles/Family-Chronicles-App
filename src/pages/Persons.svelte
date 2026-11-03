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

	const PAGE_SIZE = 50;

	let persons = $state<Person[]>([]);
	let total = $state(0);
	let everything = $state(0);
	let loading = $state(true);
	let loadingMore = $state(false);
	let query = $state("");
	let filter = $state<"all" | "living" | "deceased">("all");
	const filters = ["all", "living", "deceased"] as const;

	/** Only the newest request may write results (typing fires several) */
	let requestId = 0;

	async function load(append = false) {
		const id = ++requestId;
		const offset = append ? persons.length : 0;
		try {
			const page = await api.persons.search({
				q: query.trim(),
				living: filter === "all" ? undefined : filter === "living",
				limit: append ? PAGE_SIZE : Math.max(PAGE_SIZE, persons.length),
				offset,
			});
			if (id !== requestId) return;
			persons = append ? [...persons, ...page.items] : page.items;
			total = page.total;
			if (!query.trim() && filter === "all") everything = page.total;
		} catch (e) {
			notifyError(e);
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	async function loadMore() {
		loadingMore = true;
		await load(true);
	}

	// search on the server, slightly delayed while typing
	let timer: ReturnType<typeof setTimeout> | undefined;
	let first = true;
	$effect(() => {
		void query;
		void filter;
		if (first) {
			first = false;
			return;
		}
		clearTimeout(timer);
		timer = setTimeout(() => {
			persons = [];
			load();
		}, 250);
	});

	onMount(() => {
		load();
		return autoReload(["persons"], () => load());
	});
</script>

<PageHeader
	title={$t("persons.title")}
	subtitle={$t("persons.count", { count: everything })}
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
{:else if persons.length === 0}
	<Empty message={everything ? $t("persons.noMatch") : $t("persons.empty")} />
{:else}
	<ul class="card divide-y divide-bark-50" data-testid="person-list">
		{#each persons as p (p.Id)}
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
	<div class="mt-4 flex items-center justify-between text-sm text-stone-500">
		<span data-testid="person-count-shown"
			>{$t("persons.showing", { shown: persons.length, total })}</span
		>
		{#if persons.length < total}
			<button class="btn-secondary" disabled={loadingMore} onclick={loadMore}
				>{$t("persons.loadMore")}</button
			>
		{/if}
	</div>
{/if}

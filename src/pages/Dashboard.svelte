<script lang="ts">
	import { onMount } from "svelte";
	import { api } from "../lib/api/client";
	import type { Family, Person } from "../lib/api/types";
	import { href } from "../lib/router";
	import { canEdit, currentUser } from "../lib/state/session";
	import { notifyError } from "../lib/state/toasts";
	import { autoReload } from "../lib/state/live";
	import { t } from "../lib/i18n";
	import Loading from "../components/Loading.svelte";
	import PersonLink from "../components/PersonLink.svelte";
	import Empty from "../components/Empty.svelte";

	let persons = $state<Person[]>([]);
	let families = $state<Family[]>([]);
	let loading = $state(true);

	async function load() {
		try {
			[persons, families] = await Promise.all([
				api.persons.list(),
				api.families.list(),
			]);
		} catch (e) {
			notifyError(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		load();
		return autoReload(["persons", "families"], load);
	});

	let recent = $derived(
		[...persons]
			.sort((a, b) => b.UpdatedAt.localeCompare(a.UpdatedAt))
			.slice(0, 6),
	);
	const today = new Date();
	let anniversaries = $derived(
		persons
			.filter((p) => p.DateOfBirth?.length === 10)
			.filter(
				(p) => Number(p.DateOfBirth!.slice(5, 7)) === today.getMonth() + 1,
			)
			.sort((a, b) =>
				a.DateOfBirth!.slice(8).localeCompare(b.DateOfBirth!.slice(8)),
			),
	);
	let living = $derived(persons.filter((p) => !p.DateOfDeath).length);

	const birthday = (p: Person) => {
		const age = today.getFullYear() - Number(p.DateOfBirth!.slice(0, 4));
		const day = `${p.DateOfBirth!.slice(8)}.${p.DateOfBirth!.slice(5, 7)}.`;
		return `${day} – ${$t(p.DateOfDeath ? "dashboard.wouldTurn" : "dashboard.turns", { age })}`;
	};
</script>

<h1 class="text-3xl font-semibold text-bark-900">
	{$t("dashboard.welcome", { name: $currentUser?.Name ?? "" })}
</h1>
<p class="mt-1 text-stone-600">{$t("dashboard.intro")}</p>

{#if loading}
	<Loading />
{:else}
	<div class="mt-8 grid gap-4 sm:grid-cols-3">
		<a href={href("/persons")} class="card p-5 hover:border-bark-300">
			<p class="text-sm text-stone-500">{$t("dashboard.persons")}</p>
			<p
				class="mt-1 font-serif text-4xl font-semibold text-bark-800"
				data-testid="person-count"
			>
				{persons.length}
			</p>
		</a>
		<a href={href("/families")} class="card p-5 hover:border-bark-300">
			<p class="text-sm text-stone-500">{$t("dashboard.families")}</p>
			<p class="mt-1 font-serif text-4xl font-semibold text-bark-800">
				{families.length}
			</p>
		</a>
		<div class="card p-5">
			<p class="text-sm text-stone-500">{$t("dashboard.living")}</p>
			<p class="mt-1 font-serif text-4xl font-semibold text-bark-800">
				{living}
			</p>
		</div>
	</div>

	<div class="mt-8 grid gap-6 lg:grid-cols-2">
		<section class="card p-5">
			<h2 class="mb-3 text-lg font-semibold">{$t("dashboard.recent")}</h2>
			{#if recent.length}
				<div class="grid gap-1 sm:grid-cols-2">
					{#each recent as p (p.Id)}<PersonLink person={p} />{/each}
				</div>
			{:else}
				<Empty message={$t("dashboard.noPersons")}>
					{#if $canEdit}<a class="btn-primary" href={href("/persons/new")}
							>{$t("dashboard.createFirst")}</a
						>{/if}
				</Empty>
			{/if}
		</section>
		<section class="card p-5">
			<h2 class="mb-3 text-lg font-semibold">{$t("dashboard.birthdays")}</h2>
			{#if anniversaries.length}
				<div class="grid gap-1 sm:grid-cols-2">
					{#each anniversaries as p (p.Id)}<PersonLink
							person={p}
							sub={birthday(p)}
						/>{/each}
				</div>
			{:else}
				<p class="text-sm text-stone-500">{$t("dashboard.noBirthdays")}</p>
			{/if}
		</section>
	</div>
{/if}

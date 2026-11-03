<script lang="ts">
	import { onMount } from "svelte";
	import { api } from "../lib/api/client";
	import type { Family, Person } from "../lib/api/types";
	import { href } from "../lib/router";
	import { canEdit, currentUser } from "../lib/state/session";
	import { notifyError } from "../lib/state/toasts";
	import Loading from "../components/Loading.svelte";
	import PersonLink from "../components/PersonLink.svelte";
	import Empty from "../components/Empty.svelte";

	let persons = $state<Person[]>([]);
	let families = $state<Family[]>([]);
	let loading = $state(true);

	onMount(async () => {
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
	});

	let recent = $derived(
		[...persons]
			.sort((a, b) => b.UpdatedAt.localeCompare(a.UpdatedAt))
			.slice(0, 6),
	);
	let today = new Date();
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
</script>

<h1 class="text-3xl font-semibold text-bark-900">
	Willkommen, {$currentUser?.Name}
</h1>
<p class="mt-1 text-stone-600">
	Hier ist der aktuelle Stand eurer Familienchronik.
</p>

{#if loading}
	<Loading />
{:else}
	<div class="mt-8 grid gap-4 sm:grid-cols-3">
		<a href={href("/persons")} class="card p-5 hover:border-bark-300">
			<p class="text-sm text-stone-500">Personen</p>
			<p class="mt-1 font-serif text-4xl font-semibold text-bark-800">
				{persons.length}
			</p>
		</a>
		<a href={href("/families")} class="card p-5 hover:border-bark-300">
			<p class="text-sm text-stone-500">Familien</p>
			<p class="mt-1 font-serif text-4xl font-semibold text-bark-800">
				{families.length}
			</p>
		</a>
		<div class="card p-5">
			<p class="text-sm text-stone-500">davon lebend</p>
			<p class="mt-1 font-serif text-4xl font-semibold text-bark-800">
				{living}
			</p>
		</div>
	</div>

	<div class="mt-8 grid gap-6 lg:grid-cols-2">
		<section class="card p-5">
			<h2 class="mb-3 text-lg font-semibold">Zuletzt bearbeitet</h2>
			{#if recent.length}
				<div class="grid gap-1 sm:grid-cols-2">
					{#each recent as p (p.Id)}<PersonLink person={p} />{/each}
				</div>
			{:else}
				<Empty message="Noch keine Personen erfasst.">
					{#if $canEdit}<a class="btn-primary" href={href("/persons/new")}
							>Erste Person anlegen</a
						>{/if}
				</Empty>
			{/if}
		</section>
		<section class="card p-5">
			<h2 class="mb-3 text-lg font-semibold">Geburtstage in diesem Monat</h2>
			{#if anniversaries.length}
				<div class="grid gap-1 sm:grid-cols-2">
					{#each anniversaries as p (p.Id)}
						<PersonLink
							person={p}
							sub="{p.DateOfBirth!.slice(8)}.{p.DateOfBirth!.slice(
								5,
								7,
							)}. – {p.DateOfDeath ? 'wäre' : 'wird'} {today.getFullYear() -
								Number(p.DateOfBirth!.slice(0, 4))}"
						/>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-stone-500">Keine Geburtstage in diesem Monat.</p>
			{/if}
		</section>
	</div>
{/if}

<script lang="ts">
	import { onMount } from "svelte";
	import { api } from "../lib/api/client";
	import type {
		Media,
		Membership,
		Person,
		Relationship,
	} from "../lib/api/types";
	import { formatDate, fullName } from "../lib/format";
	import { go, href } from "../lib/router";
	import { canEdit } from "../lib/state/session";
	import { notify, notifyError } from "../lib/state/toasts";
	import { autoReload } from "../lib/state/live";
	import { t } from "../lib/i18n";
	import Loading from "../components/Loading.svelte";
	import Avatar from "../components/Avatar.svelte";
	import ConfirmButton from "../components/ConfirmButton.svelte";
	import RelationshipsSection from "../components/RelationshipsSection.svelte";
	import FamiliesSection from "../components/FamiliesSection.svelte";
	import MediaSection from "../components/MediaSection.svelte";

	let { params }: { params: Record<string, string> } = $props();
	const id = $derived(params.id);

	let person = $state<Person | null>(null);
	let relationships = $state<Relationship[]>([]);
	let memberships = $state<Membership[]>([]);
	let media = $state<{ Own: Media[]; Tagged: Media[] }>({
		Own: [],
		Tagged: [],
	});
	let persons = $state(new Map<string, Person>());
	let loading = $state(true);
	let missing = $state(false);

	async function load() {
		try {
			const [p, rels, mems, med, all] = await Promise.all([
				api.persons.get(id),
				api.persons.relationships(id),
				api.persons.families(id),
				api.persons.media(id),
				api.persons.list(),
			]);
			person = p;
			relationships = rels;
			memberships = mems;
			media = med;
			persons = new Map(all.map((x) => [x.Id, x]));
			missing = false;
		} catch (e) {
			if ((e as { status?: number }).status === 404) missing = true;
			else notifyError(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		load();
		return autoReload(
			["persons", "relationships", "memberships", "families", "media", "tags"],
			load,
		);
	});

	async function remove() {
		await api.persons.remove(id);
		notify($t("person.deleted"));
		go("/persons");
	}

	const place = (date: string | null, where: string | null) =>
		date && where
			? $t("person.bornIn", { date: formatDate(date), place: where })
			: formatDate(date) || where || "";

	const facts = $derived(
		person
			? [
					[$t("person.gender"), $t(`gender.${person.Gender}`)],
					[$t("person.birthName"), person.BirthName],
					[$t("person.born"), place(person.DateOfBirth, person.PlaceOfBirth)],
					[$t("person.died"), place(person.DateOfDeath, person.PlaceOfDeath)],
					[$t("person.causeOfDeath"), person.CauseOfDeath],
				].filter(([, v]) => v)
			: [],
	);
</script>

{#if loading}
	<Loading />
{:else if missing || !person}
	<p class="text-stone-600">
		{$t("person.missing")}
		<a class="link" href={href("/persons")}>{$t("common.toOverview")}</a>
	</p>
{:else}
	<div class="mb-6 flex flex-wrap items-center gap-4">
		<Avatar {person} size="lg" />
		<div class="min-w-0 flex-1">
			<h1 class="text-3xl font-semibold text-bark-900">{fullName(person)}</h1>
			<p class="text-stone-600">
				{#if person.DateOfBirth}* {formatDate(person.DateOfBirth)}{/if}
				{#if person.DateOfDeath}&nbsp;† {formatDate(person.DateOfDeath)}{/if}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<a class="btn-secondary" href={href(`/persons/${id}/tree`)}
				>{$t("person.tree")}</a
			>
			{#if $canEdit}
				<a class="btn-primary" href={href(`/persons/${id}/edit`)}
					>{$t("common.edit")}</a
				>
				<ConfirmButton
					message={$t("person.deleteMessage", { name: fullName(person) })}
					onconfirm={remove}>{$t("common.delete")}</ConfirmButton
				>
			{/if}
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<div class="space-y-6 lg:col-span-1">
			<section class="card p-5">
				<h2 class="mb-3 text-lg font-semibold">{$t("person.data")}</h2>
				<dl class="space-y-2 text-sm">
					{#each facts as [label, value] (label)}
						<div>
							<dt class="text-xs tracking-wide text-stone-500 uppercase">
								{label}
							</dt>
							<dd class="text-bark-900">{value}</dd>
						</div>
					{/each}
				</dl>
				{#if person.Notes}
					<h3 class="mt-4 mb-1 text-xs tracking-wide text-stone-500 uppercase">
						{$t("common.notes")}
					</h3>
					<p class="text-sm whitespace-pre-wrap">{person.Notes}</p>
				{/if}
			</section>
			<FamiliesSection {person} {memberships} onchange={load} />
		</div>
		<div class="space-y-6 lg:col-span-2">
			<RelationshipsSection
				{person}
				{relationships}
				{persons}
				onchange={load}
			/>
			<MediaSection
				{person}
				own={media.Own}
				tagged={media.Tagged}
				{persons}
				onchange={load}
			/>
		</div>
	</div>
{/if}

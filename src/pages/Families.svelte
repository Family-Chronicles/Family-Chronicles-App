<script lang="ts">
	import { t } from "../lib/i18n";
	import { onMount } from "svelte";
	import { autoReload } from "../lib/state/live";
	import { api } from "../lib/api/client";
	import type { Family, FamilyInput } from "../lib/api/types";
	import { go, href } from "../lib/router";
	import { canEdit } from "../lib/state/session";
	import { notify, notifyError } from "../lib/state/toasts";
	import PageHeader from "../components/PageHeader.svelte";
	import Loading from "../components/Loading.svelte";
	import Empty from "../components/Empty.svelte";
	import FamilyForm from "../components/FamilyForm.svelte";

	let families = $state<Family[]>([]);
	let loading = $state(true);
	let formOpen = $state(false);

	async function load() {
		try {
			families = await api.families.list();
		} catch (e) {
			notifyError(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		load();
		return autoReload(["families", "memberships"], load);
	});

	async function create(data: FamilyInput) {
		try {
			const family = await api.families.create(data);
			notify($t("families.created"));
			go(`/families/${family.Id}`);
		} catch (e) {
			notifyError(e);
			throw e;
		}
	}
</script>

<PageHeader title={$t("families.title")} subtitle={$t("families.subtitle")}>
	{#snippet actions()}
		{#if $canEdit}<button class="btn-primary" onclick={() => (formOpen = true)}
				>{$t("families.create")}</button
			>{/if}
	{/snippet}
</PageHeader>

{#if loading}
	<Loading />
{:else if families.length === 0}
	<Empty message={$t("families.empty")} />
{:else}
	<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each families as f (f.Id)}
			<li>
				<a
					href={href(`/families/${f.Id}`)}
					class="card block h-full p-5 transition hover:border-bark-300"
				>
					<h2 class="text-xl font-semibold text-bark-900">{f.Name}</h2>
					{#if f.HistoricalNames.length}<p class="text-sm text-stone-500">
							{$t("families.also", { names: f.HistoricalNames.join(", ") })}
						</p>{/if}
					{#if f.Description}<p
							class="mt-2 line-clamp-2 text-sm text-stone-700"
						>
							{f.Description}
						</p>{/if}
					<p class="mt-3 chip">
						{$t("families.members", { count: f.MemberCount ?? 0 })}
					</p>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<FamilyForm bind:open={formOpen} onsave={create} />

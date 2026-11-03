<script lang="ts">
	import { api } from "../lib/api/client";
	import type { FamilyTree } from "../lib/api/types";
	import { fullName } from "../lib/format";
	import { href } from "../lib/router";
	import { notifyError } from "../lib/state/toasts";
	import Loading from "../components/Loading.svelte";
	import PageHeader from "../components/PageHeader.svelte";
	import AncestorTree from "../components/AncestorTree.svelte";
	import DescendantTree from "../components/DescendantTree.svelte";
	import TreeCard from "../components/TreeCard.svelte";

	let { params }: { params: Record<string, string> } = $props();

	let tree = $state<FamilyTree | null>(null);
	let depth = $state(3);
	let view = $state<"ancestors" | "descendants">("ancestors");

	$effect(() => {
		const d = depth;
		api.persons
			.tree(params.id, d)
			.then((t) => (tree = t))
			.catch(notifyError);
	});
</script>

{#if !tree}
	<Loading />
{:else}
	<PageHeader title="Stammbaum" subtitle={fullName(tree.Root)}>
		{#snippet actions()}
			<div
				class="inline-flex rounded-lg border border-bark-200 bg-white p-0.5 text-sm"
				role="group"
				aria-label="Ansicht"
			>
				<button
					class="rounded-md px-3 py-1.5 {view === 'ancestors'
						? 'bg-bark-100 font-medium'
						: ''}"
					aria-pressed={view === "ancestors"}
					onclick={() => (view = "ancestors")}>Vorfahren</button
				>
				<button
					class="rounded-md px-3 py-1.5 {view === 'descendants'
						? 'bg-bark-100 font-medium'
						: ''}"
					aria-pressed={view === "descendants"}
					onclick={() => (view = "descendants")}>Nachkommen</button
				>
			</div>
			<label class="flex items-center gap-2 text-sm">
				Generationen
				<select class="input w-20" bind:value={depth}>
					{#each [1, 2, 3, 4, 5, 6] as d (d)}<option value={d}>{d}</option
						>{/each}
				</select>
			</label>
			<a class="btn-secondary" href={href(`/persons/${params.id}`)}
				>Zur Person</a
			>
		{/snippet}
	</PageHeader>

	<div class="card overflow-auto p-6">
		{#if view === "ancestors"}
			{#if tree.Ancestors.Parents.length === 0}
				<p class="mb-4 text-sm text-stone-500">Es sind keine Eltern erfasst.</p>
			{/if}
			<AncestorTree node={tree.Ancestors} root />
		{:else}
			{#if tree.Descendants.Children.length === 0 && tree.Descendants.Partners.length === 0}
				<p class="mb-4 text-sm text-stone-500">
					Es sind keine Partner oder Kinder erfasst.
				</p>
			{/if}
			<div class="inline-block min-w-full">
				<DescendantTree node={tree.Descendants} root />
			</div>
		{/if}
	</div>

	{#if tree.Siblings.length}
		<section class="mt-6">
			<h2 class="mb-3 text-lg font-semibold">Geschwister</h2>
			<div class="flex flex-wrap gap-3">
				{#each tree.Siblings as s (s.Id)}<TreeCard person={s} />{/each}
			</div>
		</section>
	{/if}
{/if}

<script lang="ts">
	import { api } from "../lib/api/client";
	import type { Peer, RemoteTree } from "../lib/api/types";
	import { fullName } from "../lib/format";
	import { go, href } from "../lib/router";
	import { canEdit } from "../lib/state/session";
	import { notify, notifyError } from "../lib/state/toasts";
	import { t } from "../lib/i18n";
	import Loading from "../components/Loading.svelte";
	import PageHeader from "../components/PageHeader.svelte";
	import AncestorTree from "../components/AncestorTree.svelte";
	import DescendantTree from "../components/DescendantTree.svelte";
	import TreeCard from "../components/TreeCard.svelte";

	/** Family tree of a person on another instance (read only) */
	let { params }: { params: Record<string, string> } = $props();

	let tree = $state<RemoteTree | null>(null);
	let peer = $state<Peer | null>(null);
	let error = $state("");
	let depth = $state(3);
	let view = $state<"ancestors" | "descendants">("ancestors");
	let busy = $state(false);

	$effect(() => {
		const d = depth;
		error = "";
		api.federation
			.tree(params.peerId, params.remoteId, d)
			.then((result) => (tree = result))
			.catch((e) => (error = (e as Error).message));
		api.federation
			.peers()
			.then((all) => (peer = all.find((p) => p.Id === params.peerId) ?? null))
			.catch(() => undefined);
	});

	// cards lead to the tree of that person on the same instance
	const linkFor = (p: { Id: string }) =>
		href(`/federation/${params.peerId}/persons/${p.Id}/tree`);

	async function takeOver() {
		busy = true;
		try {
			const { Person } = await api.federation.importPerson(
				params.peerId,
				params.remoteId,
			);
			notify($t("federation.takenOver"));
			go(`/persons/${Person.Id}`);
		} catch (e) {
			notifyError(e);
		} finally {
			busy = false;
		}
	}
</script>

{#if error}
	<p class="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
		{error}
	</p>
{:else if !tree}
	<Loading />
{:else}
	<PageHeader
		title={`${$t("federation.remoteTree")}: ${fullName(tree.Root)}`}
		subtitle={$t("federation.fromInstance", { instance: peer?.Name ?? "…" })}
	>
		{#snippet actions()}
			<div
				class="inline-flex rounded-lg border border-bark-200 bg-white p-0.5 text-sm"
				role="group"
				aria-label={$t("tree.view")}
			>
				<button
					class="rounded-md px-3 py-1.5 {view === 'ancestors'
						? 'bg-bark-100 font-medium'
						: ''}"
					aria-pressed={view === "ancestors"}
					onclick={() => (view = "ancestors")}>{$t("tree.ancestors")}</button
				>
				<button
					class="rounded-md px-3 py-1.5 {view === 'descendants'
						? 'bg-bark-100 font-medium'
						: ''}"
					aria-pressed={view === "descendants"}
					onclick={() => (view = "descendants")}
					>{$t("tree.descendants")}</button
				>
			</div>
			<label class="flex items-center gap-2 text-sm">
				{$t("tree.generations")}
				<select class="input w-20" bind:value={depth}>
					{#each [1, 2, 3, 4, 5] as d (d)}<option value={d}>{d}</option>{/each}
				</select>
			</label>
			{#if $canEdit}
				<button
					class="btn-primary"
					disabled={busy}
					title={$t("federation.takeOverHint")}
					onclick={takeOver}>{$t("federation.takeOver")}</button
				>
			{/if}
		{/snippet}
	</PageHeader>

	<div class="card overflow-auto p-6" data-testid="remote-tree">
		{#if view === "ancestors"}
			{#if tree.Ancestors.Parents.length === 0}<p
					class="mb-4 text-sm text-stone-500"
				>
					{$t("tree.noParents")}
				</p>{/if}
			<AncestorTree node={tree.Ancestors as never} root {linkFor} />
		{:else}
			{#if tree.Descendants.Children.length === 0 && tree.Descendants.Partners.length === 0}
				<p class="mb-4 text-sm text-stone-500">{$t("tree.noDescendants")}</p>
			{/if}
			<div class="inline-block min-w-full">
				<DescendantTree node={tree.Descendants as never} root {linkFor} />
			</div>
		{/if}
	</div>

	{#if tree.Siblings.length}
		<section class="mt-6">
			<h2 class="mb-3 text-lg font-semibold">{$t("tree.siblings")}</h2>
			<div class="flex flex-wrap gap-3">
				{#each tree.Siblings as s (s.Id)}<TreeCard
						person={s}
						{linkFor}
					/>{/each}
			</div>
		</section>
	{/if}
{/if}

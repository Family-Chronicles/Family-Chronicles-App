<script lang="ts">
	import { api } from "../lib/api/client";
	import type {
		LinkRelation,
		Peer,
		Person,
		PersonLinkEntry,
		RemotePerson,
	} from "../lib/api/types";
	import { formatDate, fullName } from "../lib/format";
	import { canEdit } from "../lib/state/session";
	import { href } from "../lib/router";
	import { notify, notifyError } from "../lib/state/toasts";
	import { t } from "../lib/i18n";
	import Modal from "./Modal.svelte";
	import ConfirmButton from "./ConfirmButton.svelte";

	/** Links of a person to persons on other instances (federation) */
	let {
		person,
		links,
		onchange,
	}: { person: Person; links: PersonLinkEntry[]; onchange: () => void } =
		$props();

	// --- view a remote person ---
	let viewOpen = $state(false);
	let viewLink = $state<PersonLinkEntry | null>(null);
	let remote = $state<RemotePerson | null>(null);
	let viewError = $state("");

	async function show(link: PersonLinkEntry) {
		viewLink = link;
		remote = null;
		viewError = "";
		viewOpen = true;
		try {
			remote = await api.federation.person(link.PeerId, link.RemotePersonId);
		} catch (e) {
			viewError = (e as Error).message;
		}
	}

	// --- add a link ---
	let addOpen = $state(false);
	let peers = $state<Peer[]>([]);
	let peerId = $state("");
	let query = $state("");
	let results = $state<RemotePerson[]>([]);
	let chosen = $state<RemotePerson | null>(null);
	let relation = $state<LinkRelation>("SamePerson");
	let notes = $state("");
	let busy = $state(false);

	async function openAdd() {
		chosen = null;
		results = [];
		query = fullName(person);
		relation = "SamePerson";
		notes = "";
		addOpen = true;
		try {
			peers = (await api.federation.peers()).filter((p) => p.Status === "Ok");
			peerId = peers[0]?.Id ?? "";
		} catch (e) {
			notifyError(e);
		}
	}

	async function search(e: SubmitEvent) {
		e.preventDefault();
		if (!peerId) return;
		busy = true;
		try {
			results = await api.federation.search(peerId, query);
			chosen = null;
		} catch (err) {
			notifyError(err);
		} finally {
			busy = false;
		}
	}

	async function save() {
		if (!chosen) return;
		busy = true;
		try {
			await api.federation.addLink({
				PersonId: person.Id,
				PeerId: peerId,
				RemotePersonId: chosen.Id,
				Relation: relation,
				Notes: notes,
			});
			notify($t("federation.linked"));
			addOpen = false;
			onchange();
		} catch (e) {
			notifyError(e);
		} finally {
			busy = false;
		}
	}

	async function remove(link: PersonLinkEntry) {
		await api.federation.removeLink(link.Id);
		notify($t("federation.unlinked"));
		onchange();
	}

	const life = (p: RemotePerson) =>
		[
			p.DateOfBirth && `* ${formatDate(p.DateOfBirth)}`,
			p.DateOfDeath && `† ${formatDate(p.DateOfDeath)}`,
		]
			.filter(Boolean)
			.join("  ");
</script>

{#if links.length || $canEdit}
	<section class="card p-5">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-semibold">{$t("federation.links")}</h2>
			{#if $canEdit}<button class="btn-secondary" onclick={openAdd}
					>{$t("federation.addLink")}</button
				>{/if}
		</div>
		{#if links.length === 0}
			<p class="text-sm text-stone-500">{$t("federation.noLinks")}</p>
		{:else}
			<ul class="space-y-2" data-testid="person-links">
				{#each links as link (link.Id)}
					<li class="flex items-center gap-2 rounded-lg bg-bark-50 px-3 py-2">
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium text-bark-900">
								{link.RemoteName}
							</p>
							<p class="text-xs text-stone-500">
								{$t(`federation.relations.${link.Relation}`)} · {link.PeerName ??
									"?"}
							</p>
						</div>
						<button class="btn-ghost text-xs" onclick={() => show(link)}
							>{$t("federation.show")}</button
						>
						<a
							class="btn-ghost text-xs"
							href={href(
								`/federation/${link.PeerId}/persons/${encodeURIComponent(link.RemotePersonId)}/tree`,
							)}>{$t("federation.remoteTree")}</a
						>
						{#if $canEdit}
							<ConfirmButton
								class="btn-ghost text-xs text-red-700"
								message={$t("federation.unlinkMessage")}
								confirmLabel={$t("common.remove")}
								onconfirm={() => remove(link)}
								>✕<span class="sr-only">{$t("common.remove")}</span
								></ConfirmButton
							>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<Modal
	bind:open={viewOpen}
	title={viewLink
		? $t("federation.remoteTitle", {
				name: viewLink.RemoteName,
				instance: viewLink.PeerName ?? "?",
			})
		: ""}
	size="sm"
>
	{#if viewError}
		<p class="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
			{viewError}
		</p>
	{:else if remote}
		<dl class="space-y-2 text-sm" data-testid="remote-person">
			<div>
				<dt class="text-xs text-stone-500 uppercase">{$t("person.name")}</dt>
				<dd>{fullName(remote)}</dd>
			</div>
			{#if remote.BirthName}<div>
					<dt class="text-xs text-stone-500 uppercase">
						{$t("person.birthName")}
					</dt>
					<dd>{remote.BirthName}</dd>
				</div>{/if}
			{#if life(remote)}<div>
					<dt class="text-xs text-stone-500 uppercase">{$t("person.data")}</dt>
					<dd>{life(remote)}</dd>
				</div>{/if}
			{#if remote.PlaceOfBirth}<div>
					<dt class="text-xs text-stone-500 uppercase">
						{$t("person.placeOfBirth")}
					</dt>
					<dd>{remote.PlaceOfBirth}</dd>
				</div>{/if}
			{#if remote.PlaceOfDeath}<div>
					<dt class="text-xs text-stone-500 uppercase">
						{$t("person.placeOfDeath")}
					</dt>
					<dd>{remote.PlaceOfDeath}</dd>
				</div>{/if}
		</dl>
	{:else}
		<p class="text-sm text-stone-500">{$t("common.loading")}</p>
	{/if}
</Modal>

<Modal bind:open={addOpen} title={$t("federation.addLinkTitle")}>
	{#if peers.length === 0}
		<p class="text-sm text-stone-600">{$t("federation.noPeersForLink")}</p>
	{:else}
		<div class="space-y-4">
			<div>
				<label class="label" for="link-peer">{$t("federation.instance")}</label>
				<select id="link-peer" class="input" bind:value={peerId}>
					{#each peers as p (p.Id)}<option value={p.Id}>{p.Name}</option>{/each}
				</select>
			</div>
			<form class="flex gap-2" onsubmit={search}>
				<div class="flex-1">
					<label class="sr-only" for="link-search"
						>{$t("federation.searchRemote")}</label
					>
					<input
						id="link-search"
						class="input"
						placeholder={$t("federation.searchRemote")}
						bind:value={query}
					/>
				</div>
				<button class="btn-secondary" disabled={busy}
					>{$t("common.search")}</button
				>
			</form>
			{#if results.length}
				<ul
					class="max-h-56 space-y-1 overflow-auto"
					role="listbox"
					aria-label={$t("federation.searchRemote")}
					data-testid="remote-results"
				>
					{#each results as r (r.Id)}
						<li role="option" aria-selected={chosen?.Id === r.Id}>
							<button
								type="button"
								class="w-full rounded-lg px-3 py-2 text-left text-sm {chosen?.Id ===
								r.Id
									? 'bg-bark-100'
									: 'hover:bg-bark-50'}"
								onclick={() => (chosen = r)}
							>
								<span class="font-medium">{fullName(r)}</span>
								<span class="text-stone-500">{life(r)}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			<div>
				<label class="label" for="link-relation"
					>{$t("federation.relation")}</label
				>
				<select id="link-relation" class="input" bind:value={relation}>
					<option value="SamePerson"
						>{$t("federation.relations.SamePerson")}</option
					>
					<option value="Relative">{$t("federation.relations.Relative")}</option
					>
				</select>
			</div>
			<div>
				<label class="label" for="link-notes">{$t("common.notes")}</label>
				<input id="link-notes" class="input" bind:value={notes} />
			</div>
		</div>
	{/if}
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (addOpen = false)}
			>{$t("common.cancel")}</button
		>
		{#if peers.length}<button
				class="btn-primary"
				disabled={busy || !chosen}
				onclick={save}>{$t("common.save")}</button
			>{/if}
	{/snippet}
</Modal>

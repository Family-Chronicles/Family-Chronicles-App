<script lang="ts">
	import { onMount } from "svelte";
	import { api } from "../lib/api/client";
	import type { ApiToken, Peer, PeerRequest, User } from "../lib/api/types";
	import { notify, notifyError } from "../lib/state/toasts";
	import { autoReload } from "../lib/state/live";
	import { t } from "../lib/i18n";
	import PageHeader from "../components/PageHeader.svelte";
	import Modal from "../components/Modal.svelte";
	import ConfirmButton from "../components/ConfirmButton.svelte";

	let peers = $state<Peer[]>([]);
	let tokens = $state<ApiToken[]>([]);
	let users = $state<User[]>([]);
	let requests = $state<PeerRequest[]>([]);

	const statusStyle = {
		Ok: "bg-moss-500/15 text-moss-600",
		Unreachable: "bg-amber-100 text-amber-800",
		Unauthorized: "bg-red-100 text-red-800",
	};
	const day = (iso: string) => new Date(iso).toLocaleDateString();

	async function load() {
		try {
			[peers, tokens, users, requests] = await Promise.all([
				api.federation.peers(),
				api.tokens.list(),
				api.users.list(),
				api.federation.requests(),
			]);
		} catch (e) {
			notifyError(e);
		}
	}
	onMount(() => {
		load();
		return autoReload(["peers", "users", "peerRequests", "apiTokens"], load);
	});

	// --- connect an instance ---
	let peerOpen = $state(false);
	let peerName = $state("");
	let peerUrl = $state("");
	let peerToken = $state("");
	let mutual = $state(false);
	let message = $state("");
	let busy = $state(false);

	function openPeer() {
		peerName = peerUrl = peerToken = message = "";
		mutual = false;
		peerOpen = true;
	}

	async function connect() {
		busy = true;
		try {
			const peer = await api.federation.addPeer({
				Name: peerName,
				BaseUrl: peerUrl,
				Token: peerToken,
				Mutual: mutual,
				Message: message,
			});
			notify($t("federation.connected"));
			if (peer.RequestSent) notify($t("federation.requestSent"));
			if (peer.RequestError)
				notify(
					$t("federation.requestFailed", { error: peer.RequestError }),
					"error",
				);
			peerOpen = false;
			await load();
		} catch (e) {
			notifyError(e);
		} finally {
			busy = false;
		}
	}

	async function check(peer: Peer) {
		try {
			await api.federation.checkPeer(peer.Id);
			await load();
		} catch (e) {
			notifyError(e);
		}
	}

	async function removePeer(peer: Peer) {
		await api.federation.removePeer(peer.Id);
		notify($t("federation.removed"));
		await load();
	}

	async function accept(r: PeerRequest) {
		try {
			await api.federation.acceptRequest(r.Id);
			notify($t("federation.accepted"));
			await load();
		} catch (e) {
			notifyError(e);
		}
	}

	async function decline(r: PeerRequest) {
		await api.federation.declineRequest(r.Id);
		notify($t("federation.declined"));
		await load();
	}

	// --- API tokens ---
	let tokenOpen = $state(false);
	let tokenName = $state("");
	let tokenUser = $state("");
	let tokenDays = $state<number | null>(null);
	let created = $state<string | null>(null);

	function openToken() {
		tokenName = "";
		tokenUser =
			users.find((u) => u.Role === "Viewer")?.Id ?? users[0]?.Id ?? "";
		tokenDays = null;
		created = null;
		tokenOpen = true;
	}

	async function createToken() {
		busy = true;
		try {
			const result = await api.tokens.create({
				UserId: tokenUser,
				Name: tokenName,
				ExpiresInDays: tokenDays || null,
			});
			created = result.Token ?? null;
			await load();
		} catch (e) {
			notifyError(e);
		} finally {
			busy = false;
		}
	}

	async function copy() {
		if (!created) return;
		try {
			await navigator.clipboard.writeText(created);
			notify($t("federation.copied"));
		} catch {
			// clipboard not available – the token stays visible for manual copying
		}
	}

	async function revoke(token: ApiToken) {
		await api.tokens.remove(token.Id);
		notify($t("federation.revoked"));
		await load();
	}

	const userName = (id: string) => users.find((u) => u.Id === id)?.Name ?? "?";
</script>

<PageHeader
	title={$t("federation.title")}
	subtitle={$t("federation.subtitle")}
/>

{#if requests.length}
	<section class="card mb-6 border-bark-300 p-5" data-testid="peer-requests">
		<h2 class="text-lg font-semibold">{$t("federation.requests")}</h2>
		<p class="mb-3 text-sm text-stone-600">{$t("federation.requestsHint")}</p>
		<ul class="divide-y divide-bark-50">
			{#each requests as r (r.Id)}
				<li class="flex flex-wrap items-center gap-2 py-3">
					<div class="min-w-0 flex-1">
						<p class="font-medium text-bark-900">{r.Name}</p>
						<p class="truncate text-xs text-stone-500">
							{r.BaseUrl} · {day(r.CreatedAt)}
						</p>
						{#if r.Message}<p class="mt-1 text-sm text-stone-700">
								„{r.Message}“
							</p>{/if}
					</div>
					<button class="btn-primary" onclick={() => accept(r)}
						>{$t("federation.accept")}</button
					>
					<button class="btn-ghost text-red-700" onclick={() => decline(r)}
						>{$t("federation.decline")}</button
					>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
	<section class="card p-5">
		<div class="mb-1 flex items-center justify-between">
			<h2 class="text-lg font-semibold">{$t("federation.peers")}</h2>
			<button class="btn-secondary" onclick={openPeer}
				>{$t("federation.addPeer")}</button
			>
		</div>
		<p class="mb-4 text-sm text-stone-600">{$t("federation.peersHint")}</p>
		{#if peers.length === 0}
			<p class="text-sm text-stone-500">{$t("federation.noPeers")}</p>
		{:else}
			<ul class="divide-y divide-bark-50" data-testid="peer-list">
				{#each peers as peer (peer.Id)}
					<li class="flex flex-wrap items-center gap-2 py-3">
						<div class="min-w-0 flex-1">
							<p class="font-medium text-bark-900">{peer.Name}</p>
							<p class="truncate text-xs text-stone-500">{peer.BaseUrl}</p>
						</div>
						<span
							class="chip {statusStyle[peer.Status]}"
							title={$t("federation.checkedAt", { date: day(peer.CheckedAt) })}
							>{$t(`federation.status.${peer.Status}`)}</span
						>
						<button class="btn-ghost text-xs" onclick={() => check(peer)}
							>{$t("federation.check")}</button
						>
						<ConfirmButton
							class="btn-ghost text-xs text-red-700"
							message={$t("federation.removePeerMessage", { name: peer.Name })}
							confirmLabel={$t("federation.removePeer")}
							onconfirm={() => removePeer(peer)}
							>{$t("federation.removePeer")}</ConfirmButton
						>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="card p-5">
		<div class="mb-1 flex items-center justify-between">
			<h2 class="text-lg font-semibold">{$t("federation.tokens")}</h2>
			<button class="btn-secondary" onclick={openToken}
				>{$t("federation.addToken")}</button
			>
		</div>
		<p class="mb-4 text-sm text-stone-600">{$t("federation.tokensHint")}</p>
		{#if tokens.length === 0}
			<p class="text-sm text-stone-500">{$t("federation.noTokens")}</p>
		{:else}
			<ul class="divide-y divide-bark-50" data-testid="token-list">
				{#each tokens as token (token.Id)}
					<li class="flex items-center gap-2 py-3">
						<div class="min-w-0 flex-1">
							<p class="font-medium text-bark-900">{token.Name}</p>
							<p class="text-xs text-stone-500">
								{userName(token.UserId)} ·
								{token.LastUsedAt
									? $t("federation.lastUsed", { date: day(token.LastUsedAt) })
									: $t("federation.neverUsed")}
								{#if token.ExpiresAt}· {$t("federation.expires", {
										date: day(token.ExpiresAt),
									})}{/if}
							</p>
						</div>
						<ConfirmButton
							class="btn-ghost text-xs text-red-700"
							message={$t("federation.revokeMessage")}
							confirmLabel={$t("federation.revoke")}
							onconfirm={() => revoke(token)}
							>{$t("federation.revoke")}</ConfirmButton
						>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<Modal bind:open={peerOpen} title={$t("federation.addPeerTitle")}>
	<div class="space-y-4">
		<div>
			<label class="label" for="peer-name">{$t("federation.peerName")}</label>
			<input
				id="peer-name"
				class="input"
				placeholder={$t("federation.peerNameHint")}
				bind:value={peerName}
			/>
		</div>
		<div>
			<label class="label" for="peer-url">{$t("federation.peerUrl")}</label>
			<input
				id="peer-url"
				class="input"
				type="url"
				placeholder="https://chronik.example.org"
				bind:value={peerUrl}
			/>
		</div>
		<div>
			<label class="label" for="peer-token">{$t("federation.peerToken")}</label>
			<input
				id="peer-token"
				class="input font-mono"
				autocomplete="off"
				bind:value={peerToken}
			/>
			<p class="mt-1 text-xs text-stone-500">
				{$t("federation.peerTokenHint")}
			</p>
		</div>
		<label class="flex items-start gap-2 text-sm">
			<input
				id="peer-mutual"
				type="checkbox"
				class="mt-1 accent-bark-700"
				bind:checked={mutual}
			/>
			<span
				>{$t("federation.mutual")}<span class="block text-xs text-stone-500"
					>{$t("federation.mutualHint")}</span
				></span
			>
		</label>
		{#if mutual}
			<div>
				<label class="label" for="peer-message"
					>{$t("federation.message")}</label
				>
				<input id="peer-message" class="input" bind:value={message} />
			</div>
		{/if}
	</div>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (peerOpen = false)}
			>{$t("common.cancel")}</button
		>
		<button
			class="btn-primary"
			disabled={busy || !peerName || !peerUrl || !peerToken}
			onclick={connect}>{$t("federation.connect")}</button
		>
	{/snippet}
</Modal>

<Modal
	bind:open={tokenOpen}
	title={created
		? $t("federation.tokenCreated")
		: $t("federation.addTokenTitle")}
>
	{#if created}
		<div class="space-y-3">
			<p class="text-sm text-stone-700">{$t("federation.tokenOnce")}</p>
			<code
				class="block rounded-lg bg-bark-50 p-3 text-sm break-all"
				data-testid="created-token">{created}</code
			>
		</div>
	{:else}
		<div class="space-y-4">
			<div>
				<label class="label" for="token-name"
					>{$t("federation.tokenName")}</label
				>
				<input
					id="token-name"
					class="input"
					placeholder={$t("federation.tokenNameHint")}
					bind:value={tokenName}
				/>
			</div>
			<div>
				<label class="label" for="token-user"
					>{$t("federation.tokenUser")}</label
				>
				<select id="token-user" class="input" bind:value={tokenUser}>
					{#each users as u (u.Id)}<option value={u.Id}
							>{u.Name} ({u.Role})</option
						>{/each}
				</select>
			</div>
			<div>
				<label class="label" for="token-days"
					>{$t("federation.tokenExpires")}</label
				>
				<input
					id="token-days"
					class="input"
					type="number"
					min="1"
					max="3650"
					bind:value={tokenDays}
				/>
			</div>
		</div>
	{/if}
	{#snippet footer()}
		{#if created}
			<button class="btn-secondary" onclick={copy}
				>{$t("federation.copy")}</button
			>
			<button class="btn-primary" onclick={() => (tokenOpen = false)}
				>{$t("common.close")}</button
			>
		{:else}
			<button class="btn-secondary" onclick={() => (tokenOpen = false)}
				>{$t("common.cancel")}</button
			>
			<button
				class="btn-primary"
				disabled={busy || !tokenName || !tokenUser}
				onclick={createToken}>{$t("federation.create")}</button
			>
		{/if}
	{/snippet}
</Modal>

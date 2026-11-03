<script lang="ts">
	import { api } from "../lib/api/client";
	import { currentUser } from "../lib/state/session";
	import { notify, notifyError } from "../lib/state/toasts";
	import PageHeader from "../components/PageHeader.svelte";

	let current = $state("");
	let next = $state("");
	let repeat = $state("");
	let busy = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		try {
			await api.changePassword(current, next);
			notify("Passwort geändert.");
			current = next = repeat = "";
		} catch (err) {
			notifyError(err);
		} finally {
			busy = false;
		}
	}
</script>

<PageHeader title="Mein Konto" />

<div class="grid gap-6 lg:grid-cols-2">
	<section class="card p-5">
		<h2 class="mb-3 text-lg font-semibold">Profil</h2>
		<dl class="space-y-2 text-sm">
			<div>
				<dt class="text-xs text-stone-500 uppercase">Name</dt>
				<dd>{$currentUser?.Name}</dd>
			</div>
			<div>
				<dt class="text-xs text-stone-500 uppercase">E-Mail</dt>
				<dd>{$currentUser?.Email}</dd>
			</div>
			<div>
				<dt class="text-xs text-stone-500 uppercase">Rolle</dt>
				<dd>{$currentUser?.Role}</dd>
			</div>
		</dl>
	</section>
	<form class="card space-y-4 p-5" onsubmit={submit}>
		<h2 class="text-lg font-semibold">Passwort ändern</h2>
		<div>
			<label class="label" for="pw-cur">Aktuelles Passwort</label><input
				id="pw-cur"
				class="input"
				type="password"
				autocomplete="current-password"
				required
				bind:value={current}
			/>
		</div>
		<div>
			<label class="label" for="pw-new">Neues Passwort</label><input
				id="pw-new"
				class="input"
				type="password"
				autocomplete="new-password"
				minlength="8"
				required
				bind:value={next}
			/>
		</div>
		<div>
			<label class="label" for="pw-rep">Wiederholen</label>
			<input
				id="pw-rep"
				class="input"
				type="password"
				autocomplete="new-password"
				required
				bind:value={repeat}
			/>
			{#if repeat && repeat !== next}<p class="mt-1 text-xs text-red-700">
					Die Passwörter stimmen nicht überein.
				</p>{/if}
		</div>
		<button
			class="btn-primary"
			disabled={busy || next.length < 8 || next !== repeat}
			>Passwort ändern</button
		>
	</form>
</div>

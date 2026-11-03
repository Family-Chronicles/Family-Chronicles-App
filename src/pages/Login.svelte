<script lang="ts">
	import { api } from "../lib/api/client";
	import { setSession } from "../lib/state/session";

	let email = $state("");
	let password = $state("");
	let error = $state("");
	let busy = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = "";
		try {
			const { token, user } = await api.login(email, password);
			setSession(token, user);
		} catch (err) {
			error =
				(err as { status?: number }).status === 401
					? "E-Mail oder Passwort ist falsch."
					: (err as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-bark-50 via-paper to-bark-100 p-4"
>
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<img src="/favicon.svg" alt="" class="mx-auto h-16 w-16" />
			<h1 class="mt-4 text-3xl font-semibold text-bark-900">
				Family Chronicles
			</h1>
			<p class="mt-1 text-stone-600">Die Geschichte deiner Familie</p>
		</div>
		<form class="card space-y-4 p-6" onsubmit={submit}>
			<div>
				<label class="label" for="email">E-Mail</label>
				<input
					id="email"
					class="input"
					type="email"
					autocomplete="username"
					required
					bind:value={email}
				/>
			</div>
			<div>
				<label class="label" for="password">Passwort</label>
				<input
					id="password"
					class="input"
					type="password"
					autocomplete="current-password"
					required
					bind:value={password}
				/>
			</div>
			{#if error}<p
					class="rounded-lg bg-red-50 p-3 text-sm text-red-800"
					role="alert"
				>
					{error}
				</p>{/if}
			<button class="btn-primary w-full" disabled={busy}
				>{busy ? "Anmelden …" : "Anmelden"}</button
			>
		</form>
	</div>
</div>

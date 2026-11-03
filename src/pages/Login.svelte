<script lang="ts">
	import { api } from "../lib/api/client";
	import { setSession } from "../lib/state/session";
	import { LOCALES, locale, setLocale, t, type Locale } from "../lib/i18n";

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
					? $t("login.wrong")
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
				{$t("app.name")}
			</h1>
			<p class="mt-1 text-stone-600">{$t("app.tagline")}</p>
		</div>
		<form class="card space-y-4 p-6" onsubmit={submit}>
			<div>
				<label class="label" for="email">{$t("login.email")}</label>
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
				<label class="label" for="password">{$t("login.password")}</label>
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
				>{busy ? $t("login.submitting") : $t("login.submit")}</button
			>
		</form>
		<div
			class="mt-4 flex justify-center gap-2 text-sm"
			role="group"
			aria-label={$t("nav.language")}
		>
			{#each LOCALES as l (l.code)}
				<button
					class="rounded px-2 py-1 {$locale === l.code
						? 'font-semibold text-bark-800'
						: 'text-stone-500'}"
					aria-pressed={$locale === l.code}
					onclick={() => setLocale(l.code as Locale)}>{l.label}</button
				>
			{/each}
		</div>
	</div>
</div>

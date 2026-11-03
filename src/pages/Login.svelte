<script lang="ts">
	import { onMount } from "svelte";
	import { api } from "../lib/api/client";
	import { setSession } from "../lib/state/session";
	import { LOCALES, locale, setLocale, t, type Locale } from "../lib/i18n";

	let email = $state("");
	let password = $state("");
	let error = $state("");
	let busy = $state(false);

	// "forgot password" is only offered when the server can send mails
	let resetAvailable = $state(false);
	let mode = $state<"login" | "forgot" | "sent">("login");
	onMount(() => {
		api
			.authConfig()
			.then((c) => (resetAvailable = c.passwordReset))
			.catch(() => undefined);
	});

	async function requestReset(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = "";
		try {
			await api.requestPasswordReset(email);
			mode = "sent";
		} catch (err) {
			error = (err as Error).message;
		} finally {
			busy = false;
		}
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = "";
		try {
			const { token, refreshToken, user } = await api.login(email, password);
			setSession(token, user, refreshToken);
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
		{#if mode === "login"}
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
				{#if resetAvailable}
					<button
						type="button"
						class="link text-sm"
						onclick={() => ((mode = "forgot"), (error = ""))}
						>{$t("reset.forgot")}</button
					>
				{/if}
				<button class="btn-primary w-full" disabled={busy}
					>{busy ? $t("login.submitting") : $t("login.submit")}</button
				>
			</form>
		{:else if mode === "forgot"}
			<form class="card space-y-4 p-6" onsubmit={requestReset}>
				<h2 class="text-lg font-semibold">{$t("reset.requestTitle")}</h2>
				<p class="text-sm text-stone-600">{$t("reset.requestHint")}</p>
				<div>
					<label class="label" for="reset-email">{$t("login.email")}</label>
					<input
						id="reset-email"
						class="input"
						type="email"
						autocomplete="username"
						required
						bind:value={email}
					/>
				</div>
				{#if error}<p
						class="rounded-lg bg-red-50 p-3 text-sm text-red-800"
						role="alert"
					>
						{error}
					</p>{/if}
				<button class="btn-primary w-full" disabled={busy}
					>{$t("reset.send")}</button
				>
				<button
					type="button"
					class="link text-sm"
					onclick={() => (mode = "login")}>{$t("reset.back")}</button
				>
			</form>
		{:else}
			<div class="card space-y-4 p-6" role="status">
				<p class="text-sm">{$t("reset.sent")}</p>
				<button class="link text-sm" onclick={() => (mode = "login")}
					>{$t("reset.back")}</button
				>
			</div>
		{/if}
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

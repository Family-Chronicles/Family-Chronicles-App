<script lang="ts">
	import { api, ApiError } from "../lib/api/client";
	import { currentRoute, go } from "../lib/router";
	import { t } from "../lib/i18n";

	/** Opened from the link in the reset email: #/reset-password?token=… */
	let token = $derived(String($currentRoute.query.token ?? ""));
	let password = $state("");
	let repeat = $state("");
	let busy = $state(false);
	let error = $state("");
	let done = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = "";
		try {
			await api.confirmPasswordReset(token, password);
			done = true;
		} catch (err) {
			error =
				err instanceof ApiError &&
				err.status === 400 &&
				!Object.keys(err.fieldErrors).length
					? $t("reset.invalid")
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
				{$t("reset.title")}
			</h1>
		</div>
		{#if done}
			<div class="card space-y-4 p-6" role="status">
				<p class="text-sm">{$t("reset.done")}</p>
				<button class="btn-primary w-full" onclick={() => go("/")}
					>{$t("login.submit")}</button
				>
			</div>
		{:else if !token}
			<div class="card space-y-4 p-6">
				<p class="text-sm text-red-800">{$t("reset.invalid")}</p>
				<button class="btn-secondary w-full" onclick={() => go("/")}
					>{$t("reset.back")}</button
				>
			</div>
		{:else}
			<form class="card space-y-4 p-6" onsubmit={submit}>
				<div>
					<label class="label" for="reset-new">{$t("reset.new")}</label>
					<input
						id="reset-new"
						class="input"
						type="password"
						autocomplete="new-password"
						minlength="8"
						required
						bind:value={password}
					/>
					<p class="mt-1 text-xs text-stone-500">{$t("users.passwordHint")}</p>
				</div>
				<div>
					<label class="label" for="reset-repeat">{$t("reset.repeat")}</label>
					<input
						id="reset-repeat"
						class="input"
						type="password"
						autocomplete="new-password"
						required
						bind:value={repeat}
					/>
					{#if repeat && repeat !== password}<p
							class="mt-1 text-xs text-red-700"
						>
							{$t("account.mismatch")}
						</p>{/if}
				</div>
				{#if error}<p
						class="rounded-lg bg-red-50 p-3 text-sm text-red-800"
						role="alert"
					>
						{error}
					</p>{/if}
				<button
					class="btn-primary w-full"
					disabled={busy || password.length < 8 || password !== repeat}
					>{$t("reset.submit")}</button
				>
			</form>
		{/if}
	</div>
</div>

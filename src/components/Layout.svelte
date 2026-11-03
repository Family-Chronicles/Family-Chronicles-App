<script lang="ts">
	import type { Snippet } from "svelte";
	import { currentRoute, go, href } from "../lib/router";
	import {
		canEdit,
		clearSession,
		getRefreshToken,
		currentUser,
		isAdmin,
	} from "../lib/state/session";
	import { liveConnected } from "../lib/state/live";
	import { api } from "../lib/api/client";
	import { LOCALES, locale, setLocale, t, type Locale } from "../lib/i18n";

	let { children }: { children: Snippet } = $props();
	let menuOpen = $state(false);

	const links = $derived([
		{ path: "/", label: $t("nav.dashboard") },
		{ path: "/persons", label: $t("nav.persons") },
		{ path: "/families", label: $t("nav.families") },
		...($canEdit ? [{ path: "/gedcom", label: $t("nav.gedcom") }] : []),
		...($isAdmin ? [{ path: "/users", label: $t("nav.users") }] : []),
	]);

	function logout() {
		const refreshToken = getRefreshToken();
		// end the session on the server too; leave the page right away anyway
		if (refreshToken) api.logout(refreshToken).catch(() => undefined);
		clearSession();
		go("/");
	}

	const active = (path: string, current: string) =>
		path === "/"
			? current === "/"
			: current === path || current.startsWith(path + "/");
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 btn-primary"
>
	{$t("app.skip")}
</a>

<header
	class="sticky top-0 z-30 border-b border-bark-100 bg-white/90 backdrop-blur"
>
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
		<a
			href={href("/")}
			class="flex items-center gap-2 font-serif text-lg font-semibold text-bark-800"
		>
			<img src="/favicon.svg" alt="" class="h-8 w-8" />
			<span class="hidden sm:inline">{$t("app.name")}</span>
		</a>

		<nav class="hidden flex-1 gap-1 md:flex" aria-label={$t("nav.main")}>
			{#each links as l (l.path)}
				<a
					href={href(l.path)}
					class="rounded-lg px-3 py-2 text-sm font-medium transition {active(
						l.path,
						$currentRoute.path,
					)
						? 'bg-bark-100 text-bark-900'
						: 'text-stone-600 hover:bg-bark-50 hover:text-bark-800'}"
					aria-current={active(l.path, $currentRoute.path) ? "page" : undefined}
					>{l.label}</a
				>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-2">
			<span
				class="h-2 w-2 rounded-full {$liveConnected
					? 'bg-moss-500'
					: 'bg-stone-300'}"
				title={$liveConnected ? "Live" : "Offline"}
				data-testid="live-indicator"
				data-connected={$liveConnected}
			></span>
			<label class="sr-only" for="locale">{$t("nav.language")}</label>
			<select
				id="locale"
				class="rounded-md border-0 bg-transparent py-1 text-sm text-stone-600 hover:bg-bark-50"
				value={$locale}
				onchange={(e) => setLocale(e.currentTarget.value as Locale)}
			>
				{#each LOCALES as l (l.code)}<option value={l.code}
						>{l.code.toUpperCase()}</option
					>{/each}
			</select>
			<a href={href("/account")} class="hidden text-right text-sm sm:block">
				<span class="block font-medium text-bark-900">{$currentUser?.Name}</span
				>
				<span class="block text-xs text-stone-500">{$currentUser?.Role}</span>
			</a>
			<button class="btn-ghost" onclick={logout}>{$t("nav.logout")}</button>
			<button
				class="btn-ghost md:hidden"
				aria-expanded={menuOpen}
				aria-controls="mobile-nav"
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span class="sr-only">{$t("nav.menu")}</span>
				<svg
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg
				>
			</button>
		</div>
	</div>
	{#if menuOpen}
		<nav
			id="mobile-nav"
			class="border-t border-bark-100 px-4 py-2 md:hidden"
			aria-label={$t("nav.mobile")}
		>
			{#each [...links, { path: "/account", label: $t("nav.account") }] as l (l.path)}
				<a
					href={href(l.path)}
					onclick={() => (menuOpen = false)}
					class="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-bark-50"
					>{l.label}</a
				>
			{/each}
		</nav>
	{/if}
</header>

<main id="main" class="mx-auto max-w-6xl px-4 py-8">
	{@render children()}
</main>

<script lang="ts">
	import type { Snippet } from "svelte";
	import { currentRoute, go, href } from "../lib/router";
	import { clearSession, currentUser, isAdmin } from "../lib/state/session";

	let { children }: { children: Snippet } = $props();
	let menuOpen = $state(false);

	const links = $derived([
		{ path: "/", label: "Übersicht" },
		{ path: "/persons", label: "Personen" },
		{ path: "/families", label: "Familien" },
		...($isAdmin ? [{ path: "/users", label: "Benutzer" }] : []),
	]);

	function logout() {
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
	Zum Inhalt springen
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
			<span class="hidden sm:inline">Family Chronicles</span>
		</a>

		<nav class="hidden flex-1 gap-1 md:flex" aria-label="Hauptnavigation">
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
			<a href={href("/account")} class="hidden text-right text-sm sm:block">
				<span class="block font-medium text-bark-900">{$currentUser?.Name}</span
				>
				<span class="block text-xs text-stone-500">{$currentUser?.Role}</span>
			</a>
			<button class="btn-ghost" onclick={logout}>Abmelden</button>
			<button
				class="btn-ghost md:hidden"
				aria-expanded={menuOpen}
				aria-controls="mobile-nav"
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span class="sr-only">Menü</span>
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
			aria-label="Mobile Navigation"
		>
			{#each [...links, { path: "/account", label: "Mein Konto" }] as l (l.path)}
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

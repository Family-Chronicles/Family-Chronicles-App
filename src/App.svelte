<script lang="ts">
	import { currentRoute, type PageMeta } from "./lib/router";
	import { session, hasRole } from "./lib/state/session";
	import Login from "./pages/Login.svelte";
	import Layout from "./components/Layout.svelte";
	import Toasts from "./components/Toasts.svelte";
	import Forbidden from "./pages/Forbidden.svelte";

	let meta = $derived($currentRoute.matched?.meta as PageMeta | undefined);
	let allowed = $derived(!!$session && (!meta?.role || hasRole(meta.role)));

	$effect(() => {
		document.title = meta?.title
			? `${meta.title} · Family Chronicles`
			: "Family Chronicles";
	});
</script>

{#if !$session}
	<Login />
{:else}
	<Layout>
		{#if meta && allowed}
			{#key $currentRoute.path}
				<meta.page params={$currentRoute.params} />
			{/key}
		{:else if meta}
			<Forbidden />
		{/if}
	</Layout>
{/if}
<Toasts />

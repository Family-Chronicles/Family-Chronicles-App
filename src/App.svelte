<script lang="ts">
	import { t } from "./lib/i18n";
	import { startLive } from "./lib/state/live";
	import { onMount } from "svelte";
	import { currentRoute, type PageMeta } from "./lib/router";
	import { session, hasRole } from "./lib/state/session";
	import Login from "./pages/Login.svelte";
	import ResetPassword from "./pages/ResetPassword.svelte";
	import Layout from "./components/Layout.svelte";
	import Toasts from "./components/Toasts.svelte";
	import Forbidden from "./pages/Forbidden.svelte";

	onMount(startLive);

	let meta = $derived($currentRoute.matched?.meta as PageMeta | undefined);
	let allowed = $derived(!!$session && (!meta?.role || hasRole(meta.role)));

	$effect(() => {
		document.title = meta?.title
			? `${$t(meta.title)} · ${$t("app.name")}`
			: $t("app.name");
	});
</script>

{#if $currentRoute.path === "/reset-password"}
	<!-- reachable without login, from the link in the reset email -->
	<ResetPassword />
{:else if !$session}
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

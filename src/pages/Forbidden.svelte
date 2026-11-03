<script lang="ts">
	import { href } from "../lib/router";
	import { t } from "../lib/i18n";
</script>

<div class="py-16 text-center">
	<h1 class="text-3xl font-semibold text-bark-900">{$t("forbidden.title")}</h1>
	<p class="mt-2 text-stone-600">{$t("forbidden.text")}</p>
	<a class="btn-primary mt-6" href={href("/")}>{$t("common.toOverview")}</a>
</div>

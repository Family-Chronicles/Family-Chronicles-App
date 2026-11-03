<script lang="ts">
	import { t } from "../lib/i18n";
</script>

<div class="flex items-center gap-3 py-12 text-stone-500" role="status">
	<span
		class="h-5 w-5 animate-spin rounded-full border-2 border-bark-200 border-t-bark-600"
	></span>
	{$t("common.loading")}
</div>

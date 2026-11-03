<script lang="ts">
	import type { Source } from "../lib/api/types";
	import { t } from "../lib/i18n";

	let { sources = $bindable([]) }: { sources?: Source[] } = $props();

	function add() {
		sources = [...sources, { Title: "", Citation: "", Url: null }];
	}
	function remove(index: number) {
		sources = sources.filter((_, i) => i !== index);
	}
</script>

<fieldset class="space-y-3">
	<legend class="mb-2 text-lg font-semibold text-bark-900"
		>{$t("sources.title")}</legend
	>
	{#each sources as src, i (i)}
		<div
			class="grid gap-3 rounded-lg border border-bark-100 bg-bark-50/50 p-3 sm:grid-cols-[1fr_1fr_auto]"
			data-testid="source-row"
		>
			<div>
				<label class="label" for="src-title-{i}"
					>{$t("sources.sourceTitle")} *</label
				>
				<input
					id="src-title-{i}"
					class="input"
					required
					placeholder={$t("sources.sourceHint")}
					bind:value={src.Title}
				/>
			</div>
			<div>
				<label class="label" for="src-cit-{i}">{$t("sources.citation")}</label>
				<input
					id="src-cit-{i}"
					class="input"
					placeholder={$t("sources.citationHint")}
					bind:value={src.Citation}
				/>
			</div>
			<button
				type="button"
				class="btn-ghost self-end text-red-700"
				onclick={() => remove(i)}
				aria-label={$t("sources.remove")}>✕</button
			>
			<div class="sm:col-span-3">
				<label class="label" for="src-url-{i}">{$t("sources.url")}</label>
				<input
					id="src-url-{i}"
					class="input"
					type="url"
					placeholder="https://"
					value={src.Url ?? ""}
					oninput={(e) => (src.Url = e.currentTarget.value.trim() || null)}
				/>
			</div>
		</div>
	{/each}
	<button type="button" class="btn-secondary" onclick={add}
		>{$t("sources.add")}</button
	>
</fieldset>

<script lang="ts">
	import { api } from "../lib/api/client";
	import { href } from "../lib/router";
	import { notify, notifyError } from "../lib/state/toasts";
	import { t } from "../lib/i18n";
	import PageHeader from "../components/PageHeader.svelte";

	type ImportResult = Awaited<ReturnType<typeof api.gedcom.import>>;

	let files = $state<FileList | undefined>();
	let familyName = $state("");
	let importing = $state(false);
	let result = $state<ImportResult | null>(null);
	let exporting = $state(false);

	async function runImport(e: SubmitEvent) {
		e.preventDefault();
		const file = files?.[0];
		if (!file) return;
		importing = true;
		result = null;
		try {
			result = await api.gedcom.import(file, familyName.trim() || undefined);
			notify(
				$t("gedcom.result", {
					persons: result.Persons,
					relationships: result.Relationships,
				}),
			);
		} catch (err) {
			notifyError(err);
		} finally {
			importing = false;
		}
	}

	async function runExport(withMedia: boolean) {
		exporting = true;
		try {
			const blob = await api.gedcom.export(withMedia);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `family-chronicles-${new Date().toISOString().slice(0, 10)}.${withMedia ? "zip" : "ged"}`;
			link.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			notify($t("gedcom.exported"));
		} catch (err) {
			notifyError(err);
		} finally {
			exporting = false;
		}
	}
</script>

<PageHeader title={$t("gedcom.title")} subtitle={$t("gedcom.subtitle")} />

<div class="grid gap-6 lg:grid-cols-2">
	<form class="card space-y-4 p-5" onsubmit={runImport}>
		<h2 class="text-lg font-semibold">{$t("gedcom.importTitle")}</h2>
		<p class="text-sm text-stone-600">{$t("gedcom.importHint")}</p>
		<div>
			<label class="label" for="ged-file">{$t("gedcom.file")}</label>
			<input
				id="ged-file"
				class="input"
				type="file"
				accept=".ged,.gedcom,.zip,text/plain,application/zip"
				bind:files
				required
			/>
		</div>
		<div>
			<label class="label" for="ged-family">{$t("gedcom.familyName")}</label>
			<input id="ged-family" class="input" bind:value={familyName} />
			<p class="mt-1 text-xs text-stone-500">{$t("gedcom.familyHint")}</p>
		</div>
		<button class="btn-primary" disabled={importing || !files?.length}>
			{importing ? $t("gedcom.importing") : $t("gedcom.import")}
		</button>

		{#if result}
			<div
				class="rounded-lg bg-bark-50 p-4 text-sm"
				role="status"
				data-testid="import-result"
			>
				<p class="font-medium text-bark-900">
					{$t("gedcom.result", {
						persons: result.Persons,
						relationships: result.Relationships,
					})}
				</p>
				{#if result.Media}<p class="text-stone-700">
						{$t("gedcom.resultMedia", { count: result.Media })}
					</p>{/if}
				{#if result.FamilyId}
					<a
						class="link mt-1 inline-block"
						href={href(`/families/${result.FamilyId}`)}
						>{$t("gedcom.openFamily")}</a
					>
				{/if}
				{#if result.Warnings.length}
					<h3 class="mt-3 font-medium">{$t("gedcom.warnings")}</h3>
					<ul class="mt-1 max-h-48 list-disc overflow-auto pl-5 text-stone-700">
						{#each result.Warnings as warning, i (i)}<li>{warning}</li>{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</form>

	<section class="card space-y-4 p-5">
		<h2 class="text-lg font-semibold">{$t("gedcom.exportTitle")}</h2>
		<p class="text-sm text-stone-600">{$t("gedcom.exportHint")}</p>
		<div class="flex flex-wrap gap-2">
			<button
				class="btn-secondary"
				disabled={exporting}
				onclick={() => runExport(false)}>{$t("gedcom.export")}</button
			>
			<button
				class="btn-secondary"
				disabled={exporting}
				onclick={() => runExport(true)}>{$t("gedcom.exportZip")}</button
			>
		</div>
	</section>
</div>
